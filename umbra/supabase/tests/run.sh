#!/usr/bin/env bash
# Ejecuta las migraciones y las pruebas de políticas contra un Postgres local.
# Uso: PGURL=postgres://... ./run.sh   (por defecto, base local "umbra_test")
set -euo pipefail
cd "$(dirname "$0")"
DB=${PGURL:-umbra_test}
dropdb --if-exists "$DB" 2>/dev/null || true
createdb "$DB"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f stubs.sql
for f in ../migrations/*.sql; do psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f"; done
OUT=$(psql -v ON_ERROR_STOP=1 -d "$DB" -f policies_test.sql 2>&1)
echo "$OUT" | grep -E "NOTICE|^ [tf]$" || true
if echo "$OUT" | grep -qE "^ f$|FALLO"; then echo "✗ Alguna prueba ha fallado"; exit 1; fi
echo "✓ Todas las pruebas de seguridad pasan ($(echo "$OUT" | grep -cE "OK |^ t$") comprobaciones)"
