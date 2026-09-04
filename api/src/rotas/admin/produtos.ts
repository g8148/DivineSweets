import { produtoAdminSchema, produtoSchema } from '@divine/shared';
import { asc, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { z } from 'zod';
import { db, type Executor } from '../../db/client.ts';
import { gruposOpcoes, produtos, produtosGrupos } from '../../db/schema.ts';
import { ErroApi, erroDeValidacao } from '../../erros.ts';
import { exigirAdmin, exigirSessao, type Variables } from '../../middleware/sessao.ts';
import { carregarProduto } from '../produtos.ts';

/**
 * Gera um id legível a partir do nome: "Cookie de Pistache" →
 * "cookie-de-pistache-mf3k1a". O sufixo em base 36 é o que impede que renomear
 * um produto para o nome de outro derrube a chave primária; o prefixo legível é
 * o que deixa a URL e o log compreensíveis.
 */
function idPor(nome: string) {
  const base = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  // Nome só de símbolos ("♥") deixaria a base vazia e o id começaria com "-".
  return `${base || 'produto'}-${Date.now().toString(36)}`;
}

/**
 * Confere que todo grupo informado existe antes de gravar. Sem isto o Postgres
 * recusa pela chave estrangeira e o erro chega como 500: quem administra veria
 * "Erro interno do servidor" por ter digitado um id de grupo errado.
 */
async function conferirGrupos(gruposIds: string[], exec: Executor) {
  if (gruposIds.length === 0) return;

  const existentes = await exec
    .select({ id: gruposOpcoes.id })
    .from(gruposOpcoes)
    .where(inArray(gruposOpcoes.id, gruposIds));

  const conhecidos = new Set(existentes.map((g) => g.id));
  const desconhecidos = gruposIds.filter((id) => !conhecidos.has(id));
  if (desconhecidos.length > 0) {
    throw new ErroApi(
      400,
      `Grupo de opções não encontrado: ${desconhecidos.join(', ')}`,
      'grupo_desconhecido',
    );
  }
}

/**
 * Regrava os vínculos com os grupos, na ordem em que vieram — é essa ordem que
 * a tela de personalização usa para empilhar os seletores. Recebe o executor
 * porque apaga antes de inserir: fora de uma transação, uma falha no insert
 * deixaria o produto sem grupo nenhum.
 */
async function regravarGrupos(produtoId: string, gruposIds: string[], exec: Executor) {
  await exec.delete(produtosGrupos).where(eq(produtosGrupos.produtoId, produtoId));
  if (gruposIds.length > 0) {
    await exec
      .insert(produtosGrupos)
      .values(gruposIds.map((grupoId, ordem) => ({ produtoId, grupoId, ordem })));
  }
}

export const rotasAdminProdutos = new Hono<{ Variables: Variables }>()
  .use('*', exigirSessao, exigirAdmin)
  .get(
    '/',
    describeRoute({
      description:
        'Lista o catálogo inteiro, inclusive os produtos desativados — é a única visão em que eles reaparecem para serem reativados.',
      responses: {
        200: {
          description: 'Catálogo completo',
          content: { 'application/json': { schema: resolver(z.array(produtoSchema)) } },
        },
      },
    }),
    async (c) => {
      const linhas = await db
        .select({ id: produtos.id })
        .from(produtos)
        .orderBy(asc(produtos.ordem), asc(produtos.nome));

      const completos = await Promise.all(linhas.map((l) => carregarProduto(l.id, true)));
      return c.json(completos.filter((p) => p !== null));
    },
  )
  .post(
    '/',
    describeRoute({
      description: 'Cria um produto no catálogo.',
      responses: {
        201: {
          description: 'Produto criado',
          content: { 'application/json': { schema: resolver(produtoSchema) } },
        },
      },
    }),
    validator('json', produtoAdminSchema, (resultado) => {
      if (!resultado.success) throw erroDeValidacao(resultado.error, 'produto_invalido');
    }),
    async (c) => {
      const dados = c.req.valid('json');
      const id = idPor(dados.nome);

      await db.transaction(async (tx) => {
        await conferirGrupos(dados.gruposIds, tx);
        await tx.insert(produtos).values({
          id,
          nome: dados.nome,
          categoria: dados.categoria,
          descricao: dados.descricao,
          precoBase: dados.precoBase,
          imagemUrl: dados.imagemUrl ?? null,
          ordem: dados.ordem,
          permiteMensagem: dados.permiteMensagem,
          permiteFoto: dados.permiteFoto,
          ativo: dados.ativo,
        });
        await regravarGrupos(id, dados.gruposIds, tx);
      });

      // `true`: um produto criado já desativado ainda tem de voltar no corpo da
      // resposta, senão a tela não saberia o id do que acabou de cadastrar.
      return c.json(await carregarProduto(id, true), 201);
    },
  )
  .patch(
    '/:id',
    describeRoute({
      description: 'Atualiza um produto do catálogo.',
      responses: {
        200: {
          description: 'Produto atualizado',
          content: { 'application/json': { schema: resolver(produtoSchema) } },
        },
        404: { description: 'Produto não encontrado' },
      },
    }),
    validator('json', produtoAdminSchema.partial(), (resultado) => {
      if (!resultado.success) throw erroDeValidacao(resultado.error, 'produto_invalido');
    }),
    async (c) => {
      const id = c.req.param('id');
      const { gruposIds, ...campos } = c.req.valid('json');

      await db.transaction(async (tx) => {
        // A existência é conferida sempre, e não só quando há campo para
        // atualizar: um PATCH apenas com `gruposIds` não passa pelo UPDATE, e
        // para um id inexistente iria bater na chave estrangeira — 500 no lugar
        // do 404 que o caso é.
        const [linha] = await tx.select({ id: produtos.id }).from(produtos).where(eq(produtos.id, id));
        if (!linha) throw new ErroApi(404, 'Produto não encontrado', 'nao_encontrado');

        if (Object.keys(campos).length > 0) {
          await tx.update(produtos).set(campos).where(eq(produtos.id, id));
        }
        if (gruposIds) {
          await conferirGrupos(gruposIds, tx);
          await regravarGrupos(id, gruposIds, tx);
        }
      });

      // `true` de novo: desativar pelo PATCH devolveria 404 se a leitura
      // seguisse a regra do catálogo público, e a tela acusaria erro numa
      // operação que deu certo.
      return c.json(await carregarProduto(id, true));
    },
  )
  .delete(
    '/:id',
    describeRoute({
      description:
        'Desativa um produto. Não apaga: pedidos antigos referenciam o produto e o histórico precisa continuar legível.',
      responses: {
        200: { description: 'Produto desativado' },
        404: { description: 'Produto não encontrado' },
      },
    }),
    async (c) => {
      const [desativado] = await db
        .update(produtos)
        .set({ ativo: false })
        .where(eq(produtos.id, c.req.param('id')))
        .returning({ id: produtos.id });

      if (!desativado) throw new ErroApi(404, 'Produto não encontrado', 'nao_encontrado');
      return c.json({ ok: true });
    },
  );
