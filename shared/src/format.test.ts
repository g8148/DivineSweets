import test from 'node:test';
import assert from 'node:assert/strict';
import { formatarMoeda, formatarData, paraISO } from './format.ts';

test('formata centavos como reais com vírgula decimal', () => {
  assert.strictEqual(formatarMoeda(6200), 'R$ 62,00');
  assert.strictEqual(formatarMoeda(1000), 'R$ 10,00');
  assert.strictEqual(formatarMoeda(123456), 'R$ 1.234,56');
  assert.strictEqual(formatarMoeda(5), 'R$ 0,05');
});

test('formata data ISO como brasileira', () => {
  assert.strictEqual(formatarData('2026-08-13'), '13/08/2026');
});

test('converte Date para ISO local', () => {
  assert.strictEqual(paraISO(new Date(2026, 7, 13)), '2026-08-13');
});
