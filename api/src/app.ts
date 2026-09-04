import { Hono } from 'hono';
import { logger } from 'hono/logger';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { auth } from './auth.ts';
import { ErroApi } from './erros.ts';
import { montarDocs } from './docs.ts';
import type { Variables } from './middleware/sessao.ts';
import { rotasAgenda } from './rotas/agenda.ts';
import { rotasPedidos } from './rotas/pedidos.ts';
import { rotasProdutos } from './rotas/produtos.ts';

export function criarApp() {
  const app = new Hono<{ Variables: Variables }>();

  app.use('*', logger());

  // O Better Auth traz as próprias rotas de cadastro, login e sessão.
  app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

  app.get('/health', (c) => c.json({ ok: true }));

  app.route('/api/produtos', rotasProdutos);
  app.route('/api/agenda', rotasAgenda);
  app.route('/api/pedidos', rotasPedidos);

  // Por último, para a spec enxergar todas as rotas acima.
  montarDocs(app);

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
