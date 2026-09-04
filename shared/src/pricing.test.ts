import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularSubtotal, calcularTotal, somarPreco, TAXA_ENTREGA } from './pricing.ts';

const boloDaApi = {
  precoBase: 12000,
  grupos: [
    { id: 'tamanho-bolo', opcoes: [{ id: 'bolo-1kg', delta: 0 }, { id: 'bolo-1-5kg', delta: 5500 }] },
    { id: 'recheio', opcoes: [{ id: 'recheio-brigadeiro', delta: 0 }, { id: 'recheio-ninho', delta: 800 }] },
  ],
};

test('os deltas dos grupos embutidos somam ao preço-base', () => {
  const subtotal = calcularSubtotal(boloDaApi, {
    selecoes: { 'tamanho-bolo': 'bolo-1-5kg', recheio: 'recheio-ninho' },
    quantidade: 1,
  });
  assert.strictEqual(subtotal, 12000 + 5500 + 800);
});

test('a quantidade multiplica o preço já somado, não só a base', () => {
  const subtotal = calcularSubtotal(boloDaApi, {
    selecoes: { 'tamanho-bolo': 'bolo-1-5kg' },
    quantidade: 3,
  });
  assert.strictEqual(subtotal, (12000 + 5500) * 3);
});

// O ponto de existir esta função: o delta vem do banco, não do catálogo do
// código. Aqui o mesmo id de opção vale outro valor, e a conta acompanha.
test('o delta usado é o do produto recebido, e não o do catálogo estático', () => {
  const comOutroPreco = {
    precoBase: 12000,
    grupos: [{ id: 'tamanho-bolo', opcoes: [{ id: 'bolo-1-5kg', delta: 9900 }] }],
  };
  const subtotal = calcularSubtotal(comOutroPreco, {
    selecoes: { 'tamanho-bolo': 'bolo-1-5kg' },
    quantidade: 1,
  });
  assert.strictEqual(subtotal, 12000 + 9900);
});

test('a taxa de entrega é do pedido, e não da unidade', () => {
  const total = calcularTotal(boloDaApi, { selecoes: {}, quantidade: 4 }, 'entrega');
  assert.strictEqual(total, 12000 * 4 + TAXA_ENTREGA);
});

test('retirada não soma taxa', () => {
  const total = calcularTotal(boloDaApi, { selecoes: {}, quantidade: 1 }, 'retirada');
  assert.strictEqual(total, 12000);
});

// A aritmética isolada, que servidor e app compartilham.
test('somarPreco multiplica o preço já somado, e não só a base', () => {
  assert.strictEqual(somarPreco(1000, [200, 300], 3), 4500);
});

test('sem deltas o subtotal é o preço-base vezes a quantidade', () => {
  assert.strictEqual(somarPreco(1000, [], 2), 2000);
});
