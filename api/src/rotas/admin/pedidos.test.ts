import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { pedidoSchema } from '@divine/shared';
import { criarApp } from '../../app.ts';
import { autenticar, limparUsuariosDeTeste } from '../../testes/sessao.ts';

const app = criarApp();

// Mês próprio: os arquivos de teste rodam em processos paralelos e a agenda
// aceita 5 pedidos por dia. Agenda usa outubro, leitura novembro, criação
// dezembro; a administração fica com janeiro.
const DATA = { lista: '2027-01-10', status: '2027-01-12', recusa: '2027-01-14', detalhe: '2027-01-16' };

after(limparUsuariosDeTeste);

async function pedidoDeTeste(Cookie: string, dataEntrega: string) {
  const res = await app.request('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie },
    body: JSON.stringify({
      produtoId: 'brownie',
      quantidade: 1,
      // `brownie` tem `tamanho-caixa` como grupo obrigatório: com `selecoes: {}`
      // a criação responde 400 e o teste nem chegaria ao painel.
      selecoes: { 'tamanho-caixa': 'caixa-6' },
      tipoEntrega: 'retirada',
      dataEntrega,
      horaEntrega: '15:00',
    }),
  });

  const pedido = await res.json();
  assert.equal(res.status, 201, JSON.stringify(pedido));
  return pedido;
}

const mudar = (id: string, Cookie: string, corpo: unknown) =>
  app.request(`/api/admin/pedidos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie },
    body: JSON.stringify(corpo),
  });

test('sem sessão recebe 401, não 403', async () => {
  const res = await app.request('/api/admin/pedidos');
  assert.equal(res.status, 401);
  assert.equal((await res.json()).codigo, 'sem_sessao');
});

test('cliente comum recebe 403 no painel administrativo', async () => {
  const cliente = await autenticar('cliente');
  const res = await app.request('/api/admin/pedidos', { headers: { Cookie: cliente.Cookie } });

  assert.equal(res.status, 403);
  assert.equal((await res.json()).codigo, 'sem_permissao');
});

test('admin enxerga pedidos de outros clientes, com nome do cliente', async () => {
  const cliente = await autenticar('cliente');
  const criado = await pedidoDeTeste(cliente.Cookie, DATA.lista);
  const admin = await autenticar('admin');

  const res = await app.request('/api/admin/pedidos', { headers: { Cookie: admin.Cookie } });
  assert.equal(res.status, 200);

  const lista = await res.json();
  const meu = lista.find((p: { id: string }) => p.id === criado.id);
  assert.ok(meu, 'o pedido do cliente não apareceu na listagem administrativa');
  // A confeiteira precisa saber de quem é a encomenda para produzir e entregar.
  assert.equal(meu.clienteNome, 'Teste');
  assert.ok(pedidoSchema.safeParse(meu).success);
});

test('admin muda o status do pedido', async () => {
  const cliente = await autenticar('cliente');
  const pedido = await pedidoDeTeste(cliente.Cookie, DATA.status);
  const admin = await autenticar('admin');

  const res = await mudar(pedido.id, admin.Cookie, { status: 'producao' });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'producao');
});

test('cliente comum não muda status', async () => {
  const cliente = await autenticar('cliente');
  const pedido = await pedidoDeTeste(cliente.Cookie, DATA.status);

  const res = await mudar(pedido.id, cliente.Cookie, { status: 'entregue' });
  assert.equal(res.status, 403);
});

test('recusar sem motivo é rejeitado', async () => {
  const cliente = await autenticar('cliente');
  const pedido = await pedidoDeTeste(cliente.Cookie, DATA.recusa);
  const admin = await autenticar('admin');

  for (const corpo of [{ status: 'recusado' }, { status: 'recusado', motivoRecusa: '   ' }]) {
    const res = await mudar(pedido.id, admin.Cookie, corpo);
    assert.equal(res.status, 400, JSON.stringify(corpo));
    assert.equal((await res.json()).codigo, 'motivo_obrigatorio');
  }
});

test('recusar com motivo grava o texto, e reabrir o pedido apaga o motivo', async () => {
  const cliente = await autenticar('cliente');
  const pedido = await pedidoDeTeste(cliente.Cookie, DATA.recusa);
  const admin = await autenticar('admin');

  const recusado = await (
    await mudar(pedido.id, admin.Cookie, {
      status: 'recusado',
      motivoRecusa: 'Sem forno disponível nessa data',
    })
  ).json();
  assert.equal(recusado.status, 'recusado');
  assert.equal(recusado.motivoRecusa, 'Sem forno disponível nessa data');

  // Sem a limpeza, o pedido reaberto seguiria mostrando a recusa antiga na tela
  // de acompanhamento do cliente.
  const reaberto = await (await mudar(pedido.id, admin.Cookie, { status: 'producao' })).json();
  assert.equal(reaberto.motivoRecusa, null);
});

test('filtra por status', async () => {
  const admin = await autenticar('admin');
  const res = await app.request('/api/admin/pedidos?status=producao', {
    headers: { Cookie: admin.Cookie },
  });

  const lista = await res.json();
  // Sem este assert o teste passaria com a lista vazia, sem filtrar nada.
  assert.ok(lista.length > 0, 'nenhum pedido em produção para o filtro conferir');
  assert.ok(lista.every((p: { status: string }) => p.status === 'producao'));
});

test('status fora do enum responde 400 no formato de erro da API', async () => {
  const cliente = await autenticar('cliente');
  const pedido = await pedidoDeTeste(cliente.Cookie, DATA.status);
  const admin = await autenticar('admin');

  const res = await mudar(pedido.id, admin.Cookie, { status: 'assando' });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).codigo, 'status_invalido');
});

test('pedido inexistente responde 404', async () => {
  const admin = await autenticar('admin');
  const res = await mudar('nao-existe', admin.Cookie, { status: 'pronto' });
  assert.equal(res.status, 404);
});

// A administração precisa abrir o pedido de outra pessoa — é o trabalho dela.
// Pela rota do cliente, que filtra pelo dono, isso responderia 404.
test('o admin abre o detalhe de um pedido que não é dele', async () => {
  const admin = await autenticar('admin');
  const cliente = await autenticar('cliente', 'dono-do-detalhe-admin');
  const pedido = await pedidoDeTeste(cliente.Cookie, DATA.detalhe);

  const pelaRotaDoCliente = await app.request(`/api/pedidos/${pedido.id}`, {
    headers: { Cookie: admin.Cookie },
  });
  assert.strictEqual(pelaRotaDoCliente.status, 404, 'a rota do cliente não pode servir a administração');

  const res = await app.request(`/api/admin/pedidos/${pedido.id}`, {
    headers: { Cookie: admin.Cookie },
  });
  const corpo = await res.json();
  assert.strictEqual(res.status, 200, JSON.stringify(corpo));
  assert.strictEqual(corpo.id, pedido.id);
  assert.strictEqual(corpo.clienteNome, 'Teste');
});

test('cliente comum não abre o detalhe pela rota administrativa', async () => {
  const cliente = await autenticar('cliente');
  const res = await app.request('/api/admin/pedidos/qualquer-id', { headers: { Cookie: cliente.Cookie } });
  assert.strictEqual(res.status, 403);
});
