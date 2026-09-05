#!/bin/bash
#
# Envia o APK gerado na máquina de desenvolvimento para a VPS, de onde a API
# passa a servi-lo em https://api-divinesweets.gabrie.dev/app
#
# Uso: bash infra/publicar-apk.sh [caminho-do-apk]
#
set -euo pipefail

APK="${1:-app/android/app/build/outputs/apk/release/app-release.apk}"
DESTINO="hay:/opt/DivineSweets/api/publico/divine-sweets.apk"

if [ ! -f "$APK" ]; then
    echo "APK não encontrado em $APK"
    echo "Gere-o com:"
    echo "  cd app/android && EXPO_PUBLIC_API_URL=https://api-divinesweets.gabrie.dev \\"
    echo "    JAVA_HOME=/usr/lib/jvm/java-17-openjdk ./gradlew assembleRelease"
    exit 1
fi

# Envia com nome temporário e só então renomeia: assim ninguém baixa um
# arquivo pela metade enquanto o upload acontece.
ssh hay 'mkdir -p /opt/DivineSweets/api/publico'
scp "$APK" "${DESTINO}.parcial"
ssh hay 'mv /opt/DivineSweets/api/publico/divine-sweets.apk.parcial /opt/DivineSweets/api/publico/divine-sweets.apk'

echo "Publicado. Confira em https://api-divinesweets.gabrie.dev/app"
