import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { auth } from './auth.ts';
import { config } from './config.ts';
import { montarDocs } from './docs.ts';
import { ErroApi } from './erros.ts';
import type { Variables } from './middleware/sessao.ts';
import { rotasAdminAgenda } from './rotas/admin/agenda.ts';
import { rotasAdminGrupos } from './rotas/admin/grupos.ts';
import { rotasAdminPedidos } from './rotas/admin/pedidos.ts';
import { rotasAdminProdutos } from './rotas/admin/produtos.ts';
import { rotasAgenda } from './rotas/agenda.ts';
import { rotasApp } from './rotas/app.ts';
import { rotasPedidos } from './rotas/pedidos.ts';
import { rotasProdutos } from './rotas/produtos.ts';
import { rotasUpload } from './rotas/upload.ts';

export function criarApp() {
  const app = new Hono<{ Variables: Variables }>();

  app.use('*', logger());

  // O Better Auth traz as próprias rotas de cadastro, login e sessão.
  app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

  app.get('/health', (c) => c.json({ ok: true }));

  // Página de download do APK. Fora de `/api` de propósito: é endereço para
  // ditar a uma pessoa, não rota de programa.
  app.route('/app', rotasApp);

  app.route('/api/produtos', rotasProdutos);
  app.route('/api/agenda', rotasAgenda);
  app.route('/api/pedidos', rotasPedidos);
  app.route('/api/upload', rotasUpload);
  app.route('/api/admin/pedidos', rotasAdminPedidos);
  app.route('/api/admin/produtos', rotasAdminProdutos);
  app.route('/api/admin/agenda', rotasAdminAgenda);
  app.route('/api/admin/grupos', rotasAdminGrupos);

  // `root` recebe o diretório absoluto de uploads, e o prefixo `/uploads` sai do
  // caminho antes do join — senão o arquivo seria procurado em
  // `<uploads>/uploads/...`.
  app.use(
    '/uploads/*',
    serveStatic({
      root: config.uploadsDir,
      rewriteRequestPath: (caminho) => caminho.replace(/^\/uploads/, ''),
    }),
  );

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
