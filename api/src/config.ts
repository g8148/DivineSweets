import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// `src/` em desenvolvimento, `dist/` depois do build — os dois um nível abaixo
// da raiz do pacote `api`.
const RAIZ_DA_API = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Validar as variáveis no boot evita descobrir na primeira requisição que
// faltou um segredo.
const envSchema = z.object({
  PORT: z.coerce.number().default(8100),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32, 'Use ao menos 32 caracteres'),
  BETTER_AUTH_URL: z.url(),
  UPLOADS_DIR: z.string().default('./uploads'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuração inválida:', z.treeifyError(parsed.error));
  process.exit(1);
}

/**
 * Um `UPLOADS_DIR` relativo é resolvido a partir da raiz do pacote `api`, e não
 * do diretório de trabalho. Enquanto dependia do cwd, `npm run db:seed` na raiz
 * do monorepo gravava as imagens em `DivineSweets/uploads` e o servidor
 * procurava por elas em `DivineSweets/api/uploads` — duas pastas, e as fotos do
 * catálogo simplesmente não apareciam.
 */
function resolverUploads(valor: string) {
  return path.isAbsolute(valor) ? valor : path.resolve(RAIZ_DA_API, valor);
}

export const config = {
  porta: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  authSecret: parsed.data.BETTER_AUTH_SECRET,
  baseUrl: parsed.data.BETTER_AUTH_URL,
  uploadsDir: resolverUploads(parsed.data.UPLOADS_DIR),
  ambiente: parsed.data.NODE_ENV,
};
