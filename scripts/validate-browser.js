// Validación aislada: no modifica el catálogo local ni envía mensajes reales.
import { chromium, expect } from "@playwright/test";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import sharp from "sharp";
import { openDatabase } from "../server/db.js";
import { createApp } from "../server/app.js";
import { addProduct } from "../server/products.js";
import { config as fixtureConfig } from "../tests/helpers/fixtures.js";

const temp = mkdtempSync(join(tmpdir(), "chaskas-browser-"));
const outputs = resolve("docs/validacion");
mkdirSync(outputs, { recursive: true });
const origin = "http://127.0.0.1:4173";
const config = { ...fixtureConfig, appOrigin: origin };
const dbPath = join(temp, "validation.sqlite");
const db = openDatabase(dbPath);
let clockOffset = 0;
const server = createApp({
  db,
  config,
  clock: () => Date.now() + clockOffset,
}).listen(4173, "127.0.0.1");
await new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1366, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("requestfailed", (req) => {
  if (req.url().startsWith(origin))
    console.log(
      "Solicitud de prueba fallida:",
      req.method(),
      new URL(req.url()).pathname,
      req.failure()?.errorText,
    );
});
const checks = [];
const products = [
  ["iPhone 15 Pro 256 GB", "celulares", "4299.00"],
  ["Samsung Galaxy S23", "celulares", "2899.00"],
  ["Xiaomi Redmi Note 12", "celulares", "749.00"],
  ["MacBook Air M1", "laptops", "3599.00"],
  ["Lenovo ThinkPad X1 Carbon", "laptops", "5199.00"],
  ["SSD NVMe 1 TB", "accesorios", "329.00"],
];
// Fixtures vectoriales sintéticos: no son fotos de productos comerciales.
const image = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><defs><radialGradient id="g"><stop stop-color="#26405b"/><stop offset="1" stop-color="#10151b"/></radialGradient><linearGradient id="s" x2="1" y2="1"><stop stop-color="#adc6ff"/><stop offset="1" stop-color="#263751"/></linearGradient></defs><rect width="500" height="500" fill="url(#g)"/><rect x="156" y="64" width="188" height="340" rx="27" fill="url(#s)"/><rect x="165" y="73" width="170" height="320" rx="20" fill="#0e1825"/><rect x="207" y="82" width="86" height="13" rx="6" fill="#050b12"/><circle cx="250" cy="214" r="55" fill="#4d8eff"/><path d="m230 214 15 15 28-32" fill="none" stroke="#e5efff" stroke-width="8"/><text x="250" y="315" fill="#b7c8e4" text-anchor="middle" font-family="sans-serif" font-size="19">CHASKA'S STORE</text><text x="250" y="460" fill="#a0b2ca" text-anchor="middle" font-family="sans-serif" font-size="14">PRODUCTO DE PRUEBA</text></svg>`,
  ),
)
  .png()
  .toBuffer();
const screenshot = async (name) => {
  await page.screenshot({ path: join(outputs, name), fullPage: true });
};
const noOverflow = async (width) =>
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(width);
try {
  await page.goto(origin);
  await expect(page.getByText(/El catálogo está vacío/)).toBeVisible();
  checks.push("Catálogo inicial vacío; sin datos comerciales precargados.");
  await page.goto(origin + "/admin");
  await expect(page.getByLabel("Clave de administrador")).toBeVisible();
  await screenshot("04-acceso-administrador.png");
  await page.getByLabel("Clave de administrador").fill(config.adminPassword);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Panel de administración" }),
  ).toBeVisible();
  const ids = new Map();
  let maxPublishMs = 0;
  for (const [name, category, price] of products) {
    await page
      .getByRole("link", { name: "Agregar producto", exact: true })
      .click();
    if (!ids.size) {
      await screenshot("06-agregar-producto.png");
      await page.getByRole("button", { name: "Guardar producto" }).click();
      await expect(
        page.getByText("Escribe el nombre del producto."),
      ).toBeVisible();
    }
    const started = performance.now();
    await page.getByLabel("Nombre", { exact: true }).fill(name);
    await page.getByLabel("Categoría", { exact: true }).selectOption(category);
    await page.getByLabel("Precio (S/)", { exact: true }).fill(price);
    await page
      .getByLabel("Descripción", { exact: true })
      .fill(
        "Producto sintético para validar el recorrido, la descripción completa y el diseño.",
      );
    await page
      .getByLabel(/Especificaciones/)
      .fill("Memoria: 256 GB\nConectividad: Wi-Fi");
    await page.getByLabel("Foto", { exact: true }).setInputFiles({
      name: "fixture.png",
      mimeType: "image/png",
      buffer: image,
    });
    await page.getByRole("button", { name: "Guardar producto" }).click();
    await expect(
      page.getByRole("heading", { name: "Panel de administración" }),
    ).toBeVisible();
    await expect(
      page.getByText("Producto guardado correctamente.", { exact: true }),
    ).toBeVisible();
    maxPublishMs = Math.max(maxPublishMs, performance.now() - started);
    const stored = db.prepare("SELECT id FROM products WHERE name=?").get(name);
    expect(stored).toBeTruthy();
    ids.set(name, stored.id);
  }
  await screenshot("05-panel-administracion.png");
  await noOverflow(1366);
  checks.push(
    `Seis altas por formulario; confirmación visible; máximo ${Math.round(maxPublishMs)} ms por alta con datos preparados.`,
  );
  await page.goto(origin + "/admin/productos/nuevo");
  await page.getByRole("link", { name: "Cancelar", exact: true }).click();
  expect(db.prepare("SELECT count(*) AS n FROM products").get().n).toBe(6);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin);
  await expect(page.locator(".product-card")).toHaveCount(6);
  await noOverflow(390);
  await screenshot("01-catalogo-movil.png");
  const searchStarted = performance.now();
  await page.getByRole("searchbox").fill("macbook");
  await page.getByRole("button", { name: "Laptops", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("link", { name: "MacBook Air M1", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "MacBook Air M1", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Volver", exact: true }).click();
  await expect(page.getByRole("searchbox")).toHaveValue("macbook");
  checks.push(
    `Búsqueda/filtro/detalle/regreso: ${Math.round(performance.now() - searchStarted)} ms; filtros conservados.`,
  );
  await page.goto(origin + "/productos/" + ids.get(products[0][0]));
  await expect(
    page.getByRole("heading", { name: products[0][0], exact: true }),
  ).toBeVisible();
  await screenshot("02-detalle-producto-movil.png");
  await page
    .getByRole("button", { name: "Agregar al pedido", exact: true })
    .click();
  await expect(page.getByText(/agregado al pedido/)).toBeVisible();
  await page.goto(origin + "/productos/" + ids.get("SSD NVMe 1 TB"));
  await page
    .getByRole("button", { name: "Agregar al pedido", exact: true })
    .click();
  await expect(page.locator(".order-link b")).toHaveText("2");
  await page
    .getByRole("button", { name: "Agregar al pedido", exact: true })
    .click();
  await expect(page.locator(".order-link b")).toHaveText("3");
  await page.goto(origin + "/mi-pedido");
  await expect(page.locator(".order-summary b")).toHaveText("S/ 4,957.00");
  await expect(
    page.getByRole("button", { name: "Enviar pedido por WhatsApp" }),
  ).toBeEnabled();
  await noOverflow(390);
  await screenshot("03-mi-pedido-movil.png");
  await page.getByRole("button", { name: "Disminuir SSD NVMe 1 TB" }).click();
  await expect(page.locator(".order-summary b")).toHaveText("S/ 4,628.00");
  await page.getByRole("button", { name: "Aumentar SSD NVMe 1 TB" }).click();
  await page.reload();
  await expect(page.locator(".order-summary b")).toHaveText("S/ 4,957.00");
  let whatsapp;
  await page.route("https://wa.me/**", (route) => {
    whatsapp = route.request().url();
    return route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: "<h1>Enlace preparado (sin envío real)</h1>",
    });
  });
  await page
    .getByRole("button", { name: "Enviar pedido por WhatsApp" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Enlace preparado (sin envío real)" }),
  ).toBeVisible();
  expect(new URL(whatsapp).searchParams.get("text")).toContain("S/ 4,957.00");
  await page.goto(origin + "/mi-pedido");
  await expect(page.locator(".order-summary b")).toHaveText("S/ 4,957.00");
  checks.push(
    "Pedido exacto, controles, recarga y retorno conservan selección; enlace capturado sin envío real.",
  );
  for (const width of [360, 390, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/productos/" + ids.get(products[0][0]),
      "/mi-pedido",
    ]) {
      await page.goto(origin + path);
      await page.waitForLoadState("networkidle");
      await noOverflow(width);
    }
  }
  // Conservar una tarjeta antigua mientras una petición autorizada retira el artículo.
  await page.goto(origin);
  await expect(page.locator(".product-card")).toHaveCount(6);
  await context.request.delete(
    origin + "/api/admin/products/" + ids.get("SSD NVMe 1 TB"),
    { headers: { Origin: origin } },
  );
  await page
    .locator(".product-card")
    .filter({
      has: page.getByRole("link", { name: "SSD NVMe 1 TB", exact: true }),
    })
    .getByRole("button")
    .click();
  await expect(
    page.getByText("Producto no disponible.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".order-link b")).toHaveText("3");
  await page.goto(origin + "/mi-pedido");
  await expect(page.locator(".order-summary b")).toHaveText("S/ 4,299.00");
  await expect(
    page.getByText(/Ya no disponibles: SSD NVMe 1 TB/).first(),
  ).toBeVisible();
  await context.request.delete(
    origin + "/api/admin/products/" + ids.get(products[0][0]),
    { headers: { Origin: origin } },
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Tu pedido está vacío" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Ya no disponibles: iPhone/).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enviar pedido por WhatsApp" }),
  ).toBeDisabled();
  checks.push(
    "Tarjeta antigua rechazada sin incremento; retirada parcial y total conservan aviso con nombre.",
  );
  await page.goto(origin + "/admin");
  await page.getByRole("button", { name: "Quitar Samsung Galaxy S23" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page
      .getByRole("button", { name: "Quitar Samsung Galaxy S23" })
      .evaluate((el) => el === document.activeElement),
  ).toBe(true);
  await page.getByRole("button", { name: "Quitar Samsung Galaxy S23" }).click();
  await page.getByRole("button", { name: "Confirmar retirada" }).click();
  await expect(page.getByText("Producto retirado del catálogo.")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByLabel("Clave de administrador")).toBeVisible();
  await page.goto(origin + "/admin");
  await expect(page.getByLabel("Clave de administrador")).toBeVisible();
  await page.goto(origin);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Ir al contenido" }),
  ).toBeFocused();
  checks.push(
    "Confirmación accesible, Escape cancela y devuelve foco; retirada real, logout y protección posterior.",
  );
  expect(errors).toEqual([]);
  checks.push(
    "Sin errores JavaScript de página; sin desbordamiento en 360, 390 y 1366 píxeles.",
  );
  // Persistencia del pedido tras cerrar y reabrir el mismo perfil de navegador.
  const profile = join(temp, "browser-profile");
  let persistent = await chromium.launchPersistentContext(profile, {
    channel: "msedge",
    headless: true,
  });
  let persistentPage = await persistent.newPage();
  await persistentPage.goto(origin + "/productos/" + ids.get("MacBook Air M1"));
  await persistentPage
    .getByRole("button", { name: "Agregar al pedido", exact: true })
    .click();
  await expect(persistentPage.locator(".order-link b")).toHaveText("1");
  await persistentPage.goto(origin + "/admin/acceso");
  await persistentPage
    .getByLabel("Clave de administrador")
    .fill(config.adminPassword);
  await persistentPage
    .getByRole("button", { name: "Ingresar", exact: true })
    .click();
  await expect(
    persistentPage.getByRole("heading", { name: "Panel de administración" }),
  ).toBeVisible();
  const savedCookies = await persistent.cookies();
  expect(savedCookies.find((c) => c.name === "chaskas_admin").expires).toBe(-1);
  await persistent.close();
  persistent = await chromium.launchPersistentContext(profile, {
    channel: "msedge",
    headless: true,
  });
  try {
    persistentPage = await persistent.newPage();
    await persistentPage.goto(origin + "/mi-pedido");
    await expect(persistentPage.locator(".order-link b")).toHaveText("1");
    // Restaurar explícitamente la cookie reproduce la política aceptada sin depender de preferencias de Edge.
    await persistent.addCookies(savedCookies);
    await persistentPage.goto(origin + "/admin");
    await expect(
      persistentPage.getByRole("heading", { name: "Panel de administración" }),
    ).toBeVisible();
    clockOffset = 28800000;
    await persistentPage.reload();
    await expect(
      persistentPage.getByLabel("Clave de administrador"),
    ).toBeVisible();
  } finally {
    clockOffset = 0;
    await persistent.close();
  }
  checks.push(
    "Mismo perfil cerrado/reabierto conserva pedido; cookie de sesión restaurada admite acceso antes del límite y es rechazada a las ocho horas.",
  );
  // Volumen de referencia, sin convertirlo en un límite comercial.
  for (let i = 3; i < 200; i++)
    addProduct(
      db,
      {
        name: `Equipo de prueba ${i}`,
        category: "accesorios",
        priceCents: 4990,
        description: "Fixture de rendimiento.",
        specifications: "",
      },
      { bytes: image, mime: "image/png" },
      Date.now() + i,
    );
  const started = performance.now();
  const reads = await Promise.all(
    Array.from({ length: 10 }, () =>
      context.request.get(origin + "/api/products"),
    ),
  );
  for (const read of reads) {
    const body = await read.json();
    expect(body.products).toHaveLength(200);
    expect(JSON.stringify(body)).not.toContain("image_bytes");
  }
  const requestMs = Math.round(performance.now() - started);
  const visibleStarted = performance.now();
  await page.goto(origin);
  await expect(page.locator(".product-card")).toHaveCount(200);
  const visibleMs = Math.round(performance.now() - visibleStarted);
  expect(visibleMs).toBeLessThan(2000);
  checks.push(
    `Doscientos productos y diez lecturas concurrentes: ${requestMs} ms; listado utilizable en ${visibleMs} ms, JSON sin BLOB.`,
  );
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  db.close();
  copyFileSync(dbPath, join(temp, "backup.sqlite"));
  const restored = openDatabase(join(temp, "backup.sqlite"));
  expect(restored.prepare("SELECT count(*) AS n FROM products").get().n).toBe(
    200,
  );
  expect(
    restored
      .prepare("SELECT length(image_bytes) AS n FROM products LIMIT 1")
      .get().n,
  ).toBeGreaterThan(0);
  restored.close();
  checks.push(
    "Reapertura y restauración de copia en DB aislada conserva catálogo y fotos.",
  );
  writeFileSync(
    join(outputs, "browser-results.json"),
    JSON.stringify(
      {
        date: "2026-10-26",
        browser: "Microsoft Edge headless",
        syntheticData: true,
        whatsappSent: false,
        checks,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally {
  await browser.close().catch(() => {});
  if (server.listening) await new Promise((resolve) => server.close(resolve));
  try {
    db.close();
  } catch {
    /* Ya cerrada. */
  }
  if (!resolve(temp).startsWith(resolve(tmpdir()) + sep))
    throw new Error("Directorio temporal fuera del destino permitido.");
  rmSync(temp, { recursive: true, force: true });
}
