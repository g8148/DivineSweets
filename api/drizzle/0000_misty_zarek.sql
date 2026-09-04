CREATE TYPE "public"."categoria" AS ENUM('cookies', 'bolos', 'brownies', 'sazonais');--> statement-breakpoint
CREATE TYPE "public"."status_pedido" AS ENUM('recebido', 'producao', 'pronto', 'entregue', 'recusado');--> statement-breakpoint
CREATE TYPE "public"."tipo_entrega" AS ENUM('entrega', 'retirada');--> statement-breakpoint
CREATE TABLE "agenda_bloqueios" (
	"data" date PRIMARY KEY NOT NULL,
	"motivo" text
);
--> statement-breakpoint
CREATE TABLE "agenda_config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"limite_por_dia" integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grupos_opcoes" (
	"id" text PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"obrigatorio" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opcoes" (
	"id" text PRIMARY KEY NOT NULL,
	"grupo_id" text NOT NULL,
	"nome" text NOT NULL,
	"delta" integer DEFAULT 0 NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedido_selecoes" (
	"id" text PRIMARY KEY NOT NULL,
	"pedido_id" text NOT NULL,
	"grupo_id" text NOT NULL,
	"opcao_id" text NOT NULL,
	"grupo_titulo" text NOT NULL,
	"opcao_nome" text NOT NULL,
	"delta" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" text NOT NULL,
	"produto_id" text NOT NULL,
	"produto_nome" text NOT NULL,
	"quantidade" integer NOT NULL,
	"mensagem" text,
	"foto_url" text,
	"tipo_entrega" "tipo_entrega" NOT NULL,
	"data_entrega" date NOT NULL,
	"hora_entrega" text NOT NULL,
	"endereco" text,
	"subtotal" integer NOT NULL,
	"taxa_entrega" integer NOT NULL,
	"total" integer NOT NULL,
	"status" "status_pedido" DEFAULT 'recebido' NOT NULL,
	"motivo_recusa" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"categoria" "categoria" NOT NULL,
	"descricao" text DEFAULT '' NOT NULL,
	"preco_base" integer NOT NULL,
	"imagem_url" text,
	"ordem" integer DEFAULT 100 NOT NULL,
	"permite_mensagem" boolean DEFAULT false NOT NULL,
	"permite_foto" boolean DEFAULT false NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produtos_grupos" (
	"produto_id" text NOT NULL,
	"grupo_id" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "produtos_grupos_produto_id_grupo_id_pk" PRIMARY KEY("produto_id","grupo_id")
);
--> statement-breakpoint
ALTER TABLE "opcoes" ADD CONSTRAINT "opcoes_grupo_id_grupos_opcoes_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos_opcoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_selecoes" ADD CONSTRAINT "pedido_selecoes_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos_grupos" ADD CONSTRAINT "produtos_grupos_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos_grupos" ADD CONSTRAINT "produtos_grupos_grupo_id_grupos_opcoes_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos_opcoes"("id") ON DELETE cascade ON UPDATE no action;