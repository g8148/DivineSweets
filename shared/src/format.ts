/**
 * Dinheiro trafega como inteiro em centavos, do banco à tela. A divisão por
 * 100 acontece só aqui, na borda de exibição.
 */
export function formatarMoeda(centavos: number): string {
  const reais = (centavos / 100).toFixed(2);
  return `R$ ${reais.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export function diaDaSemana(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return DIAS[new Date(ano, mes - 1, dia).getDay()];
}

/**
 * Número curto para exibição. Os ids gerados carregam um `Date.now()` inteiro,
 * que é ruído na tela; o cliente só precisa de algo que ele consiga ditar por
 * telefone. Os pedidos do seed (`ped-001`) já são curtos e passam inteiros.
 */
export function numeroPedido(id: string): string {
  const semPrefixo = id.replace(/^ped-/, '');
  return semPrefixo.length <= 4 ? semPrefixo : semPrefixo.slice(-4);
}

export function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * As seleções em pares rótulo/valor, a partir dos grupos que a API devolve
 * embutidos no produto.
 *
 * A irmã em `catalogo.ts`, `descreverSelecoes`, resolve os títulos no catálogo
 * estático — serve ao que ainda usa o `Produto` local. Esta serve às telas
 * ligadas à API, onde os títulos vêm do banco e podem ter sido editados.
 */
export function descreverSelecoesDeGrupos(
  grupos: { id: string; titulo: string; opcoes: { id: string; nome: string }[] }[],
  selecoes: Record<string, string>,
): { rotulo: string; valor: string }[] {
  return grupos.flatMap((grupo) => {
    const opcaoId = selecoes[grupo.id];
    if (!opcaoId) return [];
    const opcao = grupo.opcoes.find((o) => o.id === opcaoId);
    // Seleção que não existe mais no grupo é ignorada, e não exibida como
    // "undefined": pode ser um rascunho aberto antes de a opção ser removida.
    return opcao ? [{ rotulo: grupo.titulo, valor: opcao.nome }] : [];
  });
}
