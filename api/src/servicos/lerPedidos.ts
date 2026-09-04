import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { pedidoSelecoes, pedidos, user } from '../db/schema.ts';

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
) {
  const { usuarioId, criadoEm, ...resto } = linha;
  return {
    ...resto,
    selecoes,
    criadoEm: criadoEm.toISOString(),
    clienteNome: cliente.nome,
    clienteTelefone: cliente.telefone,
  };
}

async function completar(linha: LinhaPedido) {
  const [selecoes, [cliente]] = await Promise.all([
    db
      .select({
        grupoTitulo: pedidoSelecoes.grupoTitulo,
        opcaoNome: pedidoSelecoes.opcaoNome,
        delta: pedidoSelecoes.delta,
      })
      .from(pedidoSelecoes)
      .where(eq(pedidoSelecoes.pedidoId, linha.id))
      .orderBy(asc(pedidoSelecoes.ordem)),
    db
      .select({ nome: user.name, telefone: user.telefone })
      .from(user)
      .where(eq(user.id, linha.usuarioId)),
  ]);

  return montarPedido(linha, selecoes, {
    nome: cliente?.nome ?? '',
    telefone: cliente?.telefone ?? '',
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

  return Promise.all(linhas.map(completar));
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

  return linha ? completar(linha) : null;
}
