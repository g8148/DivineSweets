import { criarPedidoSchema, pedidoSchema } from '@divine/shared';
import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { z } from 'zod';
import { ErroApi, erroDeValidacao } from '../erros.ts';
import { exigirSessao, type Variables } from '../middleware/sessao.ts';
import { criarPedido } from '../servicos/criarPedido.ts';
import { buscarPedido, listarPedidosDoUsuario } from '../servicos/lerPedidos.ts';

export const rotasPedidos = new Hono<{ Variables: Variables }>()
  .use('*', exigirSessao)
  .post(
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
    // Sem hook, o 400 sai com o objeto cru do validador, num formato diferente
    // do resto da API.
    validator('json', criarPedidoSchema, (resultado) => {
      if (!resultado.success) throw erroDeValidacao(resultado.error, 'pedido_invalido');
    }),
    async (c) => {
      const pedido = await criarPedido(c.get('usuario'), c.req.valid('json'));
      return c.json(pedido, 201);
    },
  )
  .get(
    '/',
    describeRoute({
      description: 'Lista os pedidos do usuário autenticado, do mais recente ao mais antigo.',
      responses: {
        200: {
          description: 'Pedidos',
          content: { 'application/json': { schema: resolver(z.array(pedidoSchema)) } },
        },
        401: { description: 'Sem sessão' },
      },
    }),
    async (c) => c.json(await listarPedidosDoUsuario(c.get('usuario').id)),
  )
  .get(
    '/:id',
    describeRoute({
      description: 'Detalha um pedido do usuário autenticado.',
      responses: {
        200: {
          description: 'Pedido',
          content: { 'application/json': { schema: resolver(pedidoSchema) } },
        },
        401: { description: 'Sem sessão' },
        404: { description: 'Pedido não encontrado' },
      },
    }),
    async (c) => {
      // A busca já filtra pelo dono. O pedido de outra pessoa dá 404, e não 403:
      // responder "existe, mas não é seu" confirmaria que o id é válido.
      const pedido = await buscarPedido(c.req.param('id'), c.get('usuario').id);
      if (!pedido) throw new ErroApi(404, 'Pedido não encontrado', 'nao_encontrado');
      return c.json(pedido);
    },
  );
