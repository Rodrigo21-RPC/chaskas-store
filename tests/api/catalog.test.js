import request from "supertest";
import { expect, test } from "vitest";
import { openDatabase } from "../../server/db.js";
import { createApp } from "../../server/app.js";
import { config, seed } from "../helpers/fixtures.js";
test("catálogo público vacío y configuración comercial sin secretos", async () => {
  const db = openDatabase();
  try {
    const app = createApp({ db, config });
    const list = await request(app).get("/api/products");
    expect(list.status).toBe(200);
    expect(list.body).toEqual({ products: [] });
    const res = await request(app).get("/api/store");
    expect(res.body).toEqual({ name: "Chaska's Store", whatsappEnabled: true });
    expect(JSON.stringify(res.body)).not.toContain(config.adminPassword);
  } finally {
    db.close();
  }
});
test("lista resúmenes ordenados sin BLOB, detalle completo y foto segura", async () => {
  const db = openDatabase();
  try {
    const first = await seed(db, { createdAt: 1000 });
    const second = await seed(db, {
      createdAt: 2000,
      name: "Laptop",
      category: "laptops",
    });
    const app = createApp({ db, config });
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.products.map((p) => p.id)).toEqual([second.id, first.id]);
    expect(Object.keys(res.body.products[0]).sort()).toEqual([
      "category",
      "id",
      "imageUrl",
      "name",
      "priceCents",
    ]);
    const detail = await request(app).get("/api/products/" + first.id);
    expect(detail.body.description).toBe(first.description);
    expect(detail.body.specifications).toBe(first.specifications);
    const image = await request(app).get(first.imageUrl);
    expect(image.status).toBe(200);
    expect(image.headers["content-type"]).toContain("image/png");
    expect(image.headers["x-content-type-options"]).toBe("nosniff");
    db.prepare("DELETE FROM products WHERE id=?").run(first.id);
    expect((await request(app).get("/api/products/" + first.id)).status).toBe(
      404,
    );
    expect((await request(app).get(first.imageUrl)).status).toBe(404);
  } finally {
    db.close();
  }
});
