import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { pedidoSchema } from '@divine/shared';
import { criarApp } from '../app.ts';
import { autenticar, limparUsuariosDeTeste } from '../testes/sessao.ts';

const app = criarApp();

// Cada arquivo de teste reserva um mês próprio. Os arquivos rodam em processos
// paralelos e a agenda aceita 5 pedidos por dia: dividir datas com outro arquivo
// faria um teste falhar por lotação causada pelo vizinho.
const DATA = { ana: '2026-11-10', bruno: '2026-11-12', detalhe: '2026-11-14' };

after(limparUsuariosDeTeste);

async function criarPedidoDe(Cookie: string, dataEntrega: string) {
  const res = await app.request('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie },
    body: JSON.stringify({
      produtoId: 'cookie-pistache',
      quantidade: 2,
      selecoes: { 'tamanho-caixa': 'caixa-12' },
      tipoEntrega: 'retirada',
      dataEntrega,
      horaEntrega: '10:00',
    }),
  });

  // O corpo é lido uma vez só: passar `await res.text()` como mensagem do assert
  // o consome mesmo quando o status está certo.
  const pedido = await res.json();
  assert.equal(res.status, 201, JSON.stringify(pedido));
  return pedido;
}

const listar = (Cookie: string) => app.request('/api/pedidos', { headers: { Cookie } });
const detalhar = (id: string, Cookie: string) =>
  app.request(`/api/pedidos/${id}`, { headers: { Cookie } });

test('sem sessão, listar responde 401', async () => {
  assert.equal((await app.request('/api/pedidos')).status, 401);
});

test('lista apenas os pedidos do próprio usuário', async () => {
  const ana = await autenticar('cliente', 'ana');
  const bruno = await autenticar('cliente', 'bruno');

  await criarPedidoDe(ana.Cookie, DATA.ana);

  assert.deepEqual(await (await listar(bruno.Cookie)).json(), []);

  const daAna = await (await listar(ana.Cookie)).json();
  assert.equal(daAna.length, 1);
  assert.equal(daAna[0].dataEntrega, DATA.ana);
});

test('não deixa um usuário ler o pedido de outro', async () => {
  const ana = await autenticar('cliente', 'ana');
  const bruno = await autenticar('cliente', 'bruno');
  const pedido = await criarPedidoDe(ana.Cookie, DATA.bruno);

  const res = await detalhar(pedido.id, bruno.Cookie);
  // 404 e não 403: confirmar que o id existe já entregaria informação.
  assert.equal(res.status, 404);
  assert.equal((await res.json()).codigo, 'nao_encontrado');
});

test('o detalhe traz as seleções e a data como YYYY-MM-DD', async () => {
  const ana = await autenticar('cliente', 'ana');
  const criado = await criarPedidoDe(ana.Cookie, DATA.detalhe);

  const pedido = await (await detalhar(criado.id, ana.Cookie)).json();
  assert.equal(pedido.dataEntrega, DATA.detalhe);
  assert.equal(pedido.selecoes.length, 1);
  assert.equal(pedido.selecoes[0].opcaoNome, 'Caixa com 12');
  // cookie-pistache 6200 + caixa-12 4800, vezes 2.
  assert.equal(pedido.total, (6200 + 4800) * 2);
});

test('o que a criação devolve é igual ao que a leitura devolve', async () => {
  const ana = await autenticar('cliente', 'ana');
  const criado = await criarPedidoDe(ana.Cookie, DATA.detalhe);

  const lido = await (await detalhar(criado.id, ana.Cookie)).json();
  // Um formato só para o mesmo recurso: o app usa o corpo da criação para
  // mostrar a confirmação e depois relê o pedido na tela de acompanhamento.
  assert.deepEqual(lido, criado);
});

test('a listagem cumpre o contrato publicado e não vaza o id do usuário', async () => {
  const ana = await autenticar('cliente', 'ana');

  const pedidos = await (await listar(ana.Cookie)).json();
  for (const pedido of pedidos) {
    const analise = pedidoSchema.safeParse(pedido);
    assert.ok(analise.success, JSON.stringify(analise.error?.issues, null, 2));
    assert.equal('usuarioId' in pedido, false);
  }
});

test('a listagem vem do mais recente para o mais antigo', async () => {
  const ana = await autenticar('cliente', 'ana');

  const pedidos = await (await listar(ana.Cookie)).json();
  const datas = pedidos.map((p: { criadoEm: string }) => p.criadoEm);
  assert.deepEqual(datas, [...datas].sort().reverse());
});
