import request from "supertest";
import { expect, test } from "vitest";
import { openDatabase } from "../../server/db.js";
import { createApp } from "../../server/app.js";
import { config, ORIGIN, photo } from "../helpers/fixtures.js";
async function login(app) {
  const agent = request.agent(app);
  await agent
    .post("/api/admin/session")
    .set("Origin", ORIGIN)
    .send({ password: config.adminPassword });
  return agent;
}
const fields = {
  name: "  Teléfono de prueba  ",
  category: "celulares",
  price: "4299.00",
  description: "Descripción completa.",
  specifications: "Memoria: 256 GB\nCámara: 48 MP",
};
function upload(agent, data, buffer) {
  let req = agent.post("/api/admin/products").set("Origin", ORIGIN);
  for (const [key, value] of Object.entries(data)) req = req.field(key, value);
  return buffer ? req.attach("photo", buffer, "foto.png") : req;
}
test("publica una vez, lista, consulta y retira producto junto con foto", async () => {
  const db = openDatabase();
  try {
    const app = createApp({ db, config }),
      agent = await login(app),
      buffer = await photo();
    const r = await upload(agent, fields, buffer);
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({
      name: "Teléfono de prueba",
      priceCents: 429900,
      specifications: fields.specifications,
    });
    expect(r.headers.location).toBe("/api/products/" + r.body.id);
    expect((await agent.get("/api/admin/products")).body.products).toHaveLength(
      1,
    );
    expect((await request(app).get("/api/products/" + r.body.id)).status).toBe(
      200,
    );
    expect(
      (await upload(agent, { ...fields, name: "Teléfono de prueba" }, buffer))
        .status,
    ).toBe(201);
    expect(
      (
        await agent
          .delete("/api/admin/products/" + r.body.id)
          .set("Origin", ORIGIN)
      ).status,
    ).toBe(204);
    expect((await request(app).get("/api/products/" + r.body.id)).status).toBe(
      404,
    );
    expect((await request(app).get(r.body.imageUrl)).status).toBe(404);
    expect(
      (
        await agent
          .delete("/api/admin/products/" + r.body.id)
          .set("Origin", ORIGIN)
      ).status,
    ).toBe(404);
  } finally {
    db.close();
  }
});
test("protege GET y mutaciones antes de procesar foto y tras caducidad", async () => {
  const db = openDatabase();
  let now = 0;
  try {
    const app = createApp({ db, config, clock: () => now });
    expect((await request(app).get("/api/admin/products")).status).toBe(401);
    expect(
      (await upload(request(app), fields, Buffer.alloc(5000001))).status,
    ).toBe(401);
    const agent = await login(app);
    now = 28800000;
    expect((await upload(agent, fields, await photo())).status).toBe(401);
    expect(db.prepare("SELECT count(*) AS n FROM products").get().n).toBe(0);
  } finally {
    db.close();
  }
});
test("campos, formatos y límites inválidos no publican parcialmente", async () => {
  const db = openDatabase();
  try {
    const app = createApp({ db, config }),
      agent = await login(app),
      buffer = await photo();
    for (const patch of [
      { name: " " },
      { description: " " },
      { category: "otra" },
      { price: "0" },
      { price: "-1" },
      { price: "1.001" },
      { price: "1e3" },
      { name: "x".repeat(501) },
      { description: "x".repeat(20001) },
      { specifications: "x".repeat(20001) },
    ]) {
      const r = await upload(agent, { ...fields, ...patch }, buffer);
      expect(r.status).toBe(400);
      expect(r.body.error.fieldErrors).toBeTruthy();
    }
    expect((await upload(agent, fields)).status).toBe(415);
    expect(
      (await upload(agent, fields, Buffer.from("foto falsa"))).status,
    ).toBe(415);
    expect((await upload(agent, fields, Buffer.alloc(5000001))).status).toBe(
      413,
    );
    const multiple = await upload(agent, fields, buffer).attach(
      "photo",
      buffer,
      "otra.png",
    );
    expect(multiple.status).toBe(400);
    expect(db.prepare("SELECT count(*) AS n FROM products").get().n).toBe(0);
  } finally {
    db.close();
  }
});
