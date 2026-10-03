#!/usr/bin/env bash
# Team AI — Otonom Çoklu Ajan Yazılım Ekibi Başlatıcı

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "==================================================="
echo "🚀 Team AI — Otonom Yazılım Ekibi Başlatılıyor..."
echo "==================================================="

# 9Router Kontrolü
if curl -s -m 2 http://localhost:20128/v1/models > /dev/null 2>&1; then
    echo "✓ 9Router bağlantısı başarılı (http://localhost:20128/v1)"
else
    echo "⚠ Uyarı: 9Router (http://localhost:20128/v1) adresine ulaşılamadı. Lütfen 9Router'ın açık olduğundan emin olun."
fi

# Eğer sunucu zaten çalışıyorsa durdur
pkill -f "node server/index.js" > /dev/null 2>&1 || true

# Tarayıcıda aç
if command -v xdg-open > /dev/null 2>&1; then
    (sleep 1.5 && xdg-open http://localhost:3000) &
fi

exec node server/index.js
