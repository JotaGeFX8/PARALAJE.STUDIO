/**
 * Biblioteca: recomendar un libro, evitar fichas duplicadas, recomendar uno
 * existente, estanterías privadas, «Me ha sido útil», perfil y búsqueda.
 * Uso: node tests/e2e/libros.mjs
 */
import { APP, RUN, assert, devices, registerMember, runSuite, shot, step } from "./helpers.mjs";

await runSuite("Biblioteca", async (browser) => {
  const ana = await registerMember(browser, {
    key: "ana",
    name: "Ana Lucero",
    topics: ["Astronomía", "Física cuántica", "Debates"],
    ctx: { viewport: { width: 1360, height: 900 } },
  });
  const bruno = await registerMember(browser, {
    key: "bruno",
    name: "Bruno Sela",
    topics: ["Astronomía", "Energía solar", "Debates"],
    ctx: devices["iPhone 13"],
  });
  step("dos miembros registrados");

  // 1. Ana recomienda un libro nuevo
  const title = `Cosmos ${RUN}`;
  await ana.page.goto(`${APP}/libros/recomendar`);
  await ana.page.getByLabel("Título").fill(title);
  await ana.page.getByLabel(/^Autoría/).fill("Carl Sagan");
  await ana.page.getByLabel(/^Año/).fill("1980");
  await ana.page.getByLabel("Área").selectOption({ label: "Cosmos y astronomía" });
  await ana.page.getByLabel("Buscar tema para Temas").fill("Astronomía");
  await ana.page.getByRole("button", { name: "Astronomía", exact: true }).click();
  await ana.page.getByRole("button", { name: "Recomendar libro" }).click();
  await ana.page.getByText("Cuenta por qué lo recomiendas (mín. 20 caracteres).").waitFor();
  await ana.page.getByLabel("¿Por qué lo recomiendas?").fill("Un clásico que cambia la forma de mirar el cielo. Ideal para empezar.");
  await ana.page.locator('label[title="5 de 5"]').click();
  await ana.page.getByRole("button", { name: "Recomendar libro" }).click();
  await ana.page.waitForURL(/\/libros\/(?!recomendar)[a-z0-9-]+$/);
  const bookUrl = ana.page.url();
  await ana.page.getByRole("heading", { name: title }).waitFor();
  await ana.page.getByText("1 recomendación").first().waitFor();
  await ana.page.getByRole("link", { name: "Astronomía" }).first().waitFor();
  await shot(ana.page, "libro-ficha");
  step("libro recomendado: ficha con área, tema, nivel y valoración (validación incluida)");

  // 2. Bruno intenta crearlo de nuevo: se le propone la ficha existente
  await bruno.page.goto(`${APP}/libros/recomendar`);
  await bruno.page.getByLabel("Título").fill(`cosmos ${RUN}`.toUpperCase());
  await bruno.page.getByText("¿Es alguno de estos?").waitFor();
  await bruno.page.getByRole("link", { name: title }).click();
  await bruno.page.waitForURL(`${bookUrl}#recomendar`);
  await bruno.page.getByLabel("¿Por qué lo recomiendas?").fill("Lo leí con 15 años y me hizo estudiar física. Los capítulos sobre Venus son geniales.");
  await bruno.page.getByText("Intermedio", { exact: true }).click();
  await bruno.page.locator('label[title="4 de 5"]').click();
  await bruno.page.getByRole("button", { name: "Publicar recomendación" }).click();
  await bruno.page.getByText("Recomendación guardada.").waitFor();
  await bruno.page.getByText("2 recomendaciones").first().waitFor();
  step("sin duplicados: el buscador propone la ficha existente y se añade la segunda recomendación");

  // 3. Estantería privada y totales
  await bruno.page.getByRole("button", { name: "Quiero leerlo" }).click();
  await bruno.page.waitForTimeout(500);
  await bruno.page.goto(`${APP}/libros?ver=estanteria`);
  await bruno.page.getByRole("link", { name: title }).first().waitFor();
  await ana.page.reload();
  await ana.page.getByText("1 quieren leerlo").first().waitFor();
  step("estantería personal (privada) y totales en la ficha");

  // 4. «Me ha sido útil»: no a la propia, sí a la ajena
  const anaRec = ana.page.locator("li[id^='r-']", { hasText: "Un clásico que cambia" });
  assert.equal(await anaRec.getByRole("button", { name: /Me ha sido útil/ }).isDisabled(), true);
  const brunoRec = ana.page.locator("li[id^='r-']", { hasText: "Lo leí con 15 años" });
  await brunoRec.getByRole("button", { name: /Me ha sido útil · 0/ }).click();
  await brunoRec.getByRole("button", { name: /Me ha sido útil · 1/ }).waitFor();
  await ana.page.reload();
  await ana.page.locator("li[id^='r-']", { hasText: "Lo leí con 15 años" }).getByRole("button", { name: /Me ha sido útil · 1/ }).waitFor();
  step("«Me ha sido útil» persistente y bloqueado en la recomendación propia");

  // 5. Ana ya no puede corregir la ficha (otra persona la ha recomendado)
  assert.equal(await ana.page.getByRole("link", { name: "Corregir la ficha" }).count(), 0);
  await ana.page.goto(`${bookUrl}/editar`);
  await ana.page.waitForURL(bookUrl);
  step("la ficha queda protegida cuando otras personas la han recomendado");

  // 6. Perfil, listado filtrado y búsqueda
  await bruno.page.goto(`${APP}/miembros/${ana.username}`);
  await bruno.page.getByText("Libros que recomienda").waitFor();
  await bruno.page.getByRole("link", { name: title }).first().waitFor();
  await bruno.page.goto(`${APP}/libros?area=cosmos&nivel=intermediate`);
  await bruno.page.getByRole("link", { name: title }).first().waitFor();
  await bruno.page.goto(`${APP}/libros?nivel=advanced`);
  assert.equal(await bruno.page.getByRole("link", { name: title }).count(), 0);
  await bruno.page.goto(`${APP}/buscar?q=${encodeURIComponent("sagan")}&en=libros`);
  await bruno.page.getByRole("link", { name: title }).first().waitFor();
  await shot(bruno.page, "libros-busqueda-movil");
  step("perfil («Libros que recomienda»), filtros por área y nivel, y búsqueda");

  // 7. Bruno retira su recomendación
  await bruno.page.goto(bookUrl);
  await bruno.page.getByRole("button", { name: "Retirar mi recomendación" }).click();
  await bruno.page.getByText("1 recomendación").first().waitFor();
  step("recomendación propia retirada");
});
