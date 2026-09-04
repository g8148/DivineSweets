import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { StatusPedido } from '@divine/shared';
import { db } from '../db/client.ts';
import { pedidoSelecoes, pedidos, produtos, user } from '../db/schema.ts';

type LinhaPedido = typeof pedidos.$inferSelect;

type Selecao = { grupoTitulo: string; opcaoNome: string; delta: number };

/**
 * Formato de pedido que a API publica, em um lugar só — criação e leitura
 * devolvem exatamente a mesma coisa, senão o app precisaria de dois tipos para
 * o mesmo recurso.
 *
 * `usuarioId` fica de fora de propósito: é chave interna, e o dono do pedido já
 * sabe quem é. Na listagem administrativa ele viraria uma lista de ids de
 * clientes exposta sem motivo.
 */
export function montarPedido(
  linha: LinhaPedido,
  selecoes: Selecao[],
  cliente: { nome: string; telefone: string },
  // A foto atual do produto, para a miniatura do card. É a única coisa aqui que
  // não é instantâneo do pedido: o nome fica congelado no momento da compra,
  // mas a imagem é só ilustração e vale mais estar certa do que fiel à época.
  produtoImagemUrl: string | null,
) {
  const { usuarioId, criadoEm, ...resto } = linha;
  return {
    ...resto,
    selecoes,
    criadoEm: criadoEm.toISOString(),
    clienteNome: cliente.nome,
    clienteTelefone: cliente.telefone,
    produtoImagemUrl,
  };
}

/**
 * Completa uma lista inteira em quatro consultas, e não em três por pedido. A
 * listagem administrativa cresce sem limite: buscar seleções, cliente e produto
 * pedido a pedido faria o número de idas ao banco acompanhar o tamanho da lista.
 */
async function completar(linhas: LinhaPedido[]) {
  if (linhas.length === 0) return [];

  const ids = linhas.map((l) => l.id);
  const donos = [...new Set(linhas.map((l) => l.usuarioId))];
  const produtosPedidos = [...new Set(linhas.map((l) => l.produtoId))];

  const [selecoes, clientes, imagens] = await Promise.all([
    db
      .select({
        pedidoId: pedidoSelecoes.pedidoId,
        grupoTitulo: pedidoSelecoes.grupoTitulo,
        opcaoNome: pedidoSelecoes.opcaoNome,
        delta: pedidoSelecoes.delta,
      })
      .from(pedidoSelecoes)
      .where(inArray(pedidoSelecoes.pedidoId, ids))
      .orderBy(asc(pedidoSelecoes.ordem)),
    db
      .select({ id: user.id, nome: user.name, telefone: user.telefone })
      .from(user)
      .where(inArray(user.id, donos)),
    db
      .select({ id: produtos.id, imagemUrl: produtos.imagemUrl })
      .from(produtos)
      .where(inArray(produtos.id, produtosPedidos)),
  ]);

  const porPedido = new Map<string, Selecao[]>();
  for (const { pedidoId, ...selecao } of selecoes) {
    const lista = porPedido.get(pedidoId);
    if (lista) lista.push(selecao);
    else porPedido.set(pedidoId, [selecao]);
  }

  const porCliente = new Map(clientes.map((c) => [c.id, c]));
  const porProduto = new Map(imagens.map((p) => [p.id, p.imagemUrl]));

  return linhas.map((linha) => {
    const cliente = porCliente.get(linha.usuarioId);
    return montarPedido(
      linha,
      porPedido.get(linha.id) ?? [],
      { nome: cliente?.nome ?? '', telefone: cliente?.telefone ?? '' },
      porProduto.get(linha.produtoId) ?? null,
    );
  });
}

/** Mais recentes primeiro: a tela "meus pedidos" existe para acompanhar o que
 *  acabou de ser encomendado, não para folhear o histórico. */
export async function listarPedidosDoUsuario(usuarioId: string) {
  const linhas = await db
    .select()
    .from(pedidos)
    .where(eq(pedidos.usuarioId, usuarioId))
    .orderBy(desc(pedidos.criadoEm));

  return completar(linhas);
}

/** Todos os pedidos, para a administração. O filtro por status é o que separa
 *  "o que preciso produzir hoje" do histórico inteiro. */
export async function listarTodosPedidos(status?: StatusPedido) {
  const linhas = await db
    .select()
    .from(pedidos)
    .where(status ? eq(pedidos.status, status) : undefined)
    .orderBy(desc(pedidos.criadoEm));

  return completar(linhas);
}

/**
 * `usuarioId` restringe a busca ao dono. O filtro é do SQL, e não uma comparação
 * depois de carregar: assim não existe caminho em que o pedido de outra pessoa
 * chegue a ser montado antes de alguém lembrar de conferir. Sem o parâmetro,
 * busca qualquer pedido — é o que a administração precisa.
 */
export async function buscarPedido(id: string, usuarioId?: string) {
  const dono = usuarioId ? eq(pedidos.usuarioId, usuarioId) : undefined;
  const [linha] = await db
    .select()
    .from(pedidos)
    .where(and(eq(pedidos.id, id), dono));

  if (!linha) return null;
  const [pedido] = await completar([linha]);
  return pedido;
}
