import { expect, test } from 'bun:test';
import { formatarMoeda, formatarData, paraISO } from '@/data/format';

test('formata centavos com vírgula', () => {
  expect(formatarMoeda(54)).toBe('R$ 54,00');
  expect(formatarMoeda(62.5)).toBe('R$ 62,50');
});

test('formata milhar com ponto', () => {
  expect(formatarMoeda(1234.5)).toBe('R$ 1.234,50');
});

test('formata data ISO como brasileira', () => {
  expect(formatarData('2026-08-13')).toBe('13/08/2026');
});

test('converte Date para ISO local', () => {
  expect(paraISO(new Date(2026, 7, 13))).toBe('2026-08-13');
});
