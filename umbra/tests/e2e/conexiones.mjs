/**
 * Fase 4 · Conexiones, mensajería y notificaciones.
 * Uso: node tests/e2e/conexiones.mjs
 */
import { APP, RUN, assert, devices, registerMember, runSuite, shot, step } from "./helpers.mjs";

await runSuite("Conexiones y mensajería", async (browser) => {
  const carla = await registerMember(browser, {
    key: "carla",
    name: "Carla Ribera",
    topics: ["Bioconstrucción", "Vida off-grid", "Agricultura ecológica"],
    ctx: devices["iPhone 13"],
    country: "España",
    region: "Galicia",
  });
  const david = await registerMember(browser, {
    key: "david",
    name: "David Orce",
    topics: ["Bioconstrucción", "Vida off-grid", "Energía solar"],
    ctx: { viewport: { width: 1360, height: 900 } },
    country: "Portugal",
    region: "Minho",
  });
  step("dos miembros con intereses en común");

  // 1. Descubrir → solicitud con nota
  await carla.page.goto(`${APP}/conexiones`);
  const davidCard = carla.page.locator("article", { hasText: `@${david.username}` });
  await carla.page.getByRole("button", { name: "Pasar" }).waitFor();
  // Pasa tarjetas (de otras ejecuciones) hasta llegar al David de esta prueba
  for (let i = 0; i < 40 && !(await davidCard.isVisible()); i++) {
    await carla.page.getByRole("button", { name: "Pasar" }).click();
    await carla.page.waitForTimeout(250);
  }
  await davidCard.getByText("Bioconstrucción").first().waitFor();
  await shot(carla.page, "conexiones-descubrir-movil");
  await carla.page.getByRole("button", { name: "Conectar" }).click();
  await carla.page.getByLabel("¿Por qué te gustaría conectar? (opcional)").fill("Estoy levantando una casa de paja y vi que te interesa la autosuficiencia.");
  await carla.page.getByRole("button", { name: "Enviar solicitud" }).click();
  await carla.page.getByText("Solicitud enviada a David Orce.").waitFor();
  step("«Descubrir»: solicitud enviada con nota");

  // 2. David: contador, aviso y aceptación
  await david.page.goto(`${APP}/explorar`);
  const requestsBadge = david.page.locator("aside nav a[href='/conexiones'] .badge");
  await requestsBadge.waitFor();
  assert.equal((await requestsBadge.textContent())?.trim(), "1");
  await david.page.goto(`${APP}/notificaciones`);
  await david.page.getByText("Carla Ribera quiere conectar contigo").waitFor();
  await david.page.goto(`${APP}/conexiones?ver=solicitudes`);
  await david.page.getByText("casa de paja").waitFor();
  await david.page.getByRole("button", { name: "Aceptar solicitud" }).click();
  await david.page.getByRole("button", { name: "Mensaje" }).waitFor();
  step("contador de solicitudes, aviso y aceptación");

  // 3. Carla recibe el aviso y escribe
  await carla.page.goto(`${APP}/notificaciones`);
  await carla.page.getByText("David Orce aceptó tu solicitud de conexión").waitFor();
  await carla.page.goto(`${APP}/miembros/${david.username}`);
  await carla.page.getByText("Compartís 2 intereses").waitFor();
  await carla.page.getByRole("button", { name: "Mensaje" }).click();
  await carla.page.waitForURL(/\/mensajes\/[0-9a-f-]{36}$/);
  const convoUrl = carla.page.url();
  await carla.page.getByLabel("Mensaje para David Orce").fill(`¡Hola David! ¿Qué tal la casa? ${RUN}`);
  await carla.page.getByRole("button", { name: "Enviar" }).click();
  await carla.page.getByText(`¡Hola David! ¿Qué tal la casa? ${RUN}`).waitFor();
  step("conversación privada abierta y primer mensaje");

  // 4. David: no leídos, lectura y respuesta; Carla la recibe sin recargar
  await david.page.goto(`${APP}/explorar`);
  const msgBadge = david.page.locator("aside nav a[href='/mensajes'] .badge");
  await msgBadge.waitFor();
  await david.page.goto(`${APP}/mensajes`);
  await david.page.getByText("Carla Ribera").first().waitFor();
  await david.page.locator("a[href^='/mensajes/'] .badge").first().waitFor();
  await david.page.goto(convoUrl);
  await david.page.getByText(`¡Hola David! ¿Qué tal la casa? ${RUN}`).waitFor();
  await david.page.getByLabel("Mensaje para Carla Ribera").fill("¡Muy bien! Ya tenemos la estructura de madera.");
  await david.page.keyboard.press("Enter");
  await david.page.getByText("Ya tenemos la estructura de madera.").waitFor();
  await carla.page.getByText("Ya tenemos la estructura de madera.").waitFor({ timeout: 15000 });
  await shot(carla.page, "mensajes-conversacion-movil");
  await david.page.goto(`${APP}/explorar`);
  assert.equal(await david.page.locator("aside nav a[href='/mensajes'] .badge").count(), 0);
  step("no leídos, respuesta recibida en vivo y contador a cero tras leer");

  // 5. Buscador con filtros
  await david.page.goto(`${APP}/conexiones?ver=buscar&a=agricultura&rel=can_teach&o=debate&l=Español&pais=España&region=galicia`);
  const carlaLink = david.page.locator(`a[href="/miembros/${carla.username}"]`);
  await carlaLink.first().waitFor();
  await david.page.getByText(/Compartís \d intereses/).first().waitFor();
  await david.page.goto(`${APP}/conexiones?ver=buscar&rel=learning`);
  assert.equal(await carlaLink.count(), 0);
  await david.page.goto(`${APP}/conexiones?ver=buscar&pais=Francia`);
  assert.equal(await carlaLink.count(), 0);
  await shot(david.page, "conexiones-buscador");
  step("buscador de miembros: área, conocimientos, objetivos, idioma, país y región, con razones");

  // 6. Menciones y comentarios generan avisos
  await carla.page.goto(`${APP}/publicar`);
  await carla.page.getByLabel("Texto").fill(`@${david.username} ¿cómo aislaste el tejado? ${RUN}`);
  await carla.page.getByRole("button", { name: "Publicar" }).click();
  await carla.page.waitForURL(/\/p\/[0-9a-f-]{36}$/);
  const postUrl = carla.page.url();
  await david.page.goto(`${APP}/notificaciones`);
  await david.page.getByText("Carla Ribera te mencionó en").first().waitFor();
  await david.page.goto(postUrl);
  await david.page.getByLabel("Tu comentario").fill("Con corcho natural, te paso fotos.");
  await david.page.getByRole("button", { name: "Comentar" }).click();
  await david.page.getByText("Con corcho natural").waitFor();
  await carla.page.goto(`${APP}/notificaciones`);
  await carla.page.getByText("David Orce comentó en").first().waitFor();
  step("avisos de mención y de comentario");

  // 7. Preferencias: sin avisos de menciones
  await david.page.goto(`${APP}/ajustes`);
  await david.page.getByLabel("Menciones (@usuario)").uncheck();
  await david.page.getByRole("button", { name: "Guardar preferencias" }).click();
  await david.page.getByText("Preferencias guardadas.").waitFor();
  await carla.page.goto(postUrl);
  await carla.page.getByLabel("Tu comentario").fill(`Gracias @${david.username}, ¡genial! ${RUN}-2`);
  await carla.page.getByRole("button", { name: "Comentar" }).click();
  await carla.page.getByText(`${RUN}-2`).waitFor();
  await david.page.goto(`${APP}/notificaciones`);
  assert.equal(await david.page.getByText("te mencionó en").count(), 1, "no llega una segunda mención");
  step("preferencias de avisos respetadas");

  // 8. Bloqueo: corta la conexión y la mensajería
  await carla.page.goto(`${APP}/miembros/${david.username}`);
  await carla.page.getByRole("button", { name: "Bloquear" }).click();
  await carla.page.getByRole("button", { name: "Bloquear: no podrá contactarte" }).click();
  await carla.page.getByText("Has bloqueado a esta persona").waitFor({ timeout: 10000 }).catch(() => {});
  await david.page.goto(convoUrl);
  await david.page.getByText("No podéis escribiros ahora").waitFor();
  await david.page.goto(`${APP}/conexiones?ver=buscar&q=Ribera`);
  await david.page.getByText(/Resultados/).waitFor();
  assert.equal(await david.page.locator(`a[href="/miembros/${carla.username}"]`).count(), 0);
  step("bloqueo: sin mensajería ni visibilidad en el buscador");

  await carla.page.goto(`${APP}/ajustes`);
  await carla.page.getByRole("button", { name: "Desbloquear" }).click();
  await carla.page.getByText("No has bloqueado a nadie.").waitFor();
  step("desbloqueo desde Ajustes");
});
