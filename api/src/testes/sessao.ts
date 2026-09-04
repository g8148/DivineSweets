import { eq, inArray } from 'drizzle-orm';
import { criarApp } from '../app.ts';
import { db } from '../db/client.ts';
import { pedidos, user } from '../db/schema.ts';

const sessoes = new Map<string, Promise<Sessao>>();

/**
 * Ids criados por ESTE processo. O `node --test` roda cada arquivo em um
 * processo próprio, em paralelo: apagar por padrão de e-mail derrubaria a sessão
 * de um arquivo que ainda está rodando, e a falha apareceria como um 401
 * aleatório em outro teste.
 */
const criados = new Set<string>();

export type Sessao = { Cookie: string; email: string };

/**
 * Cadastra um usuário e devolve o header `Cookie` da sessão, para os testes de
 * rotas autenticadas.
 *
 * Memoizado: `/sign-up/email` aceita 5 cadastros por janela, e um usuário novo a
 * cada teste estouraria o limite — as falhas apareceriam como 429 aleatórios,
 * longe da causa. O `apelido` é para quando o teste precisa de duas pessoas
 * diferentes, como o que verifica que ninguém lê o pedido do vizinho.
 */
export function autenticar(
  role: 'cliente' | 'admin' = 'cliente',
  // `string`, e não o tipo do papel: o padrão é o papel, mas o apelido é livre.
  apelido: string = role,
): Promise<Sessao> {
  const chave = `${role}:${apelido}`;
  const existente = sessoes.get(chave);
  if (existente) return existente;

  const nova = cadastrar(role, apelido);
  sessoes.set(chave, nova);
  return nova;
}

async function cadastrar(role: 'cliente' | 'admin', apelido: string): Promise<Sessao> {
  const app = criarApp();
  // O sufixo aleatório evita colisão com sobras de uma execução interrompida
  // antes da limpeza.
  const email = `teste-${apelido}-${Date.now()}-${Math.random().toString(36).slice(2)}@divine.dev`;

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
  const [criado] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email));
  if (criado) criados.add(criado.id);

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
  if (criados.size === 0) return;

  const ids = [...criados];
  await db.delete(pedidos).where(inArray(pedidos.usuarioId, ids));
  await db.delete(user).where(inArray(user.id, ids));
  criados.clear();
  sessoes.clear();
}
