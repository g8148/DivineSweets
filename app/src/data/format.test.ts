import test from 'node:test';
import assert from 'node:assert/strict';
import { formatarMoeda, formatarData, paraISO } from '@/data/format';

test('formata centavos com vírgula', () => {
  assert.strictEqual(formatarMoeda(54), 'R$ 54,00');
  assert.strictEqual(formatarMoeda(62.5), 'R$ 62,50');
});

test('formata milhar com ponto', () => {
  assert.strictEqual(formatarMoeda(1234.5), 'R$ 1.234,50');
});

test('formata data ISO como brasileira', () => {
  assert.strictEqual(formatarData('2026-08-13'), '13/08/2026');
});

test('converte Date para ISO local', () => {
  assert.strictEqual(paraISO(new Date(2026, 7, 13)), '2026-08-13');
});
