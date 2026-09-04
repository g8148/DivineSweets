export const TAXA_ENTREGA = 1000;

/**
 * A aritmética do preço, separada de onde os deltas vêm: o app soma os deltas
 * do produto que recebeu, a API os do instantâneo que acabou de conferir, e as
 * duas usam esta mesma função. Duplicar a fórmula seria arriscar que o total
 * mostrado na tela e o total gravado no pedido divergissem.
 */
export function somarPreco(precoBase: number, deltas: number[], quantidade: number): number {
  return (precoBase + deltas.reduce((soma, delta) => soma + delta, 0)) * quantidade;
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
 * Os deltas saem dos grupos que vieram do banco, e não de um catálogo escrito no
 * código: o preço de uma opção pode ser editado no servidor, e um valor
 * congelado aqui faria a tela mostrar um total diferente do que seria cobrado.
 * Existiu uma segunda versão que resolvia no catálogo estático — ela causou o
 * mesmo defeito duas vezes, no servidor e no app, e foi removida.
 */
export function calcularSubtotal(
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

export function calcularTotal(
  produto: ProdutoComGrupos,
  escolhas: Escolhas,
  tipoEntrega: 'entrega' | 'retirada',
): number {
  return (
    calcularSubtotal(produto, escolhas) +
    (tipoEntrega === 'entrega' ? TAXA_ENTREGA : 0)
  );
}
