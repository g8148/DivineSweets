import { serve } from '@hono/node-server';
import { criarApp } from './app.ts';
import { config } from './config.ts';

serve({ fetch: criarApp().fetch, port: config.porta, hostname: '127.0.0.1' }, (info) => {
  console.log(`API da Divine Sweets em http://127.0.0.1:${info.port}`);
});
