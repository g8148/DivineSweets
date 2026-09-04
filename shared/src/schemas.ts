import { z } from 'zod';

/** Data de entrega trafega como YYYY-MM-DD. Timestamp escorrega de fuso. */
export const dataISOSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const horaSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Use o formato HH:MM');

export const tipoEntregaSchema = z.enum(['entrega', 'retirada']);

export const statusPedidoSchema = z.enum([
  'recebido',
  'producao',
  'pronto',
  'entregue',
  'recusado',
]);

export const categoriaSchema = z.enum(['cookies', 'bolos', 'brownies', 'sazonais']);

/**
 * Corpo do POST /api/pedidos. Nenhum campo monetário: o servidor recalcula o
 * preço a partir do produto e das seleções. `.strict()` faz o Zod rejeitar
 * qualquer `total` ou `subtotal` que o cliente tente enviar.
 */
export const criarPedidoSchema = z
  .object({
    produtoId: z.string().min(1),
    quantidade: z.number().int().positive().max(100),
    selecoes: z.record(z.string(), z.string()),
    mensagem: z.string().max(280).optional(),
    fotoUrl: z.url().optional(),
    tipoEntrega: tipoEntregaSchema,
    dataEntrega: dataISOSchema,
    horaEntrega: horaSchema,
    endereco: z.string().max(255).optional(),
  })
  .strict();

export type CriarPedido = z.infer<typeof criarPedidoSchema>;

export const opcaoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  delta: z.number().int(),
});

export const grupoOpcaoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  obrigatorio: z.boolean(),
  opcoes: z.array(opcaoSchema),
});

export const produtoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  categoria: categoriaSchema,
  descricao: z.string(),
  precoBase: z.number().int(),
  imagemUrl: z.string().nullable(),
  permiteMensagem: z.boolean(),
  permiteFoto: z.boolean(),
  // Sempre `true` no catálogo público — a listagem já filtra. Está aqui porque
  // a administração usa este mesmo tipo e precisa distinguir o produto que ela
  // desativou daquele que continua à venda.
  ativo: z.boolean(),
  ordem: z.number().int(),
  grupos: z.array(grupoOpcaoSchema),
});

export const selecaoSchema = z.object({
  grupoTitulo: z.string(),
  opcaoNome: z.string(),
  delta: z.number().int(),
});

export const pedidoSchema = z.object({
  id: z.string(),
  produtoId: z.string(),
  produtoNome: z.string(),
  quantidade: z.number().int(),
  selecoes: z.array(selecaoSchema),
  mensagem: z.string().nullable(),
  fotoUrl: z.string().nullable(),
  tipoEntrega: tipoEntregaSchema,
  dataEntrega: dataISOSchema,
  horaEntrega: z.string(),
  endereco: z.string().nullable(),
  subtotal: z.number().int(),
  taxaEntrega: z.number().int(),
  total: z.number().int(),
  status: statusPedidoSchema,
  motivoRecusa: z.string().nullable(),
  criadoEm: z.string(),
  clienteNome: z.string(),
  clienteTelefone: z.string(),
});

export const diaDisponibilidadeSchema = z.object({
  data: dataISOSchema,
  disponivel: z.boolean(),
  motivo: z.enum(['passado', 'antecedencia', 'bloqueada', 'lotada']).nullable(),
});

export const disponibilidadeSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/),
  dias: z.array(diaDisponibilidadeSchema),
});

export const atualizarStatusSchema = z
  .object({
    status: statusPedidoSchema,
    motivoRecusa: z.string().max(280).optional(),
  })
  .strict();

export const produtoAdminSchema = z
  .object({
    nome: z.string().min(1).max(120),
    categoria: categoriaSchema,
    descricao: z.string().max(500),
    precoBase: z.number().int().nonnegative(),
    imagemUrl: z.string().optional(),
    gruposIds: z.array(z.string()),
    permiteMensagem: z.boolean(),
    permiteFoto: z.boolean(),
    ativo: z.boolean().default(true),
    ordem: z.number().int().default(100),
  })
  .strict();

export const bloqueioSchema = z
  .object({
    data: dataISOSchema,
    motivo: z.string().max(120).optional(),
  })
  .strict();

export const agendaConfigSchema = z
  .object({ limitePorDia: z.number().int().positive().max(100) })
  .strict();
