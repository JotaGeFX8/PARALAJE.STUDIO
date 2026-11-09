/**
 * Prueba de extremo a extremo de la cuenta (fases 1–2): registro, confirmación,
 * bienvenida, afinidad, perfil, avatar, sesión, recuperación y baja.
 * Uso: node tests/e2e/flujo-completo.mjs   (ver helpers.mjs para requisitos)
 */
import { APP, PASS, RUN as run, assert, chromium, devices, latestLink, registerMember, shot, step } from "./helpers.mjs";

async function register(browser, { email, username, name, interests, ctx = {} }) {
  const key = username.split("_")[0];
  const r = await registerMember(browser, { key, name, interests, ctx });
  assert.equal(r.email, email);
  step(`registro, confirmación y bienvenida (${username})`);
  return r;
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
