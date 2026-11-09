/**
 * Utilidades comunes de las pruebas de extremo a extremo.
 * Requisitos: Supabase local (`npm run db:start`), la app en APP_URL y Playwright.
 * PLAYWRIGHT_PATH permite usar una instalación global de Playwright.
 */
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

export const pw = (await import(process.env.PLAYWRIGHT_PATH ?? "playwright")).default;
export const { chromium, devices } = pw;
export { assert };

export const APP = process.env.APP_URL ?? "http://localhost:3000";
export const MAIL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
export const PASS = "Orbita-2026-segura";
export const RUN = Date.now().toString(36);

const SHOTS = process.env.SHOTS_DIR;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

export const step = (m) => console.log("·", m);
export const shot = async (page, name, fullPage = false) =>
  SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });

/** Último enlace de Supabase Auth enviado a una dirección (buzón local Mailpit). */
export async function latestLink(to, subject) {
  for (let i = 0; i < 40; i++) {
    const r = await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`).then((r) => r.json());
    const msg = r.messages?.find((m) => subject.test(m.Subject));
    if (msg) {
      const full = await fetch(`${MAIL}/api/v1/message/${msg.ID}`).then((r) => r.json());
      const href = full.HTML.match(/href="([^"]+auth\/confirm[^"]+)"/)?.[1];
      if (href) return href.replaceAll("&amp;", "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No llegó el correo a ${to}`);
}

/**
 * Registra un miembro de prueba por el flujo real (registro → correo → bienvenida).
 * Devuelve el contexto y la página con la sesión iniciada.
 */
export async function registerMember(browser, { key, name, interests, ctx = {}, country = "España", region = "Asturias" }) {
  const email = `${key}.${RUN}@umbra.test`;
  const username = `${key}_${RUN}`;
  const context = await browser.newContext(ctx);
  const page = await context.newPage();
  await page.goto(`${APP}/registro`);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASS);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.getByRole("heading", { name: "Revisa tu correo." }).waitFor();
  await page.goto(await latestLink(email, /Confirma/));
  await page.waitForURL("**/bienvenida");
  await page.getByLabel("Nombre visible").fill(name);
  await page.getByLabel("Nombre de usuario").fill(username);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("heading", { name: "¿Qué te mueve?" }).waitFor();
  for (const i of interests) await page.getByRole("button", { name: i, exact: true }).first().click();
  await page.locator("fieldset").nth(1).getByRole("button", { name: interests[0] }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Descripción").fill(`Hola, soy ${name}. Me interesan las preguntas grandes.`);
  await page.getByLabel("A quién te gustaría conocer").fill("Gente con huerta y telescopio.");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByText("Español", { exact: true }).click();
  await page.getByText("Abierta a conversar").click();
  if (country) await page.getByLabel("País").fill(country);
  if (region) await page.getByLabel("Región o ciudad").fill(region);
  await page.getByRole("button", { name: /^Entrar en / }).click();
  await page.waitForURL("**/explorar?bienvenida=1");
  return { context, page, email, username, name };
}

export async function login(browser, email, password = PASS, ctx = {}) {
  const context = await browser.newContext(ctx);
  const page = await context.newPage();
  await page.goto(`${APP}/acceso`);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/explorar");
  return { context, page };
}

/** Ejecuta una prueba con navegador y cierra siempre. */
export async function runSuite(name, fn) {
  const browser = await chromium.launch();
  try {
    await fn(browser);
    console.log(`\n✓ ${name}: superada`);
  } finally {
    await browser.close();
  }
}
