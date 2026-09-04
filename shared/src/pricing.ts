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
