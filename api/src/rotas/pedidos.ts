import { criarPedidoSchema, pedidoSchema } from '@divine/shared';
import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { erroDeValidacao } from '../erros.ts';
import { exigirSessao, type Variables } from '../middleware/sessao.ts';
import { criarPedido } from '../servicos/criarPedido.ts';

export const rotasPedidos = new Hono<{ Variables: Variables }>().use('*', exigirSessao).post(
  '/',
  describeRoute({
    description:
      'Cria um pedido. O servidor recalcula o preço e revalida a data; valores enviados pelo cliente são recusados.',
    responses: {
      201: {
        description: 'Pedido criado',
        content: { 'application/json': { schema: resolver(pedidoSchema) } },
      },
      400: { description: 'Corpo ou seleção inválida' },
      401: { description: 'Sem sessão' },
      404: { description: 'Produto não encontrado' },
      409: { description: 'Data de entrega indisponível' },
    },
  }),
  validator('json', criarPedidoSchema, (resultado) => {
    if (!resultado.success) throw erroDeValidacao(resultado.error, 'pedido_invalido');
  }),
  async (c) => {
    const pedido = await criarPedido(c.get('usuario'), c.req.valid('json'));
    return c.json(pedido, 201);
  },
);
