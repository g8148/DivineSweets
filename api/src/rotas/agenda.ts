import { disponibilidadeSchema, motivoIndisponivel } from '@divine/shared';
import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { z } from 'zod';
import { ErroApi } from '../erros.ts';
import { carregarAgenda, contarOcupacao, diasDoMes } from '../servicos/agenda.ts';

const consultaSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/, 'Use o formato AAAA-MM'),
});

export const rotasAgenda = new Hono().get(
  '/disponibilidade',
  describeRoute({
    description: 'Disponibilidade de cada dia do mês para entrega.',
    responses: {
      200: {
        description: 'Dias do mês',
        content: { 'application/json': { schema: resolver(disponibilidadeSchema) } },
      },
      400: { description: 'Mês em formato inválido' },
    },
  }),
  // Sem o hook, o validador responde com o objeto de erro cru do Zod, num
  // formato diferente do resto da API. Aqui ele vira ErroApi e sai pelo mesmo
  // onError, para o app ter uma só forma de erro para tratar.
  validator('query', consultaSchema, (resultado) => {
    if (!resultado.success) {
      const [primeiro] = resultado.error;
      throw new ErroApi(400, primeiro?.message ?? 'Consulta inválida', 'consulta_invalida');
    }
  }),
  async (c) => {
    const { mes } = c.req.valid('query');
    const dias = diasDoMes(mes);
    // A regra de disponibilidade é a mesma do app, importada de @divine/shared:
    // duas implementações divergiriam e o calendário passaria a oferecer datas
    // que a criação do pedido recusa.
    const agenda = await carregarAgenda();
    const ocupacao = await contarOcupacao(dias);
    const agora = new Date();

    return c.json({
      mes,
      dias: dias.map((data) => {
        const motivo = motivoIndisponivel(data, agenda, ocupacao, agora);
        return { data, disponivel: motivo === null, motivo };
      }),
    });
  },
);
