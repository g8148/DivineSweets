import test from 'node:test';
import assert from 'node:assert/strict';
import { criarPedidoSchema, dataISOSchema } from './schemas';

test('aceita data no formato YYYY-MM-DD', () => {
  assert.strictEqual(dataISOSchema.safeParse('2026-09-20').success, true);
});

test('rejeita data com fuso, que escorregaria de dia', () => {
  assert.strictEqual(dataISOSchema.safeParse('2026-09-20T00:00:00Z').success, false);
  assert.strictEqual(dataISOSchema.safeParse('20/09/2026').success, false);
});

test('rejeita pedido sem produto', () => {
  assert.strictEqual(criarPedidoSchema.safeParse({ quantidade: 1 }).success, false);
});

test('rejeita quantidade zero ou negativa', () => {
  const base = {
    produtoId: 'bolo-chocolate',
    selecoes: {},
    tipoEntrega: 'retirada',
    dataEntrega: '2026-09-20',
    horaEntrega: '14:00',
  };
  assert.strictEqual(criarPedidoSchema.safeParse({ ...base, quantidade: 0 }).success, false);
  assert.strictEqual(criarPedidoSchema.safeParse({ ...base, quantidade: 1 }).success, true);
});

test('não aceita preço vindo do cliente', () => {
  const r = criarPedidoSchema.safeParse({
    produtoId: 'bolo-chocolate',
    quantidade: 1,
    selecoes: {},
    tipoEntrega: 'retirada',
    dataEntrega: '2026-09-20',
    horaEntrega: '14:00',
    total: 1,
  });
  assert.strictEqual(r.success && 'total' in r.data, false);
});
