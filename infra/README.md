# Infraestrutura

A API roda na VPS `hay` (`136.248.98.221`, Ubuntu, **arm64**), que é
compartilhada com outros projetos. Tudo aqui foi escrito para conviver com
eles: nada de porta padrão, nada de substituir configuração alheia.

| O quê | Onde |
| --- | --- |
| Endereço público | `https://api-divinesweets.gabrie.dev` |
| Página de download do app | `https://api-divinesweets.gabrie.dev/app` |
| Documentação das rotas | `https://api-divinesweets.gabrie.dev/docs` |
| Código na VPS | `/opt/DivineSweets` |
| Serviço | `divinesweets-api` (systemd) |
| API escutando em | `127.0.0.1:8100` |
| Postgres | `127.0.0.1:7520`, container `divine-db` |
| Backups | `/var/backups/divinesweets` (0600, os 5 mais recentes) |
| Node do projeto | `/opt/node24/bin/node` (v24) |

## Por que um Node só nosso

O `node` do sistema é a versão 22, usada por outros projetos da máquina.
Este projeto exige a 24 — o `seed` roda TypeScript direto, sem build. Em vez
de trocar o Node de todo mundo, a versão 24 fica em `/opt/node24` e entra no
PATH apenas dentro do `deploy.sh` e do `ExecStart` do systemd.

Se um dia o Node do sistema chegar à 24, `/opt/node24` pode sumir e as duas
referências passam a apontar para `/usr/bin/node`.

## Preparar a máquina do zero

```bash
ssh hay

# Node 24 à parte do Node do sistema (arm64!)
V=v24.20.0
cd /tmp && curl -sSLO "https://nodejs.org/dist/$V/node-$V-linux-arm64.tar.xz"
sudo mkdir -p /opt/node24
sudo tar -xJf "node-$V-linux-arm64.tar.xz" -C /opt/node24 --strip-components=1

sudo install -d -m 755 -o ubuntu -g ubuntu /opt/DivineSweets
sudo install -d -m 700 -o ubuntu -g ubuntu /var/backups/divinesweets
git clone git@github.com:g8148/DivineSweets.git /opt/DivineSweets
```

O `.env` da API é escrito à mão, uma vez, e nunca entra no Git:

```bash
cd /opt/DivineSweets/api
umask 077                       # 0600: o arquivo tem o segredo de sessão
cp .env.example .env
# preencha DATABASE_URL, DB_PASSWORD (a mesma senha nos dois) e
# BETTER_AUTH_SECRET, gerado com: openssl rand -base64 48
docker compose up -d
```

Só os pacotes do servidor são instalados — o `app/` não roda aqui e suas
dependências passam de 1 GB:

```bash
export PATH=/opt/node24/bin:$PATH
cd /opt/DivineSweets
npm install --workspace=@divine/api --workspace=@divine/shared --include-workspace-root
cd api && npx drizzle-kit migrate && npm run db:seed && npm run build
```

## Serviço

```bash
sudo cp /opt/DivineSweets/infra/systemd/divinesweets-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now divinesweets-api
curl -sf http://127.0.0.1:8100/health
```

Logs em `/var/log/divinesweets-api.log` e `-error.log`.

## Túnel

O túnel do Cloudflare desta VPS é **compartilhado**. O arquivo
`/etc/cloudflared/config.yml` não é substituído: acrescenta-se o bloco de
`cloudflared/config.example.yml` aos ingress existentes, sempre antes da
regra final `http_status:404` — o cloudflared usa a primeira regra que casa.

```bash
cloudflared tunnel route dns 9715e027-0351-471b-972f-5ead2201ff9e api-divinesweets.gabrie.dev
sudo systemctl restart cloudflared
curl -sf https://api-divinesweets.gabrie.dev/health
```

## Promover a confeiteira a administradora

O papel tem `input: false` no Better Auth: ninguém se cadastra como admin.
A promoção é manual, depois de a conta existir.

```bash
docker exec -i divine-db psql -U divine divine \
  -c "UPDATE \"user\" SET role = 'admin' WHERE email = 'SEU-EMAIL';"
```

## Deploy de uma nova versão

Automático a cada push na `main`, pelo `.github/workflows/deploy.yml`, que
apenas chama `infra/deploy.sh` na VPS. Manualmente:

```bash
ssh hay
cd /opt/DivineSweets && git pull && bash infra/deploy.sh
```

O script faz backup do banco **antes** de migrar e compila **antes** de
reiniciar: se o build falhar, o serviço continua no ar com a versão anterior.

## Publicar uma nova versão do aplicativo

O APK é gerado na máquina de desenvolvimento e enviado para a VPS, de onde a
própria API o serve em `/app`. Ele nunca entra no Git (`*.apk` no
`.gitignore`) — são dezenas de megabytes que mudam a cada entrega.

```bash
cd app/android
EXPO_PUBLIC_API_URL=https://api-divinesweets.gabrie.dev \
  JAVA_HOME=/usr/lib/jvm/java-17-openjdk ./gradlew assembleRelease
cd ../.. && bash infra/publicar-apk.sh
```

O endereço embutido no APK é decidido no momento do build: sem a variável
acima, o app sai apontando para o `.env` local e não fala com o servidor.

E o `EXPO_PUBLIC_API_URL` não é entrada da tarefa do Gradle, então trocá-lo não
invalida o pacote JavaScript já compilado: um build seguinte reaproveita o
bundle anterior, com o endereço anterior dentro. Ao alternar de endereço, apague
o bundle antes e confira o que ficou no APK:

```bash
rm -rf app/build/generated/assets/react app/build/intermediates/assets/release
# depois do build:
grep -ao 'https://api-divinesweets.gabrie.dev' \
  app/build/generated/assets/react/release/index.android.bundle
```
