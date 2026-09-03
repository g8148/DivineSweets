import { Hono } from 'hono';
import { logger } from 'hono/logger';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ErroApi } from './erros.ts';

export function criarApp() {
  const app = new Hono();

  app.use('*', logger());

  app.get('/health', (c) => c.json({ ok: true }));

  app.notFound((c) => c.json({ erro: 'Rota não encontrada' }, 404));

  app.onError((err, c) => {
    if (err instanceof ErroApi) {
      return c.json({ erro: err.message, codigo: err.codigo }, err.status as ContentfulStatusCode);
    }
    console.error(err);
    return c.json({ erro: 'Erro interno do servidor' }, 500);
  });

  return app;
}
