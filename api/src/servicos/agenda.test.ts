import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { criarApp } from '../app.ts';
import { db } from '../db/client.ts';
import { agendaBloqueios, pedidos, user } from '../db/schema.ts';
import { diasDoMes } from './agenda.ts';

const app = criarApp();
const DATA_BLOQUEADA = '2026-10-15';
const DATA_LOTADA = '2026-10-20';
const USUARIO_TESTE = 'usuario-teste-agenda';

// O bloqueio é fixture, não dado: some no fim para não sujar o banco de
// desenvolvimento com um feriado inventado.
after(async () => {
  await db.delete(agendaBloqueios).where(eq(agendaBloqueios.data, DATA_BLOQUEADA));
  await db.delete(pedidos).where(eq(pedidos.usuarioId, USUARIO_TESTE));
  await db.delete(user).where(eq(user.id, USUARIO_TESTE));
});

async function criarPedido(data: string, i: number, status: 'recebido' | 'recusado') {
  await db.insert(pedidos).values({
    id: `pedido-teste-${data}-${i}`,
    usuarioId: USUARIO_TESTE,
    produtoId: 'brownie',
    produtoNome: 'Brownie',
    quantidade: 1,
    tipoEntrega: 'retirada',
    dataEntrega: data,
    horaEntrega: '14:00',
    subtotal: 3000,
    taxaEntrega: 0,
    total: 3000,
    status,
  });
}

async function motivoDoDia(data: string) {
  const mes = data.slice(0, 7);
  const res = await app.request(`/api/agenda/disponibilidade?mes=${mes}`);
  return (await res.json()).dias.find((d: { data: string }) => d.data === data).motivo;
}

test('diasDoMes cobre o mês inteiro em YYYY-MM-DD', () => {
  const dias = diasDoMes('2026-02');
  assert.strictEqual(dias.length, 28);
  assert.strictEqual(dias[0], '2026-02-01');
  assert.strictEqual(dias[27], '2026-02-28');
});

test('diasDoMes acerta mês de 31 dias', () => {
  assert.strictEqual(diasDoMes('2026-01').length, 31);
});

test('diasDoMes acerta fevereiro bissexto', () => {
  assert.strictEqual(diasDoMes('2028-02').length, 29);
});

test('a rota devolve um dia por data, com motivo', async () => {
  const res = await app.request('/api/agenda/disponibilidade?mes=2026-10');
  assert.strictEqual(res.status, 200);
  const corpo = await res.json();
  assert.strictEqual(corpo.dias.length, 31);
  assert.ok('disponivel' in corpo.dias[0]);
  assert.ok('motivo' in corpo.dias[0]);
});

test('data bloqueada aparece como indisponível pelo motivo certo', async () => {
  await db
    .insert(agendaBloqueios)
    .values({ data: DATA_BLOQUEADA, motivo: 'Feriado' })
    .onConflictDoNothing();

  const res = await app.request('/api/agenda/disponibilidade?mes=2026-10');
  const dia = (await res.json()).dias.find(
    (d: { data: string }) => d.data === DATA_BLOQUEADA,
  );
  assert.strictEqual(dia.disponivel, false);
  assert.strictEqual(dia.motivo, 'bloqueada');
});

test('mês em formato inválido responde 400 no formato de erro da API', async () => {
  const res = await app.request('/api/agenda/disponibilidade?mes=outubro');
  assert.strictEqual(res.status, 400);
  // O app trata uma forma só de erro; o objeto cru do Zod não serve.
  assert.deepStrictEqual(await res.json(), {
    erro: 'Use o formato AAAA-MM',
    codigo: 'consulta_invalida',
  });
});

// A capacidade do dia é a razão de a agenda existir, e é o único ramo de
// motivoIndisponivel que depende de código da API — a contagem no banco.
test('o dia lota ao atingir o limite, e recusados não ocupam vaga', async () => {
  await db.insert(user).values({
    id: USUARIO_TESTE,
    name: 'Teste Agenda',
    email: 'agenda@teste.local',
    updatedAt: new Date(),
  });

  for (let i = 0; i < 4; i += 1) await criarPedido(DATA_LOTADA, i, 'recebido');
  for (let i = 4; i < 6; i += 1) await criarPedido(DATA_LOTADA, i, 'recusado');

  assert.strictEqual(await motivoDoDia(DATA_LOTADA), null, '4 de 5 vagas: ainda livre');

  await criarPedido(DATA_LOTADA, 6, 'recebido');
  assert.strictEqual(await motivoDoDia(DATA_LOTADA), 'lotada', 'a quinta vaga fecha o dia');
});
