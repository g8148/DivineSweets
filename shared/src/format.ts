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
