# Divine Sweets

Aplicativo mobile de encomendas para uma confeitaria: o cliente monta o doce,
escolhe a data de entrega e acompanha o pedido; a confeiteira administra o
catálogo, a agenda e a fila de produção pelo mesmo aplicativo.

Trabalho da **Atividade Avaliativa 2** de Desenvolvimento Mobile (Unoesc),
continuação do projeto desenhado na Atividade Avaliativa 1.

| | |
| --- | --- |
| **Baixar o APK** | https://api-divinesweets.gabrie.dev/app |
| **API em produção** | https://api-divinesweets.gabrie.dev |
| **Documentação das rotas** | https://api-divinesweets.gabrie.dev/docs |
| **Relatório técnico** | [`docs/relatorio-tecnico.md`](docs/relatorio-tecnico.md) |

## O que o aplicativo faz

**Cliente** — cadastro e login, catálogo por categoria, personalização do doce
(recheio, cobertura, tamanho) com o preço recalculado a cada escolha, calendário
que só oferece as datas realmente disponíveis, envio de foto de referência,
resumo com o total e acompanhamento do pedido por etapas.

**Administração** — fila de pedidos com filtro por status e avanço de etapa,
recusa com justificativa, CRUD do catálogo com upload de imagem, montagem dos
grupos de personalização e agenda com bloqueio de datas e limite de pedidos
por dia.

## Como está organizado

Monorepo com três pacotes em workspaces do npm:

```
app/      aplicativo Expo / React Native (Android)
api/      API HTTP em Hono + PostgreSQL
shared/   regras de negócio e tipos usados pelos dois
infra/    deploy na VPS: systemd, Cloudflare Tunnel, publicação do APK
docs/     relatório técnico, apresentação e mockups da Atividade 1
```

`shared/` existe para que preço e disponibilidade tenham **uma** implementação:
o aplicativo a usa para mostrar o total na tela e a API para calcular o valor
que será cobrado. As duas respostas não podem divergir.

## Rodando o projeto

Requer Node 24 ou superior e Docker.

```bash
npm install

# banco de dados
cd api
cp .env.example .env          # preencha DATABASE_URL, DB_PASSWORD e BETTER_AUTH_SECRET
docker compose up -d
npm run migrate
npm run seed

# API em http://localhost:8100
npm run dev
```

Em outro terminal:

```bash
cd app
cp .env.example .env          # EXPO_PUBLIC_API_URL=http://localhost:8100
npx expo start
```

Para o aplicativo enxergar a API na porta local a partir do emulador Android:

```bash
adb reverse tcp:8100 tcp:8100
```

## Verificação

```bash
npm run typecheck    # TypeScript nos três pacotes
npm test             # 135 testes automatizados
```

## Documentação

- [Relatório técnico](docs/relatorio-tecnico.md) — arquitetura, decisões e soluções
- [`api/README.md`](api/README.md) — banco de dados e rotas
- [`infra/README.md`](infra/README.md) — servidor, deploy e publicação do APK
