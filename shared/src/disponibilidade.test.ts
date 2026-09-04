import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANTECEDENCIA_MINIMA_HORAS,
  motivoIndisponivel,
} from './disponibilidade.ts';
import type { Agenda } from './tipos.ts';

const AGORA = new Date(2026, 7, 13, 10, 0, 0); // 13/08/2026 10:00
const agenda: Agenda = { datasBloqueadas: ['2026-08-20'], limitePorDia: 3 };
const semOcupacao: Record<string, number> = {};

test('a antecedência mínima é de 48 horas', () => {
  assert.strictEqual(ANTECEDENCIA_MINIMA_HORAS, 48);
});

test('data no passado é indisponível', () => {
  assert.strictEqual(motivoIndisponivel('2026-08-12', agenda, semOcupacao, AGORA), 'passado');
});

test('hoje e amanhã violam a antecedência de 48h', () => {
  assert.strictEqual(motivoIndisponivel('2026-08-13', agenda, semOcupacao, AGORA), 'antecedencia');
  assert.strictEqual(motivoIndisponivel('2026-08-14', agenda, semOcupacao, AGORA), 'antecedencia');
});

test('o terceiro dia já está liberado', () => {
  assert.strictEqual(motivoIndisponivel('2026-08-15', agenda, semOcupacao, AGORA), null);
});

test('data bloqueada manualmente é indisponível mesmo com antecedência', () => {
  assert.strictEqual(motivoIndisponivel('2026-08-20', agenda, semOcupacao, AGORA), 'bloqueada');
});

test('dia que atingiu o limite fica lotado', () => {
  assert.strictEqual(motivoIndisponivel('2026-08-18', agenda, { '2026-08-18': 3 }, AGORA), 'lotada');
});

test('dia abaixo do limite continua disponível', () => {
  assert.strictEqual(motivoIndisponivel('2026-08-18', agenda, { '2026-08-18': 2 }, AGORA), null);
});

test('bloqueio manual tem precedência sobre lotação', () => {
  assert.strictEqual(motivoIndisponivel('2026-08-20', agenda, { '2026-08-20': 3 }, AGORA), 'bloqueada');
});
