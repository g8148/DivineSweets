import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogo, produtoSchema } from '@divine/shared';
import { criarApp } from '../app.ts';
import { semear } from '../db/seed.ts';

await semear();
const app = criarApp();

// Presença dos 14, e não contagem exata: os testes de administração rodam em
// paralelo e criam produtos temporários que também são públicos enquanto vivem.
test('lista o catálogo sem exigir login', async () => {
  const res = await app.request('/api/produtos');
  assert.strictEqual(res.status, 200);
  const ids = new Set((await res.json()).map((p: { id: string }) => p.id));
  for (const produto of catalogo) {
    assert.ok(ids.has(produto.id), `${produto.id} faltou no catálogo`);
  }
});

// O contrato que o app consome é o mesmo schema Zod compartilhado. Validar a
// resposta inteira contra ele pega qualquer campo que a rota deixe de mandar.
test('cada produto da lista satisfaz o schema compartilhado', async () => {
  const res = await app.request('/api/produtos');
  for (const produto of await res.json()) {
    produtoSchema.parse(produto);
  }
});

test('cada produto vem com seus grupos de opções embutidos', async () => {
  const res = await app.request('/api/produtos');
  const corpo = await res.json();
  const bolo = corpo.find((p: { id: string }) => p.id === 'bolo-chocolate');
  assert.ok(
    bolo.grupos.map((g: { id: string }) => g.id).includes('sabor-massa'),
    'bolo-chocolate deveria trazer o grupo sabor-massa',
  );
  assert.ok(bolo.grupos[0].opcoes.length > 0);
});

test('preço vem em centavos', async () => {
  const res = await app.request('/api/produtos/bolo-chocolate');
  const bolo = await res.json();
  assert.strictEqual(bolo.precoBase, 12000);
});

test('produto inexistente responde 404', async () => {
  const res = await app.request('/api/produtos/nao-existe');
  assert.strictEqual(res.status, 404);
});

test('a spec OpenAPI é gerada e lista o catálogo', async () => {
  const res = await app.request('/openapi.json');
  assert.strictEqual(res.status, 200);
  const spec = await res.json();
  assert.ok(spec.paths['/api/produtos'], 'a spec deveria descrever /api/produtos');
  assert.ok(spec.paths['/api/produtos/{id}'], 'a spec deveria descrever /api/produtos/{id}');
});
