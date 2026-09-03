import { expect, test } from 'bun:test';
import { calcularSubtotal, calcularTotal, TAXA_ENTREGA } from '@/data/pricing';
import { buscarProduto } from '@/data/produtos';
import type { Personalizacao } from '@/types';

const bolo = buscarProduto('bolo-chocolate')!;

function personalizacao(over: Partial<Personalizacao> = {}): Personalizacao {
  return {
    produtoId: 'bolo-chocolate',
    quantidade: 1,
    selecoes: {},
    mensagem: '',
    fotoUri: null,
    ...over,
  };
}

test('sem seleções o subtotal é o preço-base', () => {
  expect(calcularSubtotal(bolo, personalizacao())).toBe(120);
});

test('soma os deltas das opções escolhidas', () => {
  const p = personalizacao({
    selecoes: {
      'tamanho-bolo': 'bolo-1-5kg',
      'sabor-massa': 'massa-red-velvet',
      recheio: 'recheio-ninho-nutella',
      cobertura: 'cobertura-ganache',
    },
  });
  expect(calcularSubtotal(bolo, p)).toBe(120 + 55 + 15 + 22 + 25);
});

test('multiplica pela quantidade', () => {
  const p = personalizacao({ quantidade: 3, selecoes: { 'tamanho-bolo': 'bolo-2kg' } });
  expect(calcularSubtotal(bolo, p)).toBe((120 + 105) * 3);
});

test('opção com delta zero não altera o preço', () => {
  const p = personalizacao({ selecoes: { cobertura: 'cobertura-nenhuma' } });
  expect(calcularSubtotal(bolo, p)).toBe(120);
});

test('seleção inválida é ignorada em vez de quebrar', () => {
  const p = personalizacao({ selecoes: { recheio: 'recheio-inexistente' } });
  expect(calcularSubtotal(bolo, p)).toBe(120);
});

test('grupo não pertencente ao produto é ignorado', () => {
  const cookie = buscarProduto('cookie-pistache')!;
  const p = personalizacao({ produtoId: 'cookie-pistache', selecoes: { cobertura: 'cobertura-pasta' } });
  expect(calcularSubtotal(cookie, p)).toBe(62);
});

test('entrega soma a taxa, retirada não', () => {
  const p = personalizacao();
  expect(calcularTotal(bolo, p, 'entrega')).toBe(120 + TAXA_ENTREGA);
  expect(calcularTotal(bolo, p, 'retirada')).toBe(120);
});

test('a taxa de entrega é cobrada uma vez, não por unidade', () => {
  const p = personalizacao({ quantidade: 4 });
  expect(calcularTotal(bolo, p, 'entrega')).toBe(120 * 4 + TAXA_ENTREGA);
});
