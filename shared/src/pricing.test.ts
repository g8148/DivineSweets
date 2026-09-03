import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularSubtotal, calcularTotal, TAXA_ENTREGA } from './pricing.ts';
import { buscarProduto } from './catalogo.ts';
import type { Personalizacao } from './tipos.ts';

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
  assert.strictEqual(calcularSubtotal(bolo, personalizacao()), 12000);
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
  assert.strictEqual(calcularSubtotal(bolo, p), 12000 + 5500 + 1500 + 2200 + 2500);
});

test('multiplica pela quantidade', () => {
  const p = personalizacao({ quantidade: 3, selecoes: { 'tamanho-bolo': 'bolo-2kg' } });
  assert.strictEqual(calcularSubtotal(bolo, p), (12000 + 10500) * 3);
});

test('opção com delta zero não altera o preço', () => {
  const p = personalizacao({ selecoes: { cobertura: 'cobertura-nenhuma' } });
  assert.strictEqual(calcularSubtotal(bolo, p), 12000);
});

test('seleção inválida é ignorada em vez de quebrar', () => {
  const p = personalizacao({ selecoes: { recheio: 'recheio-inexistente' } });
  assert.strictEqual(calcularSubtotal(bolo, p), 12000);
});

test('grupo não pertencente ao produto é ignorado', () => {
  const cookie = buscarProduto('cookie-pistache')!;
  const p = personalizacao({ produtoId: 'cookie-pistache', selecoes: { cobertura: 'cobertura-pasta' } });
  assert.strictEqual(calcularSubtotal(cookie, p), 6200);
});

test('entrega soma a taxa, retirada não', () => {
  const p = personalizacao();
  assert.strictEqual(calcularTotal(bolo, p, 'entrega'), 12000 + TAXA_ENTREGA);
  assert.strictEqual(calcularTotal(bolo, p, 'retirada'), 12000);
});

test('a taxa de entrega é cobrada uma vez, não por unidade', () => {
  const p = personalizacao({ quantidade: 4 });
  assert.strictEqual(calcularTotal(bolo, p, 'entrega'), 12000 * 4 + TAXA_ENTREGA);
});
