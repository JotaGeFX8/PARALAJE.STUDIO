/**
 * Fase 6 · Administración y moderación: roles, denuncias, retirada de
 * contenido, suspensiones, reclasificación, cierre de conversaciones,
 * territorios, registro cerrado, límites de frecuencia y antispam.
 * Uso: node tests/e2e/admin.mjs   (usa psql vía Docker para nombrar la primera administradora,
 * igual que el paso manual del SQL Editor descrito en docs/CONFIGURACION.md)
 */
import { execFileSync } from "node:child_process";
import { APP, RUN, assert, devices, registerMember, runSuite, shot, step } from "./helpers.mjs";

const DB_CONTAINER = process.env.DB_CONTAINER ?? "supabase_db_umbra";
function sql(query) {
  return execFileSync("docker", ["exec", DB_CONTAINER, "psql", "-U", "postgres", "-tAc", query], { encoding: "utf8" }).trim();
}

async function publish(page, text, { title = "", kind = "Opinión", category = "" } = {}) {
  await page.goto(`${APP}/publicar${category ? `?territorio=${category}` : ""}`);
  if (title) await page.getByLabel(/^Título/).fill(title);
  await page.getByText(kind, { exact: true }).click();
  await page.getByLabel("Texto").fill(text);
  await page.getByRole("button", { name: "Publicar" }).click();
}

await runSuite("Administración y moderación", async (browser) => {
  const gema = await registerMember(browser, {
    key: "gema",
    name: "Gema Fundadora",
    topics: ["Debates", "Conciencia", "Proyectos colectivos"],
    ctx: { viewport: { width: 1360, height: 900 } },
  });
  const hugo = await registerMember(browser, {
    key: "hugo",
    name: "Hugo Prueba",
    topics: ["Debates", "UAP", "Enigmas históricos"],
    ctx: devices["iPhone 13"],
  });
  const ines = await registerMember(browser, {
    key: "ines",
    name: "Inés Moderadora",
    topics: ["Debates", "Arqueología", "Conciencia"],
  });
  sql(`update public.profiles set role = 'admin' where username = '${gema.username}'`);
  step("tres miembros; Gema pasa a administración (paso del SQL Editor)");

  // 0. Sin rol de equipo no hay panel
  await hugo.page.goto(`${APP}/admin`);
  await hugo.page.waitForURL(`${APP}/explorar`);
  step("el panel no es accesible sin rol de equipo");

  // 1. Hugo publica; Inés denuncia
  await publish(hugo.page, `Texto ofensivo de prueba ${RUN}`, { title: `Publicación problemática ${RUN}`, category: "debate" });
  await hugo.page.waitForURL(/\/p\/[0-9a-f-]{36}$/);
  const badPost = hugo.page.url();
  await ines.page.goto(badPost);
  await ines.page.getByRole("button", { name: "Denunciar" }).first().click();
  const dialog = ines.page.locator("dialog[open]");
  await dialog.getByLabel("Discurso de odio").check();
  await dialog.getByLabel("Detalles (opcional)").fill("Ataca a un colectivo.");
  await dialog.getByRole("button", { name: "Enviar denuncia" }).click();
  await dialog.getByText("Gracias.").waitFor();
  step("denuncia creada");

  // 2. Gema la revisa y retira el contenido
  await gema.page.goto(`${APP}/admin`);
  await gema.page.getByText("Denuncias abiertas").waitFor();
  await shot(gema.page, "admin-resumen");
  await gema.page.goto(`${APP}/admin/denuncias`);
  const report = gema.page.locator("li", { hasText: `Publicación problemática ${RUN}` }).first();
  await report.getByText("Ataca a un colectivo.").waitFor();
  await report.getByRole("button", { name: "Retirar contenido" }).click();
  await report.getByLabel("Motivo").fill("Incumple la norma 1.");
  await report.getByRole("button", { name: "Retirar", exact: true }).click();
  await report.getByText("Hecho").first().waitFor();
  await report.getByRole("button", { name: "Marcar resuelta" }).click();
  await report.getByRole("button", { name: "Resolver" }).click();
  await shot(gema.page, "admin-denuncias");
  await ines.page.goto(badPost);
  await ines.page.getByText("Aquí no hay nada.").waitFor();
  await hugo.page.goto(`${APP}/notificaciones`);
  await hugo.page.getByText(`Se ha retirado tu publicación «Publicación problemática ${RUN}»`).waitFor();
  step("contenido retirado, denuncia resuelta y autor notificado");

  // 3. Suspensión y reactivación
  await gema.page.goto(`${APP}/admin/usuarios?q=${hugo.username}`);
  const row = gema.page.locator("li", { hasText: `@${hugo.username}` });
  await row.getByRole("button", { name: "Suspender" }).click();
  await row.getByLabel("Motivo").fill("Reincidencia.");
  await row.getByRole("button", { name: "Suspender" }).click();
  await row.getByRole("button", { name: "Reactivar" }).waitFor();
  await row.getByText("Suspendida").waitFor();
  await hugo.page.goto(`${APP}/explorar`);
  await hugo.page.getByText("Cuenta suspendida.").waitFor();
  await gema.page.goto(`${APP}/admin/usuarios?q=${hugo.username}`);
  await gema.page.locator("li", { hasText: `@${hugo.username}` }).getByRole("button", { name: "Reactivar" }).click();
  await gema.page.getByRole("button", { name: "Reactivar cuenta" }).click();
  await gema.page.locator("li", { hasText: `@${hugo.username}` }).getByRole("button", { name: "Suspender" }).waitFor();
  await hugo.page.goto(`${APP}/explorar`);
  await hugo.page.getByRole("heading", { name: /Hola, Hugo/ }).waitFor();
  step("suspensión (acceso bloqueado) y reactivación");

  // 4. Roles: Inés pasa a moderación
  await gema.page.goto(`${APP}/admin/usuarios?q=${ines.username}`);
  await gema.page.locator("li", { hasText: `@${ines.username}` }).getByLabel("Rol").selectOption("moderator");
  await gema.page.getByText("Guardado").waitFor();
  await ines.page.goto(`${APP}/admin/denuncias`);
  await ines.page.getByRole("heading", { name: "Panel de la comunidad" }).waitFor();
  await ines.page.goto(`${APP}/admin/configuracion`);
  await ines.page.waitForURL(`${APP}/admin`);
  step("rol de moderación: accede al panel pero no a la configuración");

  // 5. Fijar, cerrar y reclasificar
  await publish(ines.page, `Las pirámides se construyeron con rampas internas ${RUN}`, {
    title: `Teoría de las rampas internas ${RUN}`,
    category: "historia",
  });
  await ines.page.waitForURL(/\/p\/[0-9a-f-]{36}$/);
  const theoryUrl = ines.page.url();
  await gema.page.goto(`${APP}/admin/contenido`);
  const item = gema.page.locator("li", { hasText: `Teoría de las rampas internas ${RUN}` }).first();
  await item.getByRole("button", { name: "Cerrar" }).click();
  await item.getByRole("button", { name: "Reabrir" }).waitFor();
  await item.getByRole("button", { name: "Fijar" }).click();
  await item.getByRole("button", { name: "Desfijar" }).waitFor();
  await item.getByLabel("Clasificación").selectOption("hypothesis");
  await item.getByRole("button", { name: "Reclasificar" }).click();
  await item.getByLabel("Motivo").fill("Es una hipótesis, no un hecho.");
  await item.getByRole("button", { name: "Aplicar" }).click();
  await item.locator('span[title^="Una posibilidad por explorar"]').waitFor();
  await hugo.page.goto(theoryUrl);
  await hugo.page.getByText("Conversación cerrada").waitFor();
  await hugo.page.locator('span[title^="Una posibilidad por explorar"]').first().waitFor();
  assert.equal(await hugo.page.getByLabel("Tu comentario").count(), 0);
  step("conversación cerrada, fijada y reclasificada como hipótesis");

  // 6. Foros: subcategoría nueva en el Ágora
  const slug = `arte-${RUN}`.slice(0, 30);
  await gema.page.goto(`${APP}/admin/foros`);
  const agora = gema.page.locator("section", { has: gema.page.getByRole("heading", { name: "Subcategorías de Ágora" }) });
  const form = agora.locator("form").last();
  await form.getByLabel("Id", { exact: true }).fill(slug);
  await form.getByLabel("Nombre", { exact: true }).fill(`Arte y creatividad ${RUN}`);
  await form.getByLabel("Descripción", { exact: true }).fill("Pintura, música y procesos creativos.");
  await form.getByRole("button", { name: "Crear" }).click();
  await form.getByText("Subcategoría guardada.").waitFor();
  await hugo.page.goto(`${APP}/comunidad/agora`);
  await hugo.page.getByRole("link", { name: `Arte y creatividad ${RUN}` }).first().waitFor();
  step("subcategoría nueva creada en un foro desde el panel");

  // 7. Registro cerrado
  await gema.page.goto(`${APP}/admin/configuracion`);
  await gema.page.getByLabel(/Registro abierto/).uncheck();
  await gema.page.getByRole("button", { name: "Guardar configuración" }).click();
  await gema.page.getByText("Configuración guardada.").waitFor();
  const anon = await browser.newPage();
  await anon.goto(`${APP}/registro`);
  await anon.getByLabel("Correo electrónico").fill(`cerrado.${RUN}@umbra.test`);
  await anon.getByLabel("Contraseña", { exact: true }).fill("Orbita-2026-segura");
  await anon.getByRole("checkbox").check();
  await anon.getByRole("button", { name: "Crear cuenta" }).click();
  await anon.getByText("El registro está cerrado temporalmente").waitFor();
  await gema.page.getByLabel(/Registro abierto/).check();
  await gema.page.getByRole("button", { name: "Guardar configuración" }).click();
  await gema.page.getByText("Configuración guardada.").waitFor();
  await anon.close();
  step("registro cerrado y reabierto desde la configuración");

  // 8. Antispam y límites de frecuencia
  const dup = `Mensaje repetido para comprobar el antispam ${RUN}`;
  await publish(hugo.page, dup);
  await hugo.page.waitForURL(/\/p\/[0-9a-f-]{36}$/);
  await publish(hugo.page, dup);
  await hugo.page.getByText("Ya has publicado este mismo texto hoy.").waitFor();
  for (let i = 0; i < 6; i++) {
    await publish(hugo.page, `Publicación en ráfaga ${i} ${RUN}`);
    if (await hugo.page.getByText("Has publicado mucho en poco tiempo").isVisible().catch(() => false)) break;
    await hugo.page.waitForURL(/\/p\/[0-9a-f-]{36}$/, { timeout: 8000 }).catch(() => {});
  }
  await hugo.page.getByText("Has publicado mucho en poco tiempo").waitFor();
  step("antispam: texto duplicado y límite de 5 publicaciones cada 10 minutos");
});
