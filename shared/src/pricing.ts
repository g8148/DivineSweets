import { grupos } from './catalogo.ts';
import type { Personalizacao, Produto } from './tipos.ts';

export const TAXA_ENTREGA = 1000;

/**
 * A aritmética do preço, separada de onde os deltas vêm: o app resolve as
 * seleções no catálogo estático, a API resolve no banco, e as duas somam com
 * esta mesma função. Duplicar a fórmula seria arriscar que o total mostrado na
 * tela e o total gravado no pedido divergissem.
 */
export function somarPreco(precoBase: number, deltas: number[], quantidade: number): number {
  return (precoBase + deltas.reduce((soma, delta) => soma + delta, 0)) * quantidade;
}

export function calcularSubtotal(produto: Produto, personalizacao: Personalizacao): number {
  const deltas = produto.gruposIds.map((grupoId) => {
    const opcaoId = personalizacao.selecoes[grupoId];
    if (!opcaoId) return 0;
    return grupos[grupoId]?.opcoes.find((o) => o.id === opcaoId)?.delta ?? 0;
  });

  return somarPreco(produto.precoBase, deltas, personalizacao.quantidade);
}

export function calcularTotal(
  produto: Produto,
  personalizacao: Personalizacao,
  tipoEntrega: 'entrega' | 'retirada',
): number {
  const subtotal = calcularSubtotal(produto, personalizacao);
  return subtotal + (tipoEntrega === 'entrega' ? TAXA_ENTREGA : 0);
}

/** O produto como a API o devolve: com os grupos e as opções embutidos. */
type ProdutoComGrupos = {
  precoBase: number;
  grupos: { id: string; opcoes: { id: string; delta: number }[] }[];
};

type Escolhas = { selecoes: Record<string, string>; quantidade: number };

/**
 * Subtotal a partir do produto que a API devolveu.
 *
 * `calcularSubtotal` resolve os deltas no catálogo estático deste pacote; este
 * resolve nos grupos que vieram do banco. A diferença importa: o preço de uma
 * opção pode ser editado no servidor, e o valor congelado no código faria a
 * tela mostrar um total diferente do que o pedido seria cobrado.
 */
export function calcularSubtotalDeGrupos(
  produto: ProdutoComGrupos,
  escolhas: Escolhas,
): number {
  const deltas = produto.grupos.map((grupo) => {
    const opcaoId = escolhas.selecoes[grupo.id];
    if (!opcaoId) return 0;
    return grupo.opcoes.find((o) => o.id === opcaoId)?.delta ?? 0;
  });

  return somarPreco(produto.precoBase, deltas, escolhas.quantidade);
}

export function calcularTotalDeGrupos(
  produto: ProdutoComGrupos,
  escolhas: Escolhas,
  tipoEntrega: 'entrega' | 'retirada',
): number {
  return (
    calcularSubtotalDeGrupos(produto, escolhas) +
    (tipoEntrega === 'entrega' ? TAXA_ENTREGA : 0)
  );
}
