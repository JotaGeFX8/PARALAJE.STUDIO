#!/usr/bin/env bash
# Pruebas de seguridad contra Supabase local (npm run db:start).
# Se ejecutan en una transacción que se deshace: no dejan datos.
# Uso: bash supabase/tests/run.sh   (DB_URL permite otra base local)
set -euo pipefail
cd "$(dirname "$0")"
DB_URL=${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}
OUT=$(psql "$DB_URL" -v ON_ERROR_STOP=1 -f security_test.sql 2>&1) || { echo "$OUT" | grep -E "OK|FALLO|ERROR|error" ; echo "✗ Las pruebas de seguridad han fallado"; exit 1; }
echo "$OUT" | grep -E "OK " | sed 's/^.*NOTICE:  /  /'
echo "✓ $(echo "$OUT" | grep -c "OK ") comprobaciones de seguridad superadas (datos de prueba deshechos)"
