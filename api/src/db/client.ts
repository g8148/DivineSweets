import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config.ts';
import * as schema from './schema.ts';

export const pool = new Pool({ connectionString: config.databaseUrl });
export const db = drizzle(pool, { schema });
