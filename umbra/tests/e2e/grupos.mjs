/**
 * Fase 5 · Círculos (público, privado, por invitación), chat de grupo,
 * proyectos con colaboración y novedades, Ágora y Explorar.
 * Uso: node tests/e2e/grupos.mjs
 */
import { APP, RUN, assert, devices, registerMember, runSuite, shot, step } from "./helpers.mjs";

await runSuite("Círculos, proyectos y Ágora", async (browser) => {
  const elena = await registerMember(browser, {
    key: "elena",
    name: "Elena Vidal",
    interests: ["Astronomía y universo", "Historia y arqueología", "Proyectos colaborativos"],
    ctx: { viewport: { width: 1360, height: 900 } },
  });
  const felix = await registerMember(browser, {
    key: "felix",
    name: "Félix Ramos",
    interests: ["Astronomía y universo", "Agricultura y ganadería", "Proyectos colaborativos"],
    ctx: devices["iPhone 13"],
  });
  const cover = await elena.page.screenshot({ type: "png" });
  step("dos miembros registrados");

  async function createCircle(name, visibility, withCover = false) {
    await elena.page.goto(`${APP}/circulos/nuevo`);
    await elena.page.getByLabel("Nombre").fill(name);
    await elena.page.getByLabel("Descripción").fill(`Círculo de prueba: ${name}. Nos vemos cada luna nueva.`);
    await elena.page.getByText(visibility, { exact: true }).click();
    if (withCover) {
      await elena.page.setInputFiles('input[type="file"]', { name: "portada.png", mimeType: "image/png", buffer: cover });
      await elena.page.getByText("Descartar imagen nueva").waitFor();
    }
    await elena.page.getByRole("button", { name: "Crear círculo" }).click();
    await elena.page.waitForURL(/\/circulos\/[0-9a-f-]{36}$/);
    await elena.page.getByRole("heading", { name }).waitFor();
    return elena.page.url();
  }

  // 1. Círculo público con portada: unirse, publicar y chat
  const publicName = `Astronomía de patio ${RUN}`;
  const publicUrl = await createCircle(publicName, "Público", true);
  const coverSrc = await elena.page.locator("img").first().getAttribute("src");
  assert.match(coverSrc ?? "", /^\/media\/public\/covers\//);
  assert.equal((await fetch(new URL(coverSrc, APP))).status, 200);
  step("círculo público creado con portada (servida desde /media)");

  await felix.page.goto(`${APP}/circulos?ver=descubrir&q=${encodeURIComponent(RUN)}`);
  await felix.page.getByRole("link", { name: new RegExp(publicName) }).click();
  await felix.page.getByRole("button", { name: "Unirse al círculo" }).click();
  await felix.page.getByText("Eres miembro · Salir").waitFor();
  await felix.page.getByRole("link", { name: "Publicar en el círculo" }).click();
  await felix.page.getByLabel(/^Título/).fill(`Saturno visible esta semana ${RUN}`);
  await felix.page.getByLabel("Texto").fill("A simple vista se ve hacia el sureste después de las 22:00.");
  await felix.page.getByText("Experiencia", { exact: true }).click();
  await felix.page.getByRole("button", { name: "Publicar" }).click();
  await felix.page.waitForURL(/\/p\/[0-9a-f-]{36}$/);
  await felix.page.getByRole("link", { name: "← Círculo" }).waitFor();
  await elena.page.goto(publicUrl);
  await elena.page.getByRole("link", { name: `Saturno visible esta semana ${RUN}` }).waitFor();
  step("unirse a un círculo público y publicar dentro");

  await elena.page.goto(`${publicUrl}?ver=chat`);
  await felix.page.goto(`${publicUrl}?ver=chat`);
  await felix.page.getByLabel(`Escribe a ${publicName}…`).fill("¿Quedamos el sábado para observar?");
  await felix.page.keyboard.press("Enter");
  await felix.page.getByText("¿Quedamos el sábado para observar?").waitFor();
  await elena.page.getByText("¿Quedamos el sábado para observar?").waitFor({ timeout: 15000 });
  await shot(felix.page, "circulo-chat-movil");
  step("chat de grupo en vivo");

  // 2. Círculo privado: solicitud, aviso y aceptación
  const privateName = `Investigación histórica ${RUN}`;
  const privateUrl = await createCircle(privateName, "Privado");
  await felix.page.goto(privateUrl);
  await felix.page.getByText("Este círculo es privado").waitFor();
  await felix.page.getByRole("button", { name: "Solicitar acceso" }).click();
  await felix.page.getByLabel("Preséntate (opcional)").fill("Estudio archivos parroquiales.");
  await felix.page.getByRole("button", { name: "Enviar solicitud" }).click();
  await felix.page.getByText("Solicitud enviada").waitFor();
  await elena.page.goto(`${APP}/notificaciones`);
  await elena.page.getByText(`Félix Ramos pide unirse a «${privateName}»`).waitFor();
  await elena.page.goto(`${privateUrl}?ver=gestion`);
  await elena.page.getByText("Estudio archivos parroquiales.").waitFor();
  await elena.page.getByRole("button", { name: "Aceptar" }).first().click();
  await elena.page.getByText("Aceptada").waitFor();
  await felix.page.goto(`${APP}/notificaciones`);
  await felix.page.getByText(`Ya formas parte del círculo «${privateName}»`).waitFor();
  await felix.page.goto(privateUrl);
  await felix.page.getByText("Eres miembro · Salir").waitFor();
  step("círculo privado: contenido oculto, solicitud, aviso y aceptación");

  // 3. Círculo por invitación: invisible hasta invitar
  const inviteName = `Sociedad discreta ${RUN}`;
  const inviteUrl = await createCircle(inviteName, "Por invitación");
  await felix.page.goto(`${APP}/circulos?ver=descubrir&q=${encodeURIComponent(RUN)}`);
  assert.equal(await felix.page.getByRole("link", { name: new RegExp(inviteName) }).count(), 0);
  await elena.page.goto(`${inviteUrl}?ver=gestion`);
  await elena.page.getByLabel("Invitar por nombre de usuario").fill(`@${felix.username}`);
  await elena.page.getByRole("button", { name: "Invitar" }).click();
  await elena.page.getByText(`Invitación enviada a @${felix.username}.`).waitFor();
  await felix.page.goto(`${APP}/circulos?ver=invitaciones`);
  await felix.page.getByText(inviteName).waitFor();
  await felix.page.getByRole("link", { name: "Ver y responder" }).first().click();
  await felix.page.getByRole("button", { name: "Aceptar invitación" }).click();
  await felix.page.getByText("Eres miembro · Salir").waitFor();
  step("círculo por invitación: oculto, invitación y aceptación");

  // 4. Proyecto: creación, colaboración, novedades
  const projectTitle = `Huerto comunitario del barrio ${RUN}`;
  await elena.page.goto(`${APP}/proyectos/nuevo`);
  await elena.page.getByLabel("Nombre del proyecto").fill(projectTitle);
  await elena.page.getByLabel("Resumen en una frase").fill("Recuperar un solar abandonado para cultivar entre vecinos.");
  await elena.page.getByLabel("Descripción").fill("Tenemos permiso del ayuntamiento y **agua** disponible.");
  await elena.page.getByLabel("Objetivos · uno por línea").fill("Limpiar el solar\nMontar bancales elevados\nPrimera cosecha en primavera");
  await elena.page.getByLabel("Qué ayuda buscáis").fill("Personas con experiencia en compostaje.");
  await elena.page.getByLabel("Estado").selectOption("active");
  await elena.page.getByLabel("Región · opcional").fill("Zaragoza");
  await elena.page.getByRole("button", { name: "Agricultura y ganadería" }).click();
  await elena.page.getByRole("button", { name: "Publicar proyecto" }).click();
  await elena.page.waitForURL(/\/proyectos\/[0-9a-f-]{36}$/);
  const projectUrl = elena.page.url();
  await elena.page.getByText("Montar bancales elevados").waitFor();
  await elena.page.getByText("En marcha").first().waitFor();
  step("proyecto publicado con objetivos, estado y temática");

  await felix.page.goto(projectUrl);
  await felix.page.getByRole("button", { name: "Quiero colaborar" }).click();
  await felix.page.getByLabel("¿Cómo te gustaría colaborar?").fill("Llevo 5 años haciendo compost en casa.");
  await felix.page.getByRole("button", { name: "Enviar solicitud" }).click();
  await felix.page.getByText("Solicitud enviada").waitFor();
  await felix.page.getByLabel("Pregunta, propone u ofrece ayuda…").fill("¿Hay herramientas o hay que llevar?");
  await felix.page.getByRole("button", { name: "Enviar" }).click();
  await felix.page.getByText("¿Hay herramientas o hay que llevar?").waitFor();

  await elena.page.goto(`${APP}/notificaciones`);
  await elena.page.getByText(`Félix Ramos quiere colaborar en «${projectTitle}»`).waitFor();
  await elena.page.goto(projectUrl);
  await elena.page.getByText("Llevo 5 años haciendo compost en casa.").waitFor();
  await elena.page.getByRole("button", { name: "Aceptar" }).click();
  await elena.page.getByText("Aceptada").waitFor();
  await felix.page.goto(`${APP}/notificaciones`);
  await felix.page.getByText(`Te han aceptado en el proyecto «${projectTitle}»`).waitFor();

  await felix.page.goto(projectUrl);
  await felix.page.getByText("Participas · Salir").waitFor();
  await felix.page.getByLabel("Pregunta, propone u ofrece ayuda…").fill("Primer compostador montado 🌱");
  await felix.page.getByText("Publicar como novedad").click();
  await felix.page.getByRole("button", { name: "Enviar" }).click();
  await felix.page.getByText("Novedad del proyecto").first().waitFor();
  await elena.page.goto(`${APP}/notificaciones`);
  await elena.page.getByText(`Novedades en el proyecto «${projectTitle}»`).waitFor();
  await shot(felix.page, "proyecto-movil", true);
  step("solicitud de colaboración, aceptación, conversación y novedades con aviso");

  // 5. Ágora: publicación rápida y filtro de preguntas
  await felix.page.goto(`${APP}/agora`);
  await felix.page.getByLabel("Publicación rápida").fill(`¿Qué libro de divulgación recomendaríais para empezar? ${RUN}`);
  await felix.page.getByText("Es una pregunta").click();
  await felix.page.getByRole("button", { name: "Publicar" }).click();
  await felix.page.getByText("Publicado en el Ágora.").waitFor();
  await felix.page.getByText(`¿Qué libro de divulgación recomendaríais para empezar? ${RUN}`).waitFor();
  await felix.page.goto(`${APP}/agora?preguntas=1`);
  await felix.page.getByText(`¿Qué libro de divulgación recomendaríais para empezar? ${RUN}`).waitFor();
  await shot(felix.page, "agora-movil");
  step("Ágora: publicación rápida y filtro «Solo preguntas»");

  // 6. Explorar y búsqueda reflejan círculos y proyectos
  await elena.page.goto(`${APP}/explorar`);
  await elena.page.getByRole("heading", { name: "Círculos activos" }).waitFor();
  await elena.page.getByRole("link", { name: projectTitle }).first().waitFor();
  await elena.page.getByRole("heading", { name: "Actividad de la comunidad" }).waitFor();
  await shot(elena.page, "explorar-escritorio", true);
  await elena.page.goto(`${APP}/buscar?q=${encodeURIComponent(`Astronomía de patio ${RUN}`)}&en=circulos`);
  await elena.page.getByRole("link", { name: new RegExp(publicName) }).waitFor();
  await elena.page.goto(`${APP}/buscar?q=${encodeURIComponent("Huerto comunitario")}&en=proyectos`);
  await elena.page.getByRole("link", { name: new RegExp(projectTitle) }).waitFor();
  step("Explorar (círculos, proyectos, actividad) y búsqueda de círculos y proyectos");
});
