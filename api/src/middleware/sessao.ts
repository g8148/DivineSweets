import { createMiddleware } from 'hono/factory';
import { auth } from '../auth.ts';
import { ErroApi } from '../erros.ts';

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  role: 'cliente' | 'admin';
};

export type Variables = { usuario: Usuario };

export const exigirSessao = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const sessao = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!sessao) throw new ErroApi(401, 'Faça login para continuar', 'sem_sessao');

  const u = sessao.user as unknown as {
    id: string;
    name: string;
    email: string;
    telefone?: string;
    role?: string;
  };

  // O papel é normalizado aqui, na entrada: só a string exata 'admin' promove.
  // Qualquer outro valor no banco — nulo, vazio, lixo — vira 'cliente'.
  c.set('usuario', {
    id: u.id,
    nome: u.name,
    email: u.email,
    telefone: u.telefone ?? '',
    role: u.role === 'admin' ? 'admin' : 'cliente',
  });

  await next();
});

export const exigirAdmin = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  if (c.get('usuario').role !== 'admin') {
    throw new ErroApi(403, 'Acesso restrito à administração', 'sem_permissao');
  }
  await next();
});
