import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { pedidoSchema } from '@divine/shared';
import { eq } from 'drizzle-orm';
import { criarApp } from '../app.ts';
import { db } from '../db/client.ts';
import { agendaBloqueios, pedidoSelecoes } from '../db/schema.ts';
import { autenticar, limparUsuariosDeTeste } from '../testes/sessao.ts';
import { comTravaGlobal, TRAVA_AGENDA } from '../testes/trava.ts';

// O catálogo vem do seed (`npm run db:seed`), como nos demais testes de rota.
const app = criarApp();

const DATA_BLOQUEADA = '2026-12-11';
// Uma data por teste: o limite da agenda é 5 por dia, e reaproveitar a mesma
// faria o quinto teste falhar por lotação em vez de pelo que ele mede.
const DATA = {
  criacao: '2026-12-10',
  entrega: '2026-12-12',
  snapshot: '2026-12-14',
  contrato: '2026-12-16',
  corrida: '2026-12-18',
};

after(async () => {
  await db.delete(agendaBloqueios).where(eq(agendaBloqueios.data, DATA_BLOQUEADA));
  await limparUsuariosDeTeste();
});

function corpo(over: Record<string, unknown> = {}) {
  return {
    produtoId: 'bolo-chocolate',
    quantidade: 1,
    // Os três grupos obrigatórios do bolo. Massa e recheio escolhidos com delta
    // zero para o total do teste depender só do tamanho.
    selecoes: {
      'tamanho-bolo': 'bolo-1-5kg',
      'sabor-massa': 'massa-chocolate',
      recheio: 'recheio-brigadeiro',
    },
    tipoEntrega: 'retirada',
    dataEntrega: DATA.criacao,
    horaEntrega: '14:00',
    ...over,
  };
}

async function postar(body: unknown, headers: Record<string, string> = {}) {
  return app.request('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function postarLogado(over: Record<string, unknown> = {}) {
  const { Cookie } = await autenticar();
  return postar(corpo(over), { Cookie });
}

test('sem sessão responde 401', async () => {
  const res = await postar(corpo());
  assert.equal(res.status, 401);
  assert.equal((await res.json()).codigo, 'sem_sessao');
});

test('cria o pedido e calcula o total no servidor', async () => {
  const res = await postarLogado();
  assert.equal(res.status, 201);

  const pedido = await res.json();
  // bolo-chocolate 12000 + bolo-1-5kg 5500; retirada não soma taxa.
  assert.equal(pedido.subtotal, 17500);
  assert.equal(pedido.taxaEntrega, 0);
  assert.equal(pedido.total, 17500);
  assert.equal(pedido.status, 'recebido');
});

test('a resposta cumpre o contrato publicado no OpenAPI', async () => {
  const res = await postarLogado({ dataEntrega: DATA.contrato });
  const analise = pedidoSchema.safeParse(await res.json());
  assert.ok(analise.success, JSON.stringify(analise.error?.issues, null, 2));
});

test('entrega soma a taxa uma vez, não por unidade', async () => {
  const res = await postarLogado({
    quantidade: 3,
    tipoEntrega: 'entrega',
    endereco: 'Rua Teste, 100',
    dataEntrega: DATA.entrega,
  });

  const pedido = await res.json();
  assert.equal(pedido.subtotal, 17500 * 3);
  assert.equal(pedido.taxaEntrega, 1000);
  assert.equal(pedido.total, 17500 * 3 + 1000);
});

test('preço enviado pelo cliente é recusado, não obedecido', async () => {
  const res = await postarLogado({ total: 1, subtotal: 1 });
  assert.equal(res.status, 400);
  // A mensagem é nossa, e não a do Zod: a padrão vem em inglês e apareceria no
  // app no meio de erros em português.
  assert.deepEqual(await res.json(), {
    erro: 'Campo não aceito nesta requisição: total, subtotal',
    codigo: 'pedido_invalido',
  });
});

test('recusa opção que não pertence a um grupo do produto', async () => {
  const res = await postarLogado({ selecoes: { 'tamanho-caixa': 'caixa-12' } });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).codigo, 'selecao_invalida');
});

test('recusa opção de outro grupo com id inexistente', async () => {
  const res = await postarLogado({
    selecoes: { ...corpo().selecoes, 'tamanho-bolo': 'bolo-40kg' },
  });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).codigo, 'selecao_invalida');
});

test('recusa quando falta um grupo obrigatório', async () => {
  const res = await postarLogado({ selecoes: {} });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).codigo, 'grupo_obrigatorio');
});

test('recusa entrega sem endereço', async () => {
  const res = await postarLogado({ tipoEntrega: 'entrega' });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).codigo, 'endereco_obrigatorio');
});

test('produto inexistente responde 404', async () => {
  const res = await postarLogado({ produtoId: 'bolo-de-marmore-invisivel' });
  assert.equal(res.status, 404);
});

test('recusa data bloqueada com 409 e motivo', async () => {
  await db
    .insert(agendaBloqueios)
    .values({ data: DATA_BLOQUEADA, motivo: 'Feriado' })
    .onConflictDoNothing();

  const res = await postarLogado({ dataEntrega: DATA_BLOQUEADA });
  assert.equal(res.status, 409);
  assert.equal((await res.json()).codigo, 'data_indisponivel');
});

test('recusa data com menos de 48h de antecedência', async () => {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  // Formatado no fuso local: `toISOString` vira UTC e, à noite, adiantaria o dia.
  const iso = `${amanha.getFullYear()}-${String(amanha.getMonth() + 1).padStart(2, '0')}-${String(amanha.getDate()).padStart(2, '0')}`;

  const res = await postarLogado({ dataEntrega: iso });
  assert.equal(res.status, 409);
  assert.equal((await res.json()).codigo, 'data_indisponivel');
});

test('grava o snapshot da seleção, não só o id', async () => {
  const res = await postarLogado({ dataEntrega: DATA.snapshot });
  const pedido = await res.json();

  const tamanho = pedido.selecoes.find((s: { grupoTitulo: string }) => s.grupoTitulo === 'Tamanho');
  assert.deepEqual(tamanho, {
    grupoTitulo: 'Tamanho',
    opcaoNome: '1,5 kg — 25 fatias',
    delta: 5500,
  });

  // E o snapshot precisa estar no banco, não só na resposta: é ele que mantém o
  // pedido legível depois que o preço da opção mudar.
  const gravadas = await db
    .select()
    .from(pedidoSelecoes)
    .where(eq(pedidoSelecoes.pedidoId, pedido.id));

  assert.equal(gravadas.length, 3);
  assert.equal(gravadas.find((g) => g.grupoId === 'tamanho-bolo')?.delta, 5500);
});

test('dez pedidos simultâneos no mesmo dia não furam o limite da agenda', async () => {
  const { Cookie } = await autenticar();

  // Sob a trava: o limite diário é uma linha global, e o teste da agenda
  // administrativa a altera. Sem serializar, este teste falharia por causa do
  // outro, e a mensagem não diria nada sobre a causa.
  const respostas = await comTravaGlobal(TRAVA_AGENDA, () =>
    Promise.all(
      Array.from({ length: 10 }, () => postar(corpo({ dataEntrega: DATA.corrida }), { Cookie })),
    ),
  );

  const criados = respostas.filter((r) => r.status === 201).length;
  const recusados = respostas.filter((r) => r.status === 409).length;

  // Sem o lock consultivo na transação, os dez leem a contagem zerada ao mesmo
  // tempo, todos se acham dentro do limite e o dia fecha com dez encomendas.
  assert.equal(criados, 5);
  assert.equal(recusados, 5);
});
