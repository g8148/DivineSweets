import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { produtoSchema } from '@divine/shared';
import { inArray } from 'drizzle-orm';
import { criarApp } from '../../app.ts';
import { db } from '../../db/client.ts';
import { produtos } from '../../db/schema.ts';
import { semear } from '../../db/seed.ts';
import { autenticar, limparUsuariosDeTeste } from '../../testes/sessao.ts';

await semear();
const app = criarApp();

// Fevereiro é deste arquivo: agenda usa outubro, leitura novembro, criação
// dezembro, pedidos administrativos janeiro.
const DATA_ENTREGA = '2027-02-10';

/**
 * Produtos criados aqui são lixo de teste e precisam sair do banco: enquanto
 * existirem, aparecem no catálogo público e quebram as contagens de
 * `produtos.test.ts` e `seed.test.ts`, que rodam em paralelo.
 */
const criados = new Set<string>();

after(async () => {
  // Os pedidos primeiro: a FK de `pedidos.produto_id` não tem cascade, de
  // propósito — é ela que impede apagar um produto e deixar o histórico órfão.
  await limparUsuariosDeTeste();
  if (criados.size > 0) await db.delete(produtos).where(inArray(produtos.id, [...criados]));
});

const novo = {
  nome: 'Cookie de Teste',
  categoria: 'cookies',
  descricao: 'Criado pelo teste automatizado.',
  precoBase: 5000,
  gruposIds: ['tamanho-caixa'],
  permiteMensagem: false,
  permiteFoto: false,
  ativo: true,
  ordem: 999,
};

async function criar(Cookie: string, campos: Record<string, unknown> = {}) {
  const res = await app.request('/api/admin/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie },
    body: JSON.stringify({ ...novo, nome: `Cookie ${Date.now()}`, ...campos }),
  });
  const corpo = await res.json();
  assert.strictEqual(res.status, 201, JSON.stringify(corpo));
  criados.add(corpo.id);
  return corpo;
}

async function catalogoPublico(): Promise<{ id: string }[]> {
  return (await app.request('/api/produtos')).json();
}

test('sem sessão o cadastro responde 401, e não 403', async () => {
  const res = await app.request('/api/admin/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(novo),
  });
  assert.strictEqual(res.status, 401);
});

test('cliente comum não cria produto', async () => {
  const cliente = await autenticar('cliente');
  const res = await app.request('/api/admin/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cliente.Cookie },
    body: JSON.stringify(novo),
  });
  assert.strictEqual(res.status, 403);
});

test('admin cria produto e ele aparece no catálogo público', async () => {
  const admin = await autenticar('admin');
  const criado = await criar(admin.Cookie);

  produtoSchema.parse(criado);
  assert.strictEqual(criado.grupos.length, 1, 'o vínculo com tamanho-caixa deveria ter sido gravado');

  const publico = await catalogoPublico();
  assert.ok(publico.some((p) => p.id === criado.id));
});

test('preço com centavo fracionado é rejeitado', async () => {
  const admin = await autenticar('admin');
  const res = await app.request('/api/admin/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: admin.Cookie },
    body: JSON.stringify({ ...novo, precoBase: 50.5 }),
  });
  assert.strictEqual(res.status, 400);
  const { erro } = await res.json();
  // Prefixado pelo campo e em português: é a mensagem que a tela exibe.
  assert.match(erro, /^precoBase: /);
});

// Sem a conferência prévia, quem digita um id de grupo errado esbarra na chave
// estrangeira do Postgres e recebe 500 — um erro de preenchimento disfarçado de
// falha do servidor.
test('grupo de opções inexistente responde 400, e não 500', async () => {
  const admin = await autenticar('admin');
  const res = await app.request('/api/admin/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: admin.Cookie },
    body: JSON.stringify({ ...novo, gruposIds: ['grupo-que-nao-existe'] }),
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual((await res.json()).codigo, 'grupo_desconhecido');
});

test('excluir apenas desativa, preservando o histórico de pedidos', async () => {
  const admin = await autenticar('admin');
  const cliente = await autenticar('cliente', 'comprador-do-descontinuado');

  // Sem grupos: o pedido pode ir com `selecoes: {}` sem esbarrar em grupo
  // obrigatório.
  const produto = await criar(admin.Cookie, { nome: `Temporário ${Date.now()}`, gruposIds: [] });

  const pedido = await (
    await app.request('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cliente.Cookie },
      body: JSON.stringify({
        produtoId: produto.id,
        quantidade: 1,
        selecoes: {},
        tipoEntrega: 'retirada',
        dataEntrega: DATA_ENTREGA,
        horaEntrega: '15:00',
      }),
    })
  ).json();
  assert.ok(pedido.id, JSON.stringify(pedido));

  const res = await app.request(`/api/admin/produtos/${produto.id}`, {
    method: 'DELETE',
    headers: { Cookie: admin.Cookie },
  });
  assert.strictEqual(res.status, 200);

  const publico = await catalogoPublico();
  assert.ok(!publico.some((p) => p.id === produto.id), 'produto desativado não pode sair no catálogo');

  // A razão de a exclusão ser lógica: o pedido antigo continua legível.
  const lido = await (
    await app.request(`/api/pedidos/${pedido.id}`, { headers: { Cookie: cliente.Cookie } })
  ).json();
  assert.strictEqual(lido.produtoNome, produto.nome);
});

// Se a administração enxergasse o catálogo pela rota pública, desativar um
// produto seria irreversível: ele sumiria da tela que teria de reativá-lo.
test('a listagem administrativa mostra o produto desativado, e o PATCH o reativa', async () => {
  const admin = await autenticar('admin');
  const produto = await criar(admin.Cookie, { nome: `Sazonal ${Date.now()}` });

  await app.request(`/api/admin/produtos/${produto.id}`, {
    method: 'DELETE',
    headers: { Cookie: admin.Cookie },
  });

  const lista: { id: string; ativo: boolean }[] = await (
    await app.request('/api/admin/produtos', { headers: { Cookie: admin.Cookie } })
  ).json();
  const naLista = lista.find((p) => p.id === produto.id);
  assert.ok(naLista, 'o produto desativado deveria continuar na listagem administrativa');
  assert.strictEqual(naLista.ativo, false);

  const res = await app.request(`/api/admin/produtos/${produto.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: admin.Cookie },
    body: JSON.stringify({ ativo: true, precoBase: 6000 }),
  });
  const corpo = await res.json();
  assert.strictEqual(res.status, 200, JSON.stringify(corpo));
  assert.strictEqual(corpo.precoBase, 6000);

  const publico = await catalogoPublico();
  assert.ok(publico.some((p) => p.id === produto.id), 'reativado, o produto volta ao catálogo');
});

// Desativar pelo PATCH é a mesma operação do DELETE. Se a resposta fosse lida
// pela regra do catálogo público, viria 404 numa operação que deu certo.
test('PATCH que desativa devolve o produto, e não 404', async () => {
  const admin = await autenticar('admin');
  const produto = await criar(admin.Cookie, { nome: `Fora de linha ${Date.now()}` });

  const res = await app.request(`/api/admin/produtos/${produto.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: admin.Cookie },
    body: JSON.stringify({ ativo: false }),
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).ativo, false);
});

// Um PATCH só com `gruposIds` não passa pelo UPDATE em `produtos`. Sem conferir
// a existência à parte, quem administra recebe o 500 da chave estrangeira em vez
// do 404 que explica o problema.
test('PATCH só com gruposIds em produto inexistente responde 404', async () => {
  const admin = await autenticar('admin');
  const res = await app.request('/api/admin/produtos/nao-existe', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: admin.Cookie },
    body: JSON.stringify({ gruposIds: ['tamanho-caixa'] }),
  });
  assert.strictEqual(res.status, 404);
});

test('campo desconhecido no corpo é recusado em português', async () => {
  const admin = await autenticar('admin');
  const res = await app.request('/api/admin/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: admin.Cookie },
    body: JSON.stringify({ ...novo, id: 'id-escolhido-pelo-cliente' }),
  });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).erro, /Campo não aceito/);
});
