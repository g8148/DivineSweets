import { grupos } from './catalogo.ts';
import type { Personalizacao, Produto } from './tipos.ts';

export const TAXA_ENTREGA = 1000;

export function calcularSubtotal(produto: Produto, personalizacao: Personalizacao): number {
  const deltas = produto.gruposIds.reduce((soma, grupoId) => {
    const opcaoId = personalizacao.selecoes[grupoId];
    if (!opcaoId) return soma;
    const opcao = grupos[grupoId]?.opcoes.find((o) => o.id === opcaoId);
    return soma + (opcao?.delta ?? 0);
  }, 0);

  return (produto.precoBase + deltas) * personalizacao.quantidade;
}

export function calcularTotal(
  produto: Produto,
  personalizacao: Personalizacao,
  tipoEntrega: 'entrega' | 'retirada',
): number {
  const subtotal = calcularSubtotal(produto, personalizacao);
  return subtotal + (tipoEntrega === 'entrega' ? TAXA_ENTREGA : 0);
}
