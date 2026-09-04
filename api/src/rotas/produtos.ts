import { produtoSchema } from '@divine/shared';
import { asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { describeRoute, resolver } from 'hono-openapi';
import { z } from 'zod';
import { db } from '../db/client.ts';
import { gruposOpcoes, opcoes, produtos, produtosGrupos } from '../db/schema.ts';
import { ErroApi } from '../erros.ts';

export type ProdutoComGrupos = z.infer<typeof produtoSchema>;

/**
 * Monta o produto com grupos e opções embutidos. A tela de personalização
 * precisa de tudo de uma vez; três requisições encadeadas dariam três estados
 * de carregamento em sequência.
 *
 * `incluirInativos` é para a administração. O catálogo público some com o
 * produto desativado, mas quem administra tem de continuar abrindo, editando e
 * reativando — sem isso, desativar um produto seria irreversível pelo app.
 */
export async function carregarProduto(
  id: string,
  incluirInativos = false,
): Promise<ProdutoComGrupos | null> {
  const [produto] = await db.select().from(produtos).where(eq(produtos.id, id));
  if (!produto) return null;
  if (!produto.ativo && !incluirInativos) return null;

  const vinculos = await db
    .select({ grupo: gruposOpcoes, ordem: produtosGrupos.ordem })
    .from(produtosGrupos)
    .innerJoin(gruposOpcoes, eq(gruposOpcoes.id, produtosGrupos.grupoId))
    .where(eq(produtosGrupos.produtoId, id))
    .orderBy(asc(produtosGrupos.ordem));

  const grupos = await Promise.all(
    vinculos.map(async ({ grupo }) => ({
      id: grupo.id,
      titulo: grupo.titulo,
      obrigatorio: grupo.obrigatorio,
      opcoes: await db
        .select({ id: opcoes.id, nome: opcoes.nome, delta: opcoes.delta })
        .from(opcoes)
        .where(eq(opcoes.grupoId, grupo.id))
        .orderBy(asc(opcoes.ordem)),
    })),
  );

  return {
    id: produto.id,
    nome: produto.nome,
    categoria: produto.categoria,
    descricao: produto.descricao,
    precoBase: produto.precoBase,
    imagemUrl: produto.imagemUrl,
    permiteMensagem: produto.permiteMensagem,
    permiteFoto: produto.permiteFoto,
    ativo: produto.ativo,
    ordem: produto.ordem,
    grupos,
  };
}

export const rotasProdutos = new Hono()
  .get(
    '/',
    describeRoute({
      description: 'Lista o catálogo ativo, com grupos de opções embutidos.',
      responses: {
        200: {
          description: 'Catálogo',
          content: { 'application/json': { schema: resolver(z.array(produtoSchema)) } },
        },
      },
    }),
    async (c) => {
      const linhas = await db
        .select({ id: produtos.id })
        .from(produtos)
        .where(eq(produtos.ativo, true))
        .orderBy(asc(produtos.ordem));

      const completos = await Promise.all(linhas.map((l) => carregarProduto(l.id)));
      return c.json(completos.filter((p) => p !== null));
    },
  )
  .get(
    '/:id',
    describeRoute({
      description: 'Detalha um produto do catálogo.',
      responses: {
        200: {
          description: 'Produto',
          content: { 'application/json': { schema: resolver(produtoSchema) } },
        },
        404: { description: 'Produto não encontrado' },
      },
    }),
    async (c) => {
      const produto = await carregarProduto(c.req.param('id'));
      if (!produto) throw new ErroApi(404, 'Produto não encontrado', 'nao_encontrado');
      return c.json(produto);
    },
  );
