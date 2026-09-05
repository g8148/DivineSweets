#!/bin/bash
#
# Deploy da Divine Sweets na VPS. Chamado pelo workflow, que já fez
# `git fetch` + `git reset --hard origin/main` antes de invocar este script.
#
# Uso manual: bash /opt/DivineSweets/infra/deploy.sh
#
set -euo pipefail

REPO_DIR="/opt/DivineSweets"
API_DIR="$REPO_DIR/api"
BACKUP_DIR="/var/backups/divinesweets"

# O Node do sistema é a versão 22, de outros projetos desta máquina. O nosso
# fica à parte, e entra no PATH só aqui dentro.
export PATH="/opt/node24/bin:$PATH"

log() { echo "[deploy] $(date '+%Y-%m-%d %H:%M:%S') - $*"; }

log "Deploy de $(git -C "$REPO_DIR" rev-parse --short HEAD)"

log "Instalando dependências..."
cd "$REPO_DIR" && npm install

# Backup antes de migrar. Não é rollback automático: é o botão de desfazer
# caso uma migration aplique e o deploy falhe depois dela. Restaurar com:
#   gunzip -c ARQUIVO.sql.gz | docker exec -i divine-db psql -U divine divine
log "Backup do banco..."
if [ ! -w "$BACKUP_DIR" ]; then
    echo "[deploy] ERRO: $BACKUP_DIR não existe ou não é gravável"
    exit 1
fi
# umask 077 garante 0600: o dump tem e-mails e hashes de senha, e a máquina
# é compartilhada com outros projetos.
(
    umask 077
    docker exec divine-db pg_dump -U divine divine | gzip > "$BACKUP_DIR/$(date '+%Y-%m-%d-%H%M%S').sql.gz"
)
ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm --

log "Aplicando migrations..."
cd "$API_DIR" && npx drizzle-kit migrate

log "Semeando catálogo (idempotente)..."
cd "$API_DIR" && npm run db:seed

# O build roda ANTES do restart: se ele falhar, o `set -e` aborta aqui e o
# serviço segue no ar com a versão anterior.
log "Build da API..."
cd "$API_DIR" && npm run build

log "Reiniciando serviço..."
sudo systemctl restart divinesweets-api

log "Deploy concluído."
