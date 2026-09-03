import type { GrupoOpcao, Personalizacao, Produto } from '@/types';

export const grupos: Record<string, GrupoOpcao> = {
  'tamanho-caixa': {
    id: 'tamanho-caixa',
    titulo: 'Tamanho da caixa',
    obrigatorio: true,
    opcoes: [
      { id: 'caixa-6', nome: 'Caixa com 6', delta: 0 },
      { id: 'caixa-12', nome: 'Caixa com 12', delta: 48 },
      { id: 'caixa-24', nome: 'Caixa com 24', delta: 90 },
    ],
  },
  'tamanho-bolo': {
    id: 'tamanho-bolo',
    titulo: 'Tamanho',
    obrigatorio: true,
    opcoes: [
      { id: 'bolo-1kg', nome: '1 kg — 15 fatias', delta: 0 },
      { id: 'bolo-1-5kg', nome: '1,5 kg — 25 fatias', delta: 55 },
      { id: 'bolo-2kg', nome: '2 kg — 35 fatias', delta: 105 },
    ],
  },
  'tamanho-buque': {
    id: 'tamanho-buque',
    titulo: 'Tamanho do buquê',
    obrigatorio: true,
    opcoes: [
      { id: 'buque-p', nome: 'Pequeno — 9 doces', delta: 0 },
      { id: 'buque-m', nome: 'Médio — 15 doces', delta: 35 },
      { id: 'buque-g', nome: 'Grande — 24 doces', delta: 70 },
    ],
  },
  'tamanho-ovo': {
    id: 'tamanho-ovo',
    titulo: 'Peso',
    obrigatorio: true,
    opcoes: [
      { id: 'ovo-350', nome: '350 g', delta: 0 },
      { id: 'ovo-500', nome: '500 g', delta: 38 },
      { id: 'ovo-750', nome: '750 g', delta: 85 },
    ],
  },
  'sabor-massa': {
    id: 'sabor-massa',
    titulo: 'Sabor da massa',
    obrigatorio: true,
    opcoes: [
      { id: 'massa-chocolate', nome: 'Chocolate', delta: 0 },
      { id: 'massa-baunilha', nome: 'Baunilha', delta: 0 },
      { id: 'massa-cenoura', nome: 'Cenoura', delta: 0 },
      { id: 'massa-red-velvet', nome: 'Red velvet', delta: 15 },
    ],
  },
  recheio: {
    id: 'recheio',
    titulo: 'Recheio',
    obrigatorio: true,
    opcoes: [
      { id: 'recheio-brigadeiro', nome: 'Brigadeiro', delta: 0 },
      { id: 'recheio-doce-leite', nome: 'Doce de leite', delta: 8 },
      { id: 'recheio-maracuja', nome: 'Mousse de maracujá', delta: 12 },
      { id: 'recheio-ninho-nutella', nome: 'Ninho com Nutella', delta: 22 },
    ],
  },
  cobertura: {
    id: 'cobertura',
    titulo: 'Cobertura',
    obrigatorio: false,
    opcoes: [
      { id: 'cobertura-nenhuma', nome: 'Sem cobertura', delta: 0 },
      { id: 'cobertura-chantilly', nome: 'Chantilly', delta: 15 },
      { id: 'cobertura-ganache', nome: 'Ganache', delta: 25 },
      { id: 'cobertura-pasta', nome: 'Pasta americana', delta: 45 },
    ],
  },
};

/**
 * Traduz as seleções (que guardam ids) para pares legíveis, na ordem em que os
 * grupos aparecem no produto. Usado por todas as telas de resumo.
 */
export function descreverSelecoes(
  produto: Produto,
  personalizacao: Personalizacao,
): { rotulo: string; valor: string }[] {
  return produto.gruposIds.flatMap((grupoId) => {
    const grupo = grupos[grupoId];
    const opcaoId = personalizacao.selecoes[grupoId];
    if (!grupo || !opcaoId) return [];
    const opcao = grupo.opcoes.find((o) => o.id === opcaoId);
    if (!opcao) return [];
    return [{ rotulo: grupo.titulo, valor: opcao.nome }];
  });
}

export function gruposDoProduto(produto: Produto): GrupoOpcao[] {
  return produto.gruposIds.map((id) => {
    const grupo = grupos[id];
    if (!grupo) throw new Error(`Grupo de opção desconhecido: ${id}`);
    return grupo;
  });
}
