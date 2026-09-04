import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config.ts';
import * as schema from './schema.ts';

export const pool = new Pool({ connectionString: config.databaseUrl });
export const db = drizzle(pool, { schema });

/**
 * `db` ou a transação aberta por `db.transaction`. As consultas que precisam
 * enxergar as escritas ainda não confirmadas — a criação de pedido revalidando
 * a agenda, por exemplo — recebem a transação por parâmetro; as demais usam o
 * `db` direto.
 */
export type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
