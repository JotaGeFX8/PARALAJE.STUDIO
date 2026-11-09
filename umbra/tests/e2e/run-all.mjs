/**
 * Ejecuta todas las pruebas de extremo a extremo en orden y resume el resultado.
 * Requisitos: Supabase local en marcha y la app en APP_URL (por defecto http://localhost:3000).
 * Uso: node tests/e2e/run-all.mjs
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SUITES = [
  ["flujo-completo.mjs", "Cuenta: registro, perfil, sesión, recuperación y baja"],
  ["comunidad.mjs", "Comunidad: publicaciones, comentarios, reacciones y búsqueda"],
  ["conexiones.mjs", "Conexiones, mensajería y notificaciones"],
  ["grupos.mjs", "Círculos, proyectos y Ágora"],
  ["admin.mjs", "Administración y moderación"],
];

const results = [];
for (const [file, label] of SUITES) {
  console.log(`\n━━ ${label}`);
  const started = Date.now();
  const r = spawnSync(process.execPath, [join(here, file)], { stdio: "inherit", env: process.env });
  results.push({ label, ok: r.status === 0, secs: Math.round((Date.now() - started) / 1000) });
  if (r.status !== 0 && process.env.STOP_ON_FAIL === "1") break;
}

console.log("\nResumen");
for (const r of results) console.log(`  ${r.ok ? "✓" : "✗"} ${r.label} (${r.secs} s)`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n✗ ${failed} suite(s) con fallos` : `\n✓ Todas las suites superadas (${results.length})`);
process.exit(failed ? 1 : 0);
