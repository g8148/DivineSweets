import { expect, test } from 'bun:test';
import {
  ANTECEDENCIA_MINIMA_HORAS,
  contarOcupacao,
  dataDisponivel,
  motivoIndisponivel,
} from '@/data/disponibilidade';
import type { Agenda } from '@/data/agenda';

const AGORA = new Date(2026, 7, 13, 10, 0, 0); // 13/08/2026 10:00
const agenda: Agenda = { datasBloqueadas: ['2026-08-20'], limitePorDia: 3 };
const semOcupacao: Record<string, number> = {};

test('a antecedência mínima é de 48 horas', () => {
  expect(ANTECEDENCIA_MINIMA_HORAS).toBe(48);
});

test('data no passado é indisponível', () => {
  expect(motivoIndisponivel('2026-08-12', agenda, semOcupacao, AGORA)).toBe('passado');
});

test('hoje e amanhã violam a antecedência de 48h', () => {
  expect(motivoIndisponivel('2026-08-13', agenda, semOcupacao, AGORA)).toBe('antecedencia');
  expect(motivoIndisponivel('2026-08-14', agenda, semOcupacao, AGORA)).toBe('antecedencia');
});

test('o terceiro dia já está liberado', () => {
  expect(motivoIndisponivel('2026-08-15', agenda, semOcupacao, AGORA)).toBe(null);
});

test('data bloqueada manualmente é indisponível mesmo com antecedência', () => {
  expect(motivoIndisponivel('2026-08-20', agenda, semOcupacao, AGORA)).toBe('bloqueada');
});

test('dia que atingiu o limite fica lotado', () => {
  expect(motivoIndisponivel('2026-08-18', agenda, { '2026-08-18': 3 }, AGORA)).toBe('lotada');
});

test('dia abaixo do limite continua disponível', () => {
  expect(motivoIndisponivel('2026-08-18', agenda, { '2026-08-18': 2 }, AGORA)).toBe(null);
});

test('bloqueio manual tem precedência sobre lotação', () => {
  expect(motivoIndisponivel('2026-08-20', agenda, { '2026-08-20': 3 }, AGORA)).toBe('bloqueada');
});

test('dataDisponivel é o inverso de haver motivo', () => {
  expect(dataDisponivel('2026-08-15', agenda, semOcupacao, AGORA)).toBe(true);
  expect(dataDisponivel('2026-08-20', agenda, semOcupacao, AGORA)).toBe(false);
});

test('contarOcupacao agrupa por data e ignora recusados', () => {
  const pedidos = [
    { entrega: { data: '2026-08-18' }, status: 'recebido' },
    { entrega: { data: '2026-08-18' }, status: 'producao' },
    { entrega: { data: '2026-08-18' }, status: 'recusado' },
    { entrega: { data: '2026-08-19' }, status: 'entregue' },
  ];
  expect(contarOcupacao(pedidos)).toEqual({ '2026-08-18': 2, '2026-08-19': 1 });
});
