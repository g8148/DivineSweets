import { Scalar } from '@scalar/hono-api-reference';
import type { Hono } from 'hono';
import { openAPIRouteHandler } from 'hono-openapi';

/**
 * Registra a spec e a página navegável. Chame por último: a spec é derivada das
 * rotas já montadas no app, então o que vier depois fica de fora.
 */
export function montarDocs(app: Hono<any>) {
  app.get(
    '/openapi.json',
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: 'API Divine Sweets',
          version: '1.0.0',
          description: 'Encomendas de doces personalizados.',
        },
      },
    }),
  );

  app.get('/docs', Scalar({ url: '/openapi.json' }));
}
