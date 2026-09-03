import test from 'node:test';
import assert from 'node:assert/strict';
import { criarApp } from './app.ts';

test('responde no healthcheck', async () => {
  const res = await criarApp().request('/health');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(await res.json(), { ok: true });
});

test('rota inexistente responde 404 em JSON', async () => {
  const res = await criarApp().request('/nao-existe');
  assert.strictEqual(res.status, 404);
  assert.ok(((await res.json()) as { erro?: string }).erro);
});
