import request from "supertest";
import { expect, test } from "vitest";
import { openDatabase } from "../../server/db.js";
import { createApp } from "../../server/app.js";
import { config, ORIGIN, photo } from "../helpers/fixtures.js";
test("publicar, pedir, retirar y volver a publicar no reutiliza la identidad", async () => {
  const db = openDatabase();
  try {
    const app = createApp({ db, config }),
      agent = request.agent(app);
    await agent
      .post("/api/admin/session")
      .set("Origin", ORIGIN)
      .send({ password: config.adminPassword });
    const bytes = await photo();
    const publish = () =>
      agent
        .post("/api/admin/products")
        .set("Origin", ORIGIN)
        .field("name", "Artículo repetido")
        .field("category", "accesorios")
        .field("price", "49.90")
        .field("description", "Descripción")
        .attach("photo", bytes, "foto.png");
    const first = await publish();
    expect(first.status).toBe(201);
    const preview = (id) =>
      request(app)
        .post("/api/order/preview")
        .set("Origin", ORIGIN)
        .send({ items: [{ productId: id, quantity: 2 }] });
    expect((await preview(first.body.id)).body.totalCents).toBe(9980);
    await agent
      .delete("/api/admin/products/" + first.body.id)
      .set("Origin", ORIGIN);
    expect(
      (await request(app).get("/api/products/" + first.body.id)).status,
    ).toBe(404);
    expect((await preview(first.body.id)).body).toMatchObject({
      status: "empty",
      removedProductIds: [first.body.id],
      totalCents: 0,
    });
    const second = await publish();
    expect(second.body.id).not.toBe(first.body.id);
    expect((await preview(first.body.id)).body.status).toBe("empty");
  } finally {
    db.close();
  }
});
