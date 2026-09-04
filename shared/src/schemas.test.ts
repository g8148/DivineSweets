import test from 'node:test';
import assert from 'node:assert/strict';
import { caminhoDeUploadSchema, criarPedidoSchema, dataISOSchema } from './schemas.ts';

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

// O upload devolve caminho relativo (`/uploads/<uuid>.webp`), e era `z.url()`
// que estava aqui: o fluxo real do app — subir a foto e criar o pedido — falhava
// com 400 em toda tentativa com foto de referência.
test('fotoUrl aceita o caminho que o upload devolve', () => {
  const corpo = {
    produtoId: 'bolo-decorado',
    quantidade: 1,
    selecoes: {},
    fotoUrl: '/uploads/f9fc1845-b8a7-4161-a182-fba62fd80ded.webp',
    tipoEntrega: 'retirada' as const,
    dataEntrega: '2026-09-20',
    horaEntrega: '15:30',
  };
  assert.strictEqual(criarPedidoSchema.safeParse(corpo).success, true);
});

test('fotoUrl recusa endereço externo e travessia de caminho', () => {
  for (const fotoUrl of [
    'https://exemplo.com/foto.jpg',
    'javascript:alert(1)',
    '/uploads/../../etc/passwd',
    '/outra-pasta/foto.webp',
  ]) {
    assert.strictEqual(
      caminhoDeUploadSchema.safeParse(fotoUrl).success,
      false,
      `${fotoUrl} não deveria passar`,
    );
  }
});
