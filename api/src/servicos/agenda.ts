import { and, inArray, ne, sql } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { agendaBloqueios, agendaConfig, pedidos } from '../db/schema.ts';

/** Todas as datas de um mês `YYYY-MM`, como strings YYYY-MM-DD. */
export function diasDoMes(mes: string): string[] {
  const [ano, m] = mes.split('-').map(Number);
  // Dia 0 do mês seguinte é o último dia deste — resolve fevereiro e bissexto
  // sem tabela de tamanhos.
  const total = new Date(ano, m, 0).getDate();
  return Array.from({ length: total }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`);
}

export async function carregarAgenda() {
  const bloqueios = await db.select({ data: agendaBloqueios.data }).from(agendaBloqueios);
  const [cfg] = await db.select().from(agendaConfig);
  return {
    datasBloqueadas: bloqueios.map((b) => b.data),
    limitePorDia: cfg?.limitePorDia ?? 5,
  };
}

/**
 * Conta pedidos por data. Pedidos recusados não ocupam vaga — se contassem,
 * uma recusa deixaria o dia bloqueado para sempre.
 */
export async function contarOcupacao(datas: string[]): Promise<Record<string, number>> {
  if (datas.length === 0) return {};

  const linhas = await db
    .select({ data: pedidos.dataEntrega, total: sql<number>`count(*)::int` })
    .from(pedidos)
    .where(and(inArray(pedidos.dataEntrega, datas), ne(pedidos.status, 'recusado')))
    .groupBy(pedidos.dataEntrega);

  return Object.fromEntries(linhas.map((l) => [l.data, l.total]));
}
