/**
 * Dinheiro trafega como inteiro em centavos, do banco à tela. A divisão por
 * 100 acontece só aqui, na borda de exibição.
 */
export function formatarMoeda(centavos: number): string {
  return `R$ ${formatarCentavos(centavos)}`;
}

/** O mesmo número sem o `R$`, para os campos em que o rótulo já diz a moeda. */
export function formatarCentavos(centavos: number): string {
  const reais = (centavos / 100).toFixed(2);
  return reais.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/**
 * Máscara de telefone brasileiro aplicada a cada tecla digitada.
 *
 * O corte entre prefixo e sufixo muda com o comprimento: fixo é 4+4, celular
 * é 5+4. Enquanto a pessoa digita o nono dígito o número ainda parece um
 * fixo, e a máscara se reacomoda sozinha quando ele chega.
 */
export function mascararTelefone(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 11);
  if (digitos.length <= 2) return digitos ? `(${digitos}` : '';

  const resto = digitos.slice(2);
  const ddd = `(${digitos.slice(0, 2)}) `;
  if (resto.length <= 4) return ddd + resto;

  const corte = resto.length > 8 ? 5 : 4;
  return `${ddd}${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/**
 * Telefone para leitura. O que está gravado é só dígito; a pontuação nasce
 * aqui, como a vírgula do dinheiro.
 *
 * O que não tem cara de telefone brasileiro sai como está: número de outro
 * formato exibido cru é melhor do que número recortado no lugar errado.
 */
export function formatarTelefone(valor: string): string {
  const digitos = apenasDigitos(valor);
  return digitos.length === 10 || digitos.length === 11 ? mascararTelefone(digitos) : valor;
}

/**
 * Máscara de dinheiro: os dígitos entram pela direita, como na maquininha do
 * cartão. Digitar `4`, `5`, `0` produz `4,50` — não há como escrever um valor
 * que a leitura depois não entenda, e o separador de milhar aparece sozinho.
 */
export function mascararMoeda(valor: string): string {
  const centavos = centavosDeTexto(valor);
  return centavos === null ? '' : formatarCentavos(centavos);
}

/** Centavos a partir do texto mascarado, ou `null` quando não há dígito algum. */
export function centavosDeTexto(valor: string): number | null {
  // O limite de 9 dígitos segura o valor bem abaixo do inteiro seguro, e
  // nenhum doce custa um milhão de reais.
  const digitos = apenasDigitos(valor).slice(0, 9);
  return digitos ? Number(digitos) : null;
}
