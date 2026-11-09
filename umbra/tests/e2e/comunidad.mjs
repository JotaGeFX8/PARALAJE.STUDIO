/**
 * Comunidad: siete foros con subcategorías, tipos de publicación y clasificación,
 * imágenes y archivos adjuntos, encuestas, filtros («Sin responder»), reacciones,
 * comentarios en hilo, guardados, búsqueda, etiquetas, denuncias, edición y borrado.
 * Uso: node tests/e2e/comunidad.mjs
 */
import { APP, RUN, assert, devices, registerMember, runSuite, shot, step } from "./helpers.mjs";

await runSuite("Comunidad", async (browser) => {
  const ana = await registerMember(browser, {
    key: "ana",
    name: "Ana Lucero",
    topics: ["Física cuántica", "Astronomía", "Bioconstrucción"],
    ctx: { viewport: { width: 1360, height: 900 } },
  });
  const bruno = await registerMember(browser, {
    key: "bruno",
    name: "Bruno Sela",
    topics: ["Física cuántica", "Energía solar", "Debates"],
    ctx: devices["iPhone 13"],
  });
  step("dos miembros registrados por el flujo real");

  // 1. Publicar en un foro y subcategoría (dirección antigua ?territorio=): lo documentado exige fuentes
  const tag = `ondas${RUN}`.slice(0, 20);
  const title = `¿Qué significa realmente la superposición cuántica? ${RUN}`;
  await ana.page.goto(`${APP}/publicar?territorio=ciencia`);
  assert.equal(await ana.page.getByLabel("Foro").inputValue(), "ciencia");
  assert.equal(await ana.page.getByLabel("Subcategoría · opcional").inputValue(), "ciencia");
  await ana.page.locator('input[name="type_choice"][value="research"]').check();
  await ana.page.getByLabel(/^Título/).fill(title);
  await ana.page.getByText("Hecho documentado", { exact: true }).click();
  await ana.page.getByLabel("Texto").fill(
    "La **superposición** no significa que algo esté en dos sitios a la vez, sino que el estado se describe como combinación de posibilidades.\n\n> Ninguna medida, ningún fenómeno.\n\n- Experimento de la doble rendija\n- Interpretación de Copenhague\n\nMás en https://es.wikipedia.org/wiki/Superposici%C3%B3n_cu%C3%A1ntica",
  );
  await ana.page.getByLabel(/^Etiquetas/).fill(`${tag}, física`);
  await ana.page.getByRole("button", { name: "Publicar" }).click();
  await ana.page.getByText("Lo documentado necesita al menos una fuente.").waitFor();
  step("validación: lo documentado sin fuentes se rechaza");

  await ana.page.getByLabel("Fuente 1").fill("https://plato.stanford.edu/entries/qm/");
  const img = await ana.page.screenshot({ type: "png" });
  await ana.page.getByLabel("Seleccionar imágenes").setInputFiles({ name: "diagrama.png", mimeType: "image/png", buffer: img });
  await ana.page.getByRole("button", { name: "Quitar imagen" }).waitFor();
  await ana.page
    .getByLabel("Seleccionar archivos")
    .setInputFiles({ name: "notas-cuanticas.txt", mimeType: "text/plain", buffer: Buffer.from(`Notas de lectura ${RUN}`) });
  await ana.page.getByRole("button", { name: "Quitar notas-cuanticas.txt" }).waitFor();
  await ana.page.getByRole("button", { name: "Publicar" }).click();
  await ana.page.waitForURL(/\/p\/[0-9a-f-]{36}$/);
  const postUrl = ana.page.url();
  const postId = postUrl.split("/p/")[1];
  await ana.page.getByRole("heading", { name: title }).waitFor();
  await ana.page.getByText("Investigación", { exact: true }).first().waitFor();
  await ana.page.getByText("plato.stanford.edu", { exact: false }).first().waitFor();
  await ana.page.getByRole("link", { name: "Física y química" }).waitFor();
  const imgSrc = await ana.page.locator("article img").last().getAttribute("src");
  assert.match(imgSrc ?? "", /^\/media\/sign\/post-images\//);
  assert.equal((await fetch(new URL(imgSrc, APP))).status, 200);
  assert.ok(await ana.page.locator("blockquote").count(), "cita renderizada");
  assert.ok(await ana.page.locator("strong", { hasText: "superposición" }).count(), "negrita renderizada");
  const fileHref = await ana.page.getByRole("link", { name: /notas-cuanticas\.txt/ }).getAttribute("href");
  const fileRes = await fetch(fileHref);
  assert.equal(fileRes.status, 200);
  assert.match(fileRes.headers.get("content-disposition") ?? "", /attachment/);
  assert.equal(await fileRes.text(), `Notas de lectura ${RUN}`);
  await shot(ana.page, "comunidad-publicacion");
  step("investigación documentada con fuente, imagen privada y archivo adjunto (descarga firmada como archivo)");

  // 2. Bruno la encuentra en el foro y en la subcategoría, con filtros
  await bruno.page.goto(`${APP}/comunidad/ciencia`);
  await bruno.page.getByRole("link", { name: title }).waitFor();
  await bruno.page.goto(`${APP}/comunidad/ciencia?clase=hypothesis`);
  assert.equal(await bruno.page.getByRole("link", { name: title }).count(), 0);
  await bruno.page.goto(`${APP}/comunidad/ciencia/ciencia?clase=documented&tipo=research&sin_responder=1&orden=trending`);
  await bruno.page.getByRole("link", { name: title }).waitFor();
  await bruno.page.goto(`${APP}/comunidad/ciencia?tipo=poll`);
  assert.equal(await bruno.page.getByRole("link", { name: title }).count(), 0);
  await shot(bruno.page, "comunidad-foro-movil");
  step("foro y subcategoría: filtros por tipo, clasificación, «Sin responder» y tendencias");

  // 3. Reacción y comentario
  await bruno.page.goto(postUrl);
  const aporta = bruno.page.getByRole("button", { name: /Aporta/ }).first();
  await aporta.click();
  await bruno.page.waitForTimeout(600);
  await bruno.page.reload();
  assert.equal(await bruno.page.getByRole("button", { name: /Aporta/ }).first().getAttribute("aria-pressed"), "true");
  step("reacción «Aporta» persistente");

  await bruno.page.getByLabel("Tu comentario").fill(`Gran explicación. ¿Y el entrelazamiento? @ana_${RUN}`);
  await bruno.page.getByRole("button", { name: "Comentar" }).click();
  await bruno.page.getByText("Gran explicación.").waitFor();
  await bruno.page.getByLabel("Tu comentario").fill("Comentario que voy a borrar");
  await bruno.page.getByRole("button", { name: "Comentar" }).click();
  await bruno.page.getByText("Comentario que voy a borrar").waitFor();
  step("comentarios publicados (con mención enlazada)");

  await ana.page.goto(postUrl);
  await ana.page.getByRole("button", { name: "Responder" }).first().click();
  await ana.page.getByLabel("Tu respuesta").fill("El entrelazamiento da para otro hilo entero.");
  await ana.page
    .locator("form", { has: ana.page.getByLabel("Tu respuesta") })
    .getByRole("button", { name: "Responder" })
    .click();
  await ana.page.getByText("El entrelazamiento da para otro hilo entero.").waitFor();
  assert.ok(await ana.page.locator("li.border-l article", { hasText: "otro hilo entero" }).count(), "respuesta anidada");
  step("respuesta anidada en el hilo");

  // Bruno edita y borra sus comentarios
  await bruno.page.reload();
  const toDelete = bruno.page.locator("article[id^='c-']", { hasText: "Comentario que voy a borrar" });
  await toDelete.getByRole("button", { name: "Eliminar" }).click();
  await toDelete.getByRole("button", { name: "Eliminar", exact: true }).click();
  await bruno.page.getByText("Este comentario ya no está disponible.").waitFor();
  const toEdit = bruno.page.locator("article[id^='c-']", { hasText: "Gran explicación." }).first();
  await toEdit.getByRole("button", { name: "Editar" }).click();
  await bruno.page.getByLabel("Editar comentario").fill("Gran explicación, gracias. ¿Y el entrelazamiento?");
  await bruno.page
    .locator("article[id^='c-']", { has: bruno.page.getByLabel("Editar comentario") })
    .getByRole("button", { name: "Guardar" })
    .click();
  await bruno.page.getByText("Gran explicación, gracias.").waitFor();
  await bruno.page.getByText("· editado").first().waitFor();
  step("comentario editado y comentario borrado (el hilo se conserva)");

  // 4. Guardar y seguir
  await bruno.page.locator("button[aria-pressed]", { hasText: "Guardar" }).click();
  await bruno.page.getByRole("button", { name: "Guardada" }).waitFor();
  await bruno.page.goto(`${APP}/guardados`);
  await bruno.page.getByRole("link", { name: title }).waitFor();
  step("guardados");

  // 5. Búsqueda sin tildes y por prefijo, personas y etiquetas
  await bruno.page.goto(`${APP}/buscar?q=${encodeURIComponent("superposicion cuant")}`);
  await bruno.page.getByRole("link", { name: title }).waitFor();
  await bruno.page.goto(`${APP}/buscar?q=Lucero&en=personas`);
  await bruno.page.getByRole("link", { name: /Ana Lucero/ }).first().waitFor();
  await bruno.page.goto(`${APP}/etiqueta/${tag}`);
  await bruno.page.getByRole("link", { name: title }).waitFor();
  step("búsqueda sin tildes/prefijos, personas y página de etiqueta");

  // 6. Denunciar
  await bruno.page.goto(postUrl);
  await bruno.page.getByRole("button", { name: "Denunciar" }).first().click();
  const dialog = bruno.page.locator("dialog[open]");
  await dialog.getByLabel("Presenta una hipótesis como hecho").check();
  await dialog.getByRole("button", { name: "Enviar denuncia" }).click();
  await dialog.getByText("Gracias. Una persona del equipo").waitFor();
  await bruno.page.keyboard.press("Escape");
  step("denuncia enviada");

  // 7. Seguridad: Bruno no puede editar la publicación de Ana
  await bruno.page.goto(`${postUrl}/editar`);
  await bruno.page.waitForURL(postUrl);
  step("edición ajena bloqueada");

  // 8. Ana edita y luego borra
  await ana.page.goto(`${postUrl}/editar`);
  await ana.page.getByLabel(/^Título/).fill(`${title} (revisado)`);
  await ana.page.getByRole("button", { name: "Guardar cambios" }).click();
  await ana.page.waitForURL(postUrl);
  await ana.page.getByText("· editada").waitFor();
  await ana.page.getByRole("button", { name: "Eliminar" }).first().click();
  await ana.page.getByRole("button", { name: "Eliminar definitivamente" }).click();
  await ana.page.waitForURL(`${APP}/comunidad/ciencia/ciencia`);
  await bruno.page.goto(postUrl);
  await bruno.page.getByText("Aquí no hay nada.").waitFor();
  step("edición propia y borrado (desaparece para los demás)");

  // 9. Ágora: pregunta sin título
  await bruno.page.goto(`${APP}/publicar`);
  assert.equal(await bruno.page.getByLabel("Foro").inputValue(), "agora");
  await bruno.page.locator('input[name="type_choice"][value="question"]').check();
  await bruno.page.getByLabel("Texto").fill(`¿Alguien ha probado a construir con tierra compactada en clima húmedo? ${RUN}`);
  await bruno.page.getByRole("button", { name: "Publicar" }).click();
  await bruno.page.waitForURL(/\/p\/[0-9a-f-]{36}$/);
  await bruno.page.getByText("Pregunta", { exact: true }).waitFor();
  await bruno.page.locator('span[title^="Una duda sin respuesta"]').first().waitFor();
  await shot(bruno.page, "agora-pregunta-movil");
  step("pregunta en el Ágora (sin título; clasificación «Pregunta abierta» propuesta por el tipo)");

  // 10. Encuesta: crear, votar, resultados anónimos y cierre
  const pollTitle = `¿Qué observamos esta semana? ${RUN}`;
  await ana.page.goto(`${APP}/publicar?foro=universo`);
  await ana.page.locator('input[name="type_choice"][value="poll"]').check();
  await ana.page.getByLabel(/^Título/).fill(pollTitle);
  await ana.page.getByLabel("Opción 1", { exact: true }).fill("La Luna");
  await ana.page.getByLabel("Opción 2", { exact: true }).fill("Saturno");
  await ana.page.getByRole("button", { name: "Añadir opción" }).click();
  await ana.page.getByLabel("Opción 3", { exact: true }).fill("Júpiter");
  await ana.page.getByLabel("Texto").fill("Organizamos una observación en grupo. Vota lo que más te apetezca ver.");
  await ana.page.getByRole("button", { name: "Publicar" }).click();
  await ana.page.waitForURL(/\/p\/[0-9a-f-]{36}$/);
  const pollUrl = ana.page.url();
  await ana.page.getByText("Encuesta · una respuesta").waitFor();
  await bruno.page.goto(pollUrl);
  await bruno.page.getByText("Saturno", { exact: true }).click();
  await bruno.page.getByRole("button", { name: "Votar" }).click();
  await bruno.page.getByText("tu voto").waitFor();
  await bruno.page.getByText("1 persona ha votado").waitFor();
  await ana.page.reload();
  await ana.page.getByRole("button", { name: "Cerrar encuesta" }).click();
  await ana.page.getByText("Cerrada", { exact: false }).first().waitFor();
  await ana.page.getByText("100% · 1").waitFor();
  await bruno.page.reload();
  assert.equal(await bruno.page.getByRole("button", { name: "Cambiar voto" }).count(), 0);
  await shot(bruno.page, "encuesta-movil");
  step("encuesta: voto, resultados agregados y cierre");

  void postId;
});
