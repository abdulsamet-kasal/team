#!/usr/bin/env bash
# Team AI — Durdurucu

echo "Team AI sunucusu durduruluyor..."
pkill -f "node server/index.js" || true
echo "✓ Team AI başarıyla durduruldu."
