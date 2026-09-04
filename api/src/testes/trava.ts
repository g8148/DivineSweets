import { pool } from '../db/client.ts';

/**
 * Serializa um trecho de teste contra os outros arquivos de teste.
 *
 * O `node --test` roda cada arquivo em um processo próprio, em paralelo, e parte
 * dos dados é global: `agenda_config` é uma linha só para o sistema inteiro.
 * Sem esta trava, o teste que muda o limite diário e o que enche um dia até o
 * limite rodam ao mesmo tempo, e o segundo falha por causa do primeiro.
 *
 * A trava é de sessão, e não de transação — por isso reserva um cliente do pool
 * em vez de usar `db`, que devolve uma conexão diferente a cada consulta.
 */
export async function comTravaGlobal<T>(nome: string, fn: () => Promise<T>): Promise<T> {
  const cliente = await pool.connect();
  try {
    await cliente.query('select pg_advisory_lock(hashtext($1))', [nome]);
    try {
      return await fn();
    } finally {
      await cliente.query('select pg_advisory_unlock(hashtext($1))', [nome]);
    }
  } finally {
    cliente.release();
  }
}

/** Chave única da trava da agenda: o limite diário vale para o banco inteiro. */
export const TRAVA_AGENDA = 'divine-testes-agenda-config';
