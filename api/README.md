# API Divine Sweets

API de encomendas: catálogo, agenda de entrega, pedidos e painel administrativo.
Hono sobre Node, Postgres com Drizzle, autenticação com Better Auth.

## Rodar em desenvolvimento

```bash
cp .env.example .env   # e preencha os segredos
docker compose up -d   # Postgres em 127.0.0.1:7520
npm run db:migrate
npm run dev            # API em 127.0.0.1:8100
```

## Promover um administrador

Não existe rota para virar admin. O campo `role` é declarado com `input: false`
no Better Auth, então o cadastro não aceita `role` no corpo da requisição — um
cliente não consegue se promover. A promoção é manual, por design:

```bash
docker exec -i divine-db psql -U divine divine \
  -c "UPDATE \"user\" SET role = 'admin' WHERE email = 'ENDERECO@EXEMPLO.COM';"
```

O mesmo comando vale na VPS.

## Schema do Better Auth

`src/db/auth-schema.ts` é escrito à mão, não gerado pelo `@better-auth/cli`: o
CLI parou na versão 1.4 e está deprecado no npm, enquanto o `better-auth` aqui é
1.7 — o schema gerado sairia sem colunas novas, como `account.issuer`.

Ao atualizar o `better-auth`, confira o schema esperado contra o que a própria
biblioteca declara:

```bash
node --env-file=.env -e "
  Promise.all([import('better-auth/db'), import('./src/auth.ts')]).then(([db, a]) =>
    console.dir(db.getAuthTables(a.auth.options), { depth: 4 }))
"
```

Depois de mexer no schema: `npm run db:generate && npm run db:migrate`.

## Limite de tentativas

O rate limit do Better Auth guarda o contador em memória. Isso basta para um
processo só, que é o caso aqui; se um dia a API rodar em várias instâncias, cada
uma contaria em separado e o limite efetivo se multiplicaria.

## Imagens

`UPLOADS_DIR` aceita caminho absoluto ou relativo. O relativo é resolvido a
partir da raiz deste pacote (`api/`), e **não** do diretório de trabalho: rodar
`npm run db:seed` da raiz do monorepo e o servidor de `api/` criaria duas pastas
diferentes, e as fotos do catálogo não apareceriam no app.

Ali convivem duas coisas com origens distintas:

- `uploads/produtos/` — catálogo, restaurado pelo seed a partir de
  `seed-assets/produtos/`, que é versionado.
- `uploads/*.webp` — fotos de referência enviadas pelos clientes, uma por
  pedido. Só existem na máquina que recebeu o upload; entram no backup junto
  com o diretório.

Tudo que entra por `POST /api/upload` é reconvertido pelo sharp para WebP com no
máximo 1200px e nome sorteado. A reconversão é o que garante que o arquivo é
imagem de verdade: extensão e `Content-Type` vêm do cliente e mentem.
