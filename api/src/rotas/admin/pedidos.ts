import { atualizarStatusSchema, pedidoSchema, statusPedidoSchema } from '@divine/shared';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { pedidos } from '../../db/schema.ts';
import { ErroApi, erroDeValidacao } from '../../erros.ts';
import { exigirAdmin, exigirSessao, type Variables } from '../../middleware/sessao.ts';
import { buscarPedido, listarTodosPedidos } from '../../servicos/lerPedidos.ts';

const consultaSchema = z.object({ status: statusPedidoSchema.optional() });

export const rotasAdminPedidos = new Hono<{ Variables: Variables }>()
  // Nesta ordem: quem não tem sessão recebe 401, e não 403. São problemas
  // diferentes — um pede login, o outro é resposta definitiva.
  .use('*', exigirSessao, exigirAdmin)
  .get(
    '/',
    describeRoute({
      description: 'Lista todos os pedidos, opcionalmente filtrados por status.',
      responses: {
        200: {
          description: 'Pedidos',
          content: { 'application/json': { schema: resolver(z.array(pedidoSchema)) } },
        },
        401: { description: 'Sem sessão' },
        403: { description: 'Sem permissão' },
      },
    }),
    validator('query', consultaSchema, (resultado) => {
      if (!resultado.success) throw erroDeValidacao(resultado.error, 'consulta_invalida');
    }),
    async (c) => c.json(await listarTodosPedidos(c.req.valid('query').status)),
  )
  .get(
    '/:id',
    describeRoute({
      description:
        'Detalha qualquer pedido. A rota do cliente filtra pelo dono e responderia 404 para a administração — que precisa justamente ver o pedido dos outros.',
      responses: {
        200: {
          description: 'Pedido',
          content: { 'application/json': { schema: resolver(pedidoSchema) } },
        },
        404: { description: 'Pedido não encontrado' },
      },
    }),
    async (c) => {
      const pedido = await buscarPedido(c.req.param('id'));
      if (!pedido) throw new ErroApi(404, 'Pedido não encontrado', 'nao_encontrado');
      return c.json(pedido);
    },
  )
  .patch(
    '/:id',
    describeRoute({
      description: 'Atualiza o status de um pedido.',
      responses: {
        200: {
          description: 'Pedido atualizado',
          content: { 'application/json': { schema: resolver(pedidoSchema) } },
        },
        400: { description: 'Corpo inválido ou recusa sem motivo' },
        401: { description: 'Sem sessão' },
        403: { description: 'Sem permissão' },
        404: { description: 'Pedido não encontrado' },
      },
    }),
    validator('json', atualizarStatusSchema, (resultado) => {
      if (!resultado.success) throw erroDeValidacao(resultado.error, 'status_invalido');
    }),
    async (c) => {
      const { status, motivoRecusa } = c.req.valid('json');

      // O motivo só existe em 'recusado'. Sair desse status o apaga: senão um
      // pedido reaberto continuaria exibindo a justificativa da recusa anterior.
      const motivo = status === 'recusado' ? (motivoRecusa?.trim() ?? '') : '';

      // Recusar sem explicar deixa o cliente sem saber o que fazer: é este texto
      // que a tela de acompanhamento exibe.
      if (status === 'recusado' && !motivo) {
        throw new ErroApi(400, 'Informe o motivo da recusa', 'motivo_obrigatorio');
      }

      const id = c.req.param('id');
      const [atualizado] = await db
        .update(pedidos)
        .set({ status, motivoRecusa: motivo || null })
        .where(eq(pedidos.id, id))
        .returning({ id: pedidos.id });

      if (!atualizado) throw new ErroApi(404, 'Pedido não encontrado', 'nao_encontrado');

      return c.json(await buscarPedido(id));
    },
  );
