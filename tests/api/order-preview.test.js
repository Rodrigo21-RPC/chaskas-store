import request from "supertest";
import { expect, test } from "vitest";
import { openDatabase } from "../../server/db.js";
import { createApp } from "../../server/app.js";
import { config, ORIGIN, seed } from "../helpers/fixtures.js";
test("resumen válido recalcula con DB y prepara texto exacto", async () => {
  const db = openDatabase();
  try {
    const a = await seed(db, { name: "Teléfono Ágil & Pro" }),
      b = await seed(db, { name: "SSD", priceCents: 32900 });
    const app = createApp({ db, config });
    const r = await request(app)
      .post("/api/order/preview")
      .set("Origin", ORIGIN)
      .send({
        items: [
          { productId: a.id, quantity: 1 },
          { productId: b.id, quantity: 2 },
        ],
      });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      status: "ready",
      totalUnits: 3,
      totalCents: 495700,
      removedProductIds: [],
    });
    const url = new URL(r.body.whatsappUrl);
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe("/51999999999");
    expect(url.searchParams.get("text")).toContain("Teléfono Ágil & Pro");
    expect(url.searchParams.get("text")).toContain("S/ 4,957.00");
  } finally {
    db.close();
  }
});
test("retirada parcial y total informa todos los IDs incluso en empty", async () => {
  const db = openDatabase();
  try {
    const a = await seed(db),
      b = await seed(db);
    const app = createApp({ db, config });
    const preview = (items) =>
      request(app)
        .post("/api/order/preview")
        .set("Origin", ORIGIN)
        .send({ items });
    db.prepare("DELETE FROM products WHERE id=?").run(a.id);
    let r = await preview([
      { productId: a.id, quantity: 1 },
      { productId: b.id, quantity: 1 },
    ]);
    expect(r.body).toMatchObject({
      status: "changed",
      removedProductIds: [a.id],
      whatsappUrl: null,
    });
    r = await preview([{ productId: a.id, quantity: 1 }]);
    expect(r.body).toEqual({
      status: "empty",
      items: [],
      removedProductIds: [a.id],
      totalUnits: 0,
      totalCents: 0,
      whatsappUrl: null,
    });
    db.prepare("DELETE FROM products").run();
    r = await preview([
      { productId: a.id, quantity: 1 },
      { productId: b.id, quantity: 1 },
    ]);
    expect(r.body.removedProductIds).toEqual([a.id, b.id]);
    expect(r.body.status).toBe("empty");
  } finally {
    db.close();
  }
});
test("rechaza duplicados/cantidades/precios enviados y destino ausente no genera enlace", async () => {
  const db = openDatabase();
  try {
    const a = await seed(db);
    const app = createApp({ db, config: { ...config, whatsappNumber: null } });
    for (const items of [
      [{ productId: a.id, quantity: 0 }],
      [
        { productId: a.id, quantity: 1 },
        { productId: a.id, quantity: 1 },
      ],
      [{ productId: a.id, quantity: 1, priceCents: 1 }],
    ])
      expect(
        (
          await request(app)
            .post("/api/order/preview")
            .set("Origin", ORIGIN)
            .send({ items })
        ).status,
      ).toBe(400);
    const r = await request(app)
      .post("/api/order/preview")
      .set("Origin", ORIGIN)
      .send({ items: [{ productId: a.id, quantity: 1 }] });
    expect(r.body.status).toBe("unavailable");
    expect(r.body.whatsappUrl).toBeNull();
  } finally {
    db.close();
  }
});
test("error de DB no devuelve enlace ni éxito", async () => {
  const db = openDatabase();
  const a = await seed(db);
  const app = createApp({ db, config });
  db.close();
  const r = await request(app)
    .post("/api/order/preview")
    .set("Origin", ORIGIN)
    .send({ items: [{ productId: a.id, quantity: 1 }] });
  expect(r.status).toBe(503);
  expect(r.body).not.toHaveProperty("whatsappUrl");
});
