/**
 * Prueba de extremo a extremo del flujo de las fases 1–2 contra Supabase LOCAL.
 *
 * Requisitos: `npx supabase start`, la app en http://localhost:3000 con .env.local
 * apuntando a Supabase local, y Playwright disponible (`npm i -g playwright`).
 * Uso: node tests/e2e/flujo-completo.mjs
 *   (con Playwright global: PLAYWRIGHT_PATH=$(npm root -g)/playwright/index.js node …)
 */
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

// PLAYWRIGHT_PATH permite usar una instalación global de Playwright.
const { chromium, devices } = (await import(process.env.PLAYWRIGHT_PATH ?? "playwright")).default;
const APP = process.env.APP_URL ?? "http://localhost:3000";
const MAIL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const SHOTS = process.env.SHOTS_DIR;
const run = Date.now().toString(36);
const PASS = "Orbita-2026-segura";

const step = (m) => console.log("·", m);
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });

async function latestLink(to, kind) {
  for (let i = 0; i < 30; i++) {
    const r = await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`).then((r) => r.json());
    const msg = r.messages?.find((m) => kind.test(m.Subject));
    if (msg) {
      const full = await fetch(`${MAIL}/api/v1/message/${msg.ID}`).then((r) => r.json());
      const href = full.HTML.match(/href="([^"]+auth\/confirm[^"]+)"/)?.[1];
      if (href) return href.replaceAll("&amp;", "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No llegó el correo a ${to}`);
}

async function register(browser, { email, username, name, interests, ctx = {} }) {
  const context = await browser.newContext(ctx);
  const page = await context.newPage();
  await page.goto(`${APP}/registro`);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASS);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.getByRole("heading", { name: "Revisa tu correo." }).waitFor();
  step(`registro enviado (${username})`);

  const link = await latestLink(email, /Confirma/);
  await page.goto(link);
  await page.waitForURL("**/bienvenida");
  step("correo confirmado → bienvenida");

  // Paso 1: validación cliente
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByText("De 3 a 24 caracteres").waitFor();
  await page.getByLabel("Nombre visible").fill(name);
  await page.getByLabel("Nombre de usuario").fill(username);
  await page.getByRole("button", { name: "Continuar" }).click();
  // Paso 2: intereses
  await page.getByRole("heading", { name: "¿Qué te mueve?" }).waitFor();
  for (const i of interests) await page.getByRole("button", { name: i, exact: true }).first().click();
  await page.locator("fieldset").nth(1).getByRole("button", { name: interests[0] }).click(); // favorito
  await shot(page, `onboarding-intereses-${username}`);
  await page.getByRole("button", { name: "Continuar" }).click();
  // Paso 3
  await page.getByLabel("Descripción").fill(`Hola, soy ${name}. Me interesan las preguntas grandes.`);
  await page.getByLabel("A quién te gustaría conocer").fill("Gente con huerta y telescopio.");
  await page.getByRole("button", { name: "Continuar" }).click();
  // Paso 4
  await page.getByText("Español", { exact: true }).click();
  await page.getByText("Abierta a conversar").click();
  await page.getByLabel("País").fill("España");
  await page.getByLabel("Región o ciudad").fill("Asturias");
  await page.getByRole("button", { name: "Entrar en UMBRA" }).click();
  await page.waitForURL("**/explorar?bienvenida=1");
  step("perfil completado → explorar");
  return { context, page };
}

const browser = await chromium.launch();
try {
  // 0. Sin sesión, las rutas privadas redirigen
  {
    const page = await browser.newPage();
    await page.goto(`${APP}/perfil`);
    assert.match(page.url(), /\/acceso\?next=%2Fperfil/);
    step("ruta privada sin sesión → /acceso");
    // Redirección abierta bloqueada
    const res = await fetch(`${APP}/auth/confirm?code=x&next=//evil.example`, { redirect: "manual" });
    assert.ok(!res.headers.get("location")?.includes("evil"));
    step("redirección abierta bloqueada");
    await page.close();
  }

  // 1. Validación del registro en servidor
  {
    const page = await browser.newPage();
    await page.goto(`${APP}/registro`);
    await page.getByLabel("Correo electrónico").fill("no-es-un-correo");
    await page.getByLabel("Contraseña", { exact: true }).fill("corta");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await page.getByText("Ese correo no parece válido.").waitFor();
    await page.getByText("Mínimo 10 caracteres.").waitFor();
    await page.getByText("Debes aceptar").waitFor();
    step("validación de registro");
    await page.close();
  }

  // 2. Dos miembros reales (Ana en móvil, Bruno en escritorio)
  const ana = await register(browser, {
    email: `ana.${run}@umbra.test`,
    username: `ana_${run}`,
    name: "Ana Lucero",
    interests: ["Astronomía y universo", "Bioconstrucción y permacultura", "UAP"],
    ctx: devices["iPhone 13"],
  });
  await shot(ana.page, "explorar-movil-ana");

  const bruno = await register(browser, {
    email: `bruno.${run}@umbra.test`,
    username: `bruno_${run}`,
    name: "Bruno Sela",
    interests: ["Astronomía y universo", "Bioconstrucción y permacultura", "Energías alternativas"],
    ctx: { viewport: { width: 1440, height: 900 } },
  });

  // 3. Bruno ve a Ana por afinidad (2 intereses en común)
  const anaLink = bruno.page.getByRole("link", { name: new RegExp(`@ana_${run}.*2 intereses en común`) }).first();
  await anaLink.waitFor();
  await shot(bruno.page, "explorar-escritorio-bruno");
  step("afinidad: Bruno ve a Ana con 2 intereses en común");
  await anaLink.click();
  await bruno.page.waitForURL(`**/miembros/ana_${run}`);
  await bruno.page.getByText("Asturias, España").waitFor();
  await shot(bruno.page, "perfil-ana-visto-por-bruno");
  step("perfil de otro miembro visible");

  // 4. Nombre de usuario duplicado rechazado
  await bruno.page.goto(`${APP}/perfil/editar`);
  await bruno.page.getByLabel("Nombre de usuario").fill(`ANA_${run}`);
  await bruno.page.getByRole("button", { name: "Guardar cambios" }).click();
  await bruno.page.getByText("Ese nombre de usuario ya está en uso.").waitFor();
  step("username duplicado (sin distinguir mayúsculas) rechazado");

  // 5. Avatar
  const png = await bruno.page.screenshot({ type: "png" }); // imagen real de prueba
  await bruno.page.goto(`${APP}/perfil/editar`);
  await bruno.page.setInputFiles('input[type="file"]', { name: "yo.png", mimeType: "image/png", buffer: png });
  await bruno.page.getByRole("button", { name: "Cambiar foto" }).waitFor({ timeout: 15000 });
  await bruno.page.goto(`${APP}/perfil`);
  const src = await bruno.page.locator("article img").first().getAttribute("src");
  assert.match(src ?? "", /\/storage\/v1\/object\/public\/avatars\//);
  assert.equal((await fetch(src)).status, 200);
  await shot(bruno.page, "perfil-propio-bruno");
  step("avatar subido a Storage y visible");

  // 6. Cierre de sesión
  await bruno.page.goto(`${APP}/ajustes`);
  await bruno.page.getByRole("button", { name: "Cerrar sesión" }).first().click();
  await bruno.page.waitForURL(`${APP}/`);
  await bruno.page.goto(`${APP}/explorar`);
  assert.match(bruno.page.url(), /\/acceso/);
  step("cierre de sesión");

  // 7. Inicio de sesión con contraseña incorrecta y correcta
  await bruno.page.getByLabel("Correo electrónico").fill(`bruno.${run}@umbra.test`);
  await bruno.page.getByLabel("Contraseña", { exact: true }).fill("incorrecta-123");
  await bruno.page.getByRole("button", { name: "Entrar" }).click();
  await bruno.page.getByText("Correo o contraseña incorrectos.").waitFor();
  await bruno.page.getByLabel("Contraseña", { exact: true }).fill(PASS);
  await bruno.page.getByRole("button", { name: "Entrar" }).click();
  await bruno.page.waitForURL("**/explorar");
  step("inicio de sesión");

  // 8. Recuperación de contraseña (Ana, en un navegador limpio)
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${APP}/recuperar`);
    await page.getByLabel("Correo electrónico").fill(`ana.${run}@umbra.test`);
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await page.getByText("Si existe una cuenta").waitFor();
    const link = await latestLink(`ana.${run}@umbra.test`, /Recupera/);
    await page.goto(link);
    await page.waitForURL("**/nueva-contrasena");
    await page.getByLabel("Nueva contraseña").fill("Nebulosa-2027-nueva");
    await page.getByLabel("Repite la contraseña").fill("Nebulosa-2027-nueva");
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await page.waitForURL("**/explorar");
    step("recuperación de contraseña");
    await ctx.close();
  }

  // 9. La sesión antigua de Ana (móvil) quedó revocada: debe volver a entrar
  await ana.page.goto(`${APP}/ajustes`);
  await ana.page.waitForURL(/\/acceso/);
  step("sesiones anteriores revocadas tras cambiar la contraseña");
  await ana.page.getByLabel("Correo electrónico").fill(`ana.${run}@umbra.test`);
  await ana.page.getByLabel("Contraseña", { exact: true }).fill("Nebulosa-2027-nueva");
  await ana.page.getByRole("button", { name: "Entrar" }).click();
  await ana.page.waitForURL("**/explorar");
  await shot(ana.page, "explorar-movil-ana-2");

  // 10. Eliminación de cuenta (Ana)
  await ana.page.goto(`${APP}/ajustes`);
  await ana.page.getByLabel(/para confirmar/).fill(`ana_${run}`);
  await ana.page.getByRole("button", { name: "Eliminar mi cuenta para siempre" }).click();
  await ana.page.waitForURL(/\/\?cuenta=eliminada/);
  await bruno.page.goto(`${APP}/miembros/ana_${run}`);
  assert.equal(await bruno.page.getByText("Asturias, España").count(), 0);
  step("cuenta eliminada y desaparecida para los demás");

  console.log("\n✓ Flujo completo superado");
} finally {
  await browser.close();
}
