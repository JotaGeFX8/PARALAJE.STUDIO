/**
 * Red social: publicar fotos (carrusel), seguir, feed «Siguiendo», me gusta
 * (botón y doble toque), público «solo seguidores», borradores y perfil con
 * cuadrícula de fotos. Uso: node tests/e2e/red-social.mjs
 */
import { APP, RUN, assert, devices, registerMember, runSuite, shot, step } from "./helpers.mjs";

await runSuite("Red social", async (browser) => {
  const ana = await registerMember(browser, { key: "ana", name: "Ana Lucero", topics: ["Astronomía", "Debates", "UAP"], ctx: devices["iPhone 13"] });
  const bruno = await registerMember(browser, { key: "bruno", name: "Bruno Sela", topics: ["Astronomía", "Debates", "Energía solar"], ctx: devices["iPhone 13"] });
  const carla = await registerMember(browser, { key: "carla", name: "Carla Ribera", topics: ["Debates", "Huertos", "Arqueología"], ctx: { viewport: { width: 1360, height: 900 } } });
  step("tres miembros registrados");

  // 1. Bruno sigue a Ana desde su perfil
  await bruno.page.goto(`${APP}/miembros/${ana.username}`);
  await bruno.page.getByRole("button", { name: "Seguir", exact: true }).click();
  await bruno.page.getByRole("button", { name: "Siguiendo" }).waitFor();
  step("Bruno sigue a Ana");

  // 2. Ana publica dos fotos solo para seguidores
  const png = await ana.page.screenshot({ type: "png" });
  const caption = `Primera salida a cielo oscuro ${RUN}`;
  await ana.page.goto(`${APP}/crear`);
  await ana.page.getByRole("link", { name: /Fotos/ }).first().click();
  await ana.page.waitForURL("**/crear/foto");
  await ana.page.getByLabel("Seleccionar fotos").setInputFiles([
    { name: "a.png", mimeType: "image/png", buffer: png },
    { name: "b.png", mimeType: "image/png", buffer: png },
  ]);
  await ana.page.getByRole("button", { name: "Quitar foto 2" }).waitFor();
  await ana.page.getByLabel("Pie de foto").fill(caption);
  await ana.page.getByLabel("Ámbito").selectOption({ label: "Cosmos y astronomía" });
  await ana.page.getByText("Seguidores", { exact: true }).click();
  await ana.page.getByRole("button", { name: "Publicar", exact: true }).click();
  await ana.page.waitForURL(/\/p\/[0-9a-f-]{36}$/);
  const postUrl = ana.page.url();
  await ana.page.getByText("Desliza para ver todas las fotos").waitFor();
  assert.equal(await ana.page.locator("article img[src*='/media/sign/post-images/']").count(), 2);
  await shot(ana.page, "foto-publicada");
  step("publicación de 2 fotos (carrusel) solo para seguidores");

  // 3. Bruno la ve en «Siguiendo» y le da me gusta; Carla (no sigue) no puede verla
  await bruno.page.goto(`${APP}/explorar?ver=siguiendo`);
  const card = bruno.page.locator("article", { hasText: caption }).first();
  await card.waitFor();
  await card.getByRole("button", { name: "Me gusta" }).click();
  await card.getByText("1 me gusta").waitFor();
  await bruno.page.reload();
  await bruno.page.locator("article", { hasText: caption }).first().getByRole("button", { name: "Quitar me gusta" }).waitFor();
  await shot(bruno.page, "feed-siguiendo-movil");
  step("feed «Siguiendo» con la foto y me gusta persistente");
  await carla.page.goto(postUrl);
  await carla.page.getByText("Aquí no hay nada.").waitFor();
  step("quien no sigue a Ana no puede verla");

  // 4. Aviso de me gusta y de nuevo seguidor
  await ana.page.goto(`${APP}/notificaciones`);
  await ana.page.getByText(/le ha gustado tu publicación/).first().waitFor();
  await ana.page.getByText(/empezó a seguirte/).first().waitFor();
  step("avisos de «me gusta» y de nuevo seguidor");

  // 5. Perfil: contadores y cuadrícula
  await ana.page.goto(`${APP}/perfil`);
  await ana.page.getByText("seguidores").first().waitFor();
  assert.ok(await ana.page.locator(`a[href="${new URL(postUrl).pathname}"]`).count(), "foto en la cuadrícula del perfil");
  await ana.page.goto(`${APP}/perfil/seguidores`);
  await ana.page.getByRole("link", { name: "Bruno Sela" }).first().waitFor();
  step("perfil con contadores, cuadrícula de fotos y lista de seguidores");

  // 6. Borrador: solo lo ve su autora hasta publicarlo
  await carla.page.goto(`${APP}/crear/foto`);
  await carla.page.getByLabel("Seleccionar fotos").setInputFiles({ name: "c.png", mimeType: "image/png", buffer: png });
  await carla.page.getByRole("button", { name: "Quitar foto 1" }).waitFor();
  await carla.page.getByLabel("Pie de foto").fill(`Borrador de Carla ${RUN}`);
  await carla.page.getByRole("button", { name: "Guardar borrador" }).click();
  await carla.page.waitForURL("**/crear?borrador=1");
  await carla.page.getByText("Borrador guardado.").waitFor();
  await bruno.page.goto(`${APP}/explorar`);
  assert.equal(await bruno.page.getByText(`Borrador de Carla ${RUN}`).count(), 0);
  await carla.page.getByRole("button", { name: "Publicar" }).first().click();
  await carla.page.waitForTimeout(800);
  await bruno.page.goto(`${APP}/explorar`);
  await bruno.page.getByText(`Borrador de Carla ${RUN}`).first().waitFor();
  step("borrador privado y publicado después");
});
