import { eq, inArray, like } from 'drizzle-orm';
import { criarApp } from '../app.ts';
import { db } from '../db/client.ts';
import { pedidos, user } from '../db/schema.ts';

/** Prefixo que marca os usuários criados pelos testes, para a limpeza achá-los. */
const PREFIXO = 'teste-';
const DOMINIO = '@divine.dev';

const sessoes = new Map<string, Promise<Sessao>>();

export type Sessao = { Cookie: string; email: string };

/**
 * Cadastra um usuário e devolve o header `Cookie` da sessão, para os testes de
 * rotas autenticadas.
 *
 * O resultado fica memoizado por papel porque `/sign-up/email` tem limite de 5
 * cadastros por janela: um usuário novo a cada teste estouraria o limite e as
 * falhas apareceriam como 429 aleatórios, longe da causa.
 */
export function autenticar(role: 'cliente' | 'admin' = 'cliente'): Promise<Sessao> {
  const existente = sessoes.get(role);
  if (existente) return existente;

  const nova = cadastrar(role);
  sessoes.set(role, nova);
  return nova;
}

async function cadastrar(role: 'cliente' | 'admin'): Promise<Sessao> {
  const app = criarApp();
  // O sufixo aleatório evita colisão com sobras de uma execução interrompida
  // antes da limpeza.
  const email = `${PREFIXO}${role}-${Date.now()}-${Math.random().toString(36).slice(2)}${DOMINIO}`;

  const res = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'senha-de-teste-123', name: 'Teste' }),
  });

  if (!res.ok) throw new Error(`Cadastro de teste falhou (${res.status}): ${await res.text()}`);

  const cookie = res.headers.get('set-cookie');
  if (!cookie) throw new Error('Cadastro não devolveu cookie de sessão');

  // `role` é `input: false` no Better Auth: promover é escrita direta no banco,
  // exatamente como na produção.
  if (role === 'admin') {
    await db.update(user).set({ role: 'admin' }).where(eq(user.email, email));
  }

  return { Cookie: cookie.split(';')[0], email };
}

/**
 * Apaga os usuários de teste e os pedidos deles. Os pedidos vão primeiro: a FK
 * de `pedidos.usuario_id` não tem cascade, de propósito, para que ninguém apague
 * um cliente e leve o histórico junto.
 */
export async function limparUsuariosDeTeste() {
  const criados = await db
    .select({ id: user.id })
    .from(user)
    .where(like(user.email, `${PREFIXO}%${DOMINIO}`));

  if (criados.length === 0) return;

  const ids = criados.map((u) => u.id);
  await db.delete(pedidos).where(inArray(pedidos.usuarioId, ids));
  await db.delete(user).where(inArray(user.id, ids));
  sessoes.clear();
}
