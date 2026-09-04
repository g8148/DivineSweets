import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { eq } from 'drizzle-orm';
import { criarApp } from '../../app.ts';
import { db } from '../../db/client.ts';
import { agendaBloqueios } from '../../db/schema.ts';
import { autenticar, limparUsuariosDeTeste } from '../../testes/sessao.ts';
import { comTravaGlobal, TRAVA_AGENDA } from '../../testes/trava.ts';

const app = criarApp();

// Março de 2027 é deste arquivo. Bloqueio é dado global: usar a data de outro
// arquivo o tornaria indisponível no meio da execução dele.
const DATA = { bloqueio: '2027-03-05', ocupada: '2027-03-06' };

after(async () => {
  await db.delete(agendaBloqueios).where(eq(agendaBloqueios.data, DATA.bloqueio));
  await db.delete(agendaBloqueios).where(eq(agendaBloqueios.data, DATA.ocupada));
  await limparUsuariosDeTeste();
});

function bloquear(Cookie: string, corpo: unknown) {
  return app.request('/api/admin/agenda/bloqueios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie },
    body: JSON.stringify(corpo),
  });
}

async function diaNoCalendario(data: string) {
  const mes = data.slice(0, 7);
  const res = await app.request(`/api/agenda/disponibilidade?mes=${mes}`);
  const corpo = await res.json();
  return corpo.dias.find((d: { data: string }) => d.data === data);
}

test('sem sessão o bloqueio responde 401, e não 403', async () => {
  const res = await app.request('/api/admin/agenda/bloqueios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: DATA.bloqueio }),
  });
  assert.strictEqual(res.status, 401);
});

test('cliente comum não bloqueia datas', async () => {
  const cliente = await autenticar('cliente');
  const res = await bloquear(cliente.Cookie, { data: DATA.bloqueio, motivo: 'Teste' });
  assert.strictEqual(res.status, 403);
});

test('bloquear uma data a torna indisponível no endpoint público', async () => {
  const admin = await autenticar('admin');
  const res = await bloquear(admin.Cookie, { data: DATA.bloqueio, motivo: 'Manutenção' });
  assert.strictEqual(res.status, 201);

  const dia = await diaNoCalendario(DATA.bloqueio);
  assert.strictEqual(dia.disponivel, false);
  assert.strictEqual(dia.motivo, 'bloqueada');

  const lista: { data: string; motivo: string | null }[] = await (
    await app.request('/api/admin/agenda/bloqueios', { headers: { Cookie: admin.Cookie } })
  ).json();
  assert.strictEqual(lista.find((b) => b.data === DATA.bloqueio)?.motivo, 'Manutenção');
});

// Corrigir o motivo é edição, não erro: sem `onConflictDoUpdate` o segundo POST
// estouraria pela chave primária da data.
test('rebloquear a mesma data troca o motivo', async () => {
  const admin = await autenticar('admin');
  const res = await bloquear(admin.Cookie, { data: DATA.bloqueio, motivo: 'Feriado' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual((await res.json()).motivo, 'Feriado');
});

test('desbloquear devolve a data ao calendário', async () => {
  const admin = await autenticar('admin');
  const res = await app.request(`/api/admin/agenda/bloqueios/${DATA.bloqueio}`, {
    method: 'DELETE',
    headers: { Cookie: admin.Cookie },
  });
  assert.strictEqual(res.status, 200);

  const dia = await diaNoCalendario(DATA.bloqueio);
  assert.strictEqual(dia.disponivel, true);
});

// Bloquear não desmarca o que já foi aceito. A confeiteira precisa saber que há
// gente esperando naquele dia para avisar ou recusar uma a uma.
test('bloquear avisa quantos pedidos já estavam marcados para o dia', async () => {
  const admin = await autenticar('admin');
  const cliente = await autenticar('cliente', 'agendado-no-dia-bloqueado');

  const pedido = await (
    await app.request('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cliente.Cookie },
      body: JSON.stringify({
        produtoId: 'brownie',
        quantidade: 1,
        selecoes: { 'tamanho-caixa': 'caixa-6' },
        tipoEntrega: 'retirada',
        dataEntrega: DATA.ocupada,
        horaEntrega: '15:00',
      }),
    })
  ).json();
  assert.ok(pedido.id, JSON.stringify(pedido));

  const res = await bloquear(admin.Cookie, { data: DATA.ocupada, motivo: 'Forno quebrou' });
  assert.strictEqual((await res.json()).pedidosNaData, 1);
});

test('o limite por dia é persistido e volta na leitura', async () => {
  const admin = await autenticar('admin');

  // Sob a trava: `agenda_config` é uma linha só para o banco inteiro, e o teste
  // de concorrência de `criarPedido` conta com o limite 5. O valor anterior é
  // restaurado no fim, para não deixar o banco alterado pela suíte.
  await comTravaGlobal(TRAVA_AGENDA, async () => {
    const anterior = await (
      await app.request('/api/admin/agenda/config', { headers: { Cookie: admin.Cookie } })
    ).json();

    const res = await app.request('/api/admin/agenda/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: admin.Cookie },
      body: JSON.stringify({ limitePorDia: 8 }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await res.json()).limitePorDia, 8);

    const lido = await (
      await app.request('/api/admin/agenda/config', { headers: { Cookie: admin.Cookie } })
    ).json();
    assert.strictEqual(lido.limitePorDia, 8);

    await app.request('/api/admin/agenda/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: admin.Cookie },
      body: JSON.stringify({ limitePorDia: anterior.limitePorDia }),
    });
  });
});

test('limite zero é rejeitado, em português', async () => {
  const admin = await autenticar('admin');
  const res = await app.request('/api/admin/agenda/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: admin.Cookie },
    body: JSON.stringify({ limitePorDia: 0 }),
  });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).erro, /^limitePorDia: /);
});

test('data fora do formato AAAA-MM-DD é recusada com 400', async () => {
  const admin = await autenticar('admin');
  const res = await bloquear(admin.Cookie, { data: '05/03/2027' });
  assert.strictEqual(res.status, 400);
  assert.strictEqual((await res.json()).codigo, 'bloqueio_invalido');
});
