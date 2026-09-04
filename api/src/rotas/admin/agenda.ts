import { agendaConfigSchema, bloqueioSchema, dataISOSchema } from '@divine/shared';
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { agendaBloqueios, agendaConfig, pedidos } from '../../db/schema.ts';
import { erroDeValidacao } from '../../erros.ts';
import { exigirAdmin, exigirSessao, type Variables } from '../../middleware/sessao.ts';

const bloqueioRespostaSchema = z.object({
  data: dataISOSchema,
  motivo: z.string().nullable(),
  // Quantas encomendas já estavam marcadas para o dia que acaba de ser
  // bloqueado. Bloquear não desmarca nada — quem administra precisa saber que
  // há gente esperando para poder avisar ou recusar.
  pedidosNaData: z.number().int(),
});

/** Pedidos ativos na data. Recusado não conta: já não há o que produzir. */
async function pedidosNaData(data: string) {
  const [linha] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(pedidos)
    .where(and(eq(pedidos.dataEntrega, data), ne(pedidos.status, 'recusado')));
  return linha?.total ?? 0;
}

export const rotasAdminAgenda = new Hono<{ Variables: Variables }>()
  .use('*', exigirSessao, exigirAdmin)
  .get(
    '/bloqueios',
    describeRoute({
      description: 'Lista as datas bloqueadas.',
      responses: {
        200: {
          description: 'Bloqueios',
          content: {
            'application/json': {
              schema: resolver(z.array(z.object({ data: dataISOSchema, motivo: z.string().nullable() }))),
            },
          },
        },
      },
    }),
    async (c) => c.json(await db.select().from(agendaBloqueios).orderBy(asc(agendaBloqueios.data))),
  )
  .post(
    '/bloqueios',
    describeRoute({
      description:
        'Bloqueia uma data para produção. Não desmarca os pedidos já aceitos para o dia: devolve quantos são, para que sejam tratados um a um.',
      responses: {
        201: {
          description: 'Data bloqueada',
          content: { 'application/json': { schema: resolver(bloqueioRespostaSchema) } },
        },
      },
    }),
    validator('json', bloqueioSchema, (resultado) => {
      if (!resultado.success) throw erroDeValidacao(resultado.error, 'bloqueio_invalido');
    }),
    async (c) => {
      const { data, motivo } = c.req.valid('json');
      // Rebloquear a mesma data troca o motivo em vez de estourar pela chave
      // primária: corrigir "Manutenção" para "Feriado" é edição, não erro.
      await db
        .insert(agendaBloqueios)
        .values({ data, motivo: motivo ?? null })
        .onConflictDoUpdate({ target: agendaBloqueios.data, set: { motivo: motivo ?? null } });

      return c.json({ data, motivo: motivo ?? null, pedidosNaData: await pedidosNaData(data) }, 201);
    },
  )
  .delete(
    '/bloqueios/:data',
    describeRoute({
      description: 'Libera uma data bloqueada.',
      responses: {
        200: { description: 'Data liberada' },
        400: { description: 'Data fora do formato AAAA-MM-DD' },
      },
    }),
    validator('param', z.object({ data: dataISOSchema }), (resultado) => {
      if (!resultado.success) throw erroDeValidacao(resultado.error, 'data_invalida');
    }),
    async (c) => {
      await db.delete(agendaBloqueios).where(eq(agendaBloqueios.data, c.req.valid('param').data));
      // Sem 404 para data que não estava bloqueada: o pedido é "esta data deve
      // ficar livre", e ela fica. Clicar duas vezes em desbloquear não é erro.
      return c.json({ ok: true });
    },
  )
  .get(
    '/config',
    describeRoute({
      description: 'Lê quantos pedidos cabem por dia.',
      responses: {
        200: {
          description: 'Configuração',
          content: { 'application/json': { schema: resolver(agendaConfigSchema) } },
        },
      },
    }),
    async (c) => {
      const [cfg] = await db.select().from(agendaConfig);
      // O mesmo padrão de `carregarAgenda`: banco recém-criado ainda não tem a
      // linha, e a tela precisa de um número para exibir no campo.
      return c.json({ limitePorDia: cfg?.limitePorDia ?? 5 });
    },
  )
  .patch(
    '/config',
    describeRoute({
      description: 'Define quantos pedidos cabem por dia.',
      responses: {
        200: {
          description: 'Configuração salva',
          content: { 'application/json': { schema: resolver(agendaConfigSchema) } },
        },
      },
    }),
    validator('json', agendaConfigSchema, (resultado) => {
      if (!resultado.success) throw erroDeValidacao(resultado.error, 'config_invalida');
    }),
    async (c) => {
      const { limitePorDia } = c.req.valid('json');
      const [cfg] = await db
        .insert(agendaConfig)
        .values({ id: 1, limitePorDia })
        .onConflictDoUpdate({ target: agendaConfig.id, set: { limitePorDia } })
        .returning({ limitePorDia: agendaConfig.limitePorDia });
      return c.json(cfg);
    },
  );
