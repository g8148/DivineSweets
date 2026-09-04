import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema.ts';

export const categoriaEnum = pgEnum('categoria', [
  'cookies',
  'bolos',
  'brownies',
  'sazonais',
]);

export const statusEnum = pgEnum('status_pedido', [
  'recebido',
  'producao',
  'pronto',
  'entregue',
  'recusado',
]);

export const tipoEntregaEnum = pgEnum('tipo_entrega', ['entrega', 'retirada']);

export const produtos = pgTable('produtos', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  categoria: categoriaEnum('categoria').notNull(),
  descricao: text('descricao').notNull().default(''),
  // Centavos. Preço em ponto flutuante acumula erro no somatório dos deltas.
  precoBase: integer('preco_base').notNull(),
  imagemUrl: text('imagem_url'),
  ordem: integer('ordem').notNull().default(100),
  permiteMensagem: boolean('permite_mensagem').notNull().default(false),
  permiteFoto: boolean('permite_foto').notNull().default(false),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const gruposOpcoes = pgTable('grupos_opcoes', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  obrigatorio: boolean('obrigatorio').notNull().default(false),
});

export const opcoes = pgTable('opcoes', {
  id: text('id').primaryKey(),
  grupoId: text('grupo_id')
    .notNull()
    .references(() => gruposOpcoes.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  delta: integer('delta').notNull().default(0),
  ordem: integer('ordem').notNull().default(0),
});

export const produtosGrupos = pgTable(
  'produtos_grupos',
  {
    produtoId: text('produto_id')
      .notNull()
      .references(() => produtos.id, { onDelete: 'cascade' }),
    grupoId: text('grupo_id')
      .notNull()
      .references(() => gruposOpcoes.id, { onDelete: 'cascade' }),
    ordem: integer('ordem').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.produtoId, t.grupoId] })],
);

export const pedidos = pgTable('pedidos', {
  id: text('id').primaryKey(),
  // Sem `onDelete`: apagar um usuário que tem pedidos é bloqueado pelo banco.
  // O histórico de encomendas não pode virar registro órfão.
  usuarioId: text('usuario_id')
    .notNull()
    .references(() => user.id),
  produtoId: text('produto_id')
    .notNull()
    .references(() => produtos.id),
  produtoNome: text('produto_nome').notNull(),
  quantidade: integer('quantidade').notNull(),
  mensagem: text('mensagem'),
  fotoUrl: text('foto_url'),
  tipoEntrega: tipoEntregaEnum('tipo_entrega').notNull(),
  // `date` em modo string: entra e sai como YYYY-MM-DD, sem conversão de fuso.
  dataEntrega: date('data_entrega', { mode: 'string' }).notNull(),
  horaEntrega: text('hora_entrega').notNull(),
  endereco: text('endereco'),
  subtotal: integer('subtotal').notNull(),
  taxaEntrega: integer('taxa_entrega').notNull(),
  total: integer('total').notNull(),
  status: statusEnum('status').notNull().default('recebido'),
  motivoRecusa: text('motivo_recusa'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Snapshot das escolhas no momento do pedido. Título, nome e delta são
 * copiados de propósito: mudar o preço de uma opção no futuro não pode
 * reescrever o histórico de pedidos antigos.
 */
export const pedidoSelecoes = pgTable('pedido_selecoes', {
  id: text('id').primaryKey(),
  pedidoId: text('pedido_id')
    .notNull()
    .references(() => pedidos.id, { onDelete: 'cascade' }),
  grupoId: text('grupo_id').notNull(),
  opcaoId: text('opcao_id').notNull(),
  grupoTitulo: text('grupo_titulo').notNull(),
  opcaoNome: text('opcao_nome').notNull(),
  delta: integer('delta').notNull(),
});

export const agendaBloqueios = pgTable('agenda_bloqueios', {
  data: date('data', { mode: 'string' }).primaryKey(),
  motivo: text('motivo'),
});

export const agendaConfig = pgTable('agenda_config', {
  id: integer('id').primaryKey().default(1),
  limitePorDia: integer('limite_por_dia').notNull().default(5),
});

// As tabelas do Better Auth entram no mesmo schema para o drizzle-kit enxergá-las.
export * from './auth-schema.ts';
