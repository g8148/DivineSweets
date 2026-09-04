import { grupoOpcaoSchema } from '@divine/shared';
import { asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { describeRoute, resolver } from 'hono-openapi';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { gruposOpcoes, opcoes } from '../../db/schema.ts';
import { exigirAdmin, exigirSessao, type Variables } from '../../middleware/sessao.ts';

/**
 * Os grupos de personalização disponíveis, para o formulário de produto.
 *
 * Sem esta rota o formulário listaria os grupos do catálogo estático do pacote
 * compartilhado, e o cadastro falharia com `grupo_desconhecido` no dia em que
 * os dois divergissem — a conferência da Task 14 é feita contra o banco.
 */
export const rotasAdminGrupos = new Hono<{ Variables: Variables }>()
  .use('*', exigirSessao, exigirAdmin)
  .get(
    '/',
    describeRoute({
      description: 'Lista os grupos de opções com suas opções.',
      responses: {
        200: {
          description: 'Grupos de opções',
          content: { 'application/json': { schema: resolver(z.array(grupoOpcaoSchema)) } },
        },
      },
    }),
    async (c) => {
      const linhas = await db.select().from(gruposOpcoes).orderBy(asc(gruposOpcoes.titulo));

      const completos = await Promise.all(
        linhas.map(async (grupo) => ({
          id: grupo.id,
          titulo: grupo.titulo,
          obrigatorio: grupo.obrigatorio,
          opcoes: await db
            .select({ id: opcoes.id, nome: opcoes.nome, delta: opcoes.delta })
            .from(opcoes)
            .where(eq(opcoes.grupoId, grupo.id))
            .orderBy(asc(opcoes.ordem)),
        })),
      );

      return c.json(completos);
    },
  );
