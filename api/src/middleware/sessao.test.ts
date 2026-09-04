import test from 'node:test';
import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { exigirAdmin, exigirSessao } from './sessao.ts';
import type { Variables } from './sessao.ts';
import { ErroApi } from '../erros.ts';

function appDeTeste() {
  const app = new Hono<{ Variables: Variables }>();
  app.use('/privado', exigirSessao);
  app.get('/privado', (c) => c.json({ id: c.get('usuario').id }));
  app.use('/admin', exigirSessao, exigirAdmin);
  app.get('/admin', (c) => c.json({ ok: true }));
  app.onError((e, c) =>
    c.json({ erro: e.message }, e instanceof ErroApi ? (e.status as 401 | 403) : 500),
  );
  return app;
}

test('sem sessão a rota privada responde 401', async () => {
  const res = await appDeTeste().request('/privado');
  assert.strictEqual(res.status, 401);
});

// A ordem dos middlewares importa: `exigirAdmin` lê `c.get('usuario')`, que só
// existe depois do `exigirSessao`. Se invertesse, um anônimo levaria 403 — ou
// um TypeError — em vez do 401 que diz ao app para mandar o usuário ao login.
test('sem sessão a rota de admin responde 401, não 403', async () => {
  const res = await appDeTeste().request('/admin');
  assert.strictEqual(res.status, 401);
});
