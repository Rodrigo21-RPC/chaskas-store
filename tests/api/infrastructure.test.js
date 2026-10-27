import express from "express";
import request from "supertest";
import { expect, test } from "vitest";
import { requireOrigin } from "../../server/origin.js";
import { createApp } from "../../server/app.js";
import { config, ORIGIN } from "../helpers/fixtures.js";
test("acepta origen exacto o Referer válido y rechaza ajeno/ausente", async () => {
  const app = express();
  app.use(requireOrigin(ORIGIN));
  app.post("/change", (req, res) => res.sendStatus(204));
  expect(
    (await request(app).post("/change").set("Origin", ORIGIN)).status,
  ).toBe(204);
  expect(
    (
      await request(app)
        .post("/change")
        .set("Referer", ORIGIN + "/admin")
    ).status,
  ).toBe(204);
  expect(
    (
      await request(app)
        .post("/change")
        .set("Origin", "http://evil.test")
        .set("Referer", ORIGIN)
    ).status,
  ).toBe(403);
  expect((await request(app).post("/change")).status).toBe(403);
});
test("API desconocida responde JSON español sin HTML", async () => {
  const res = await request(createApp({ config })).get("/api/unknown");
  expect(res.status).toBe(404);
  expect(res.body.error.message).toMatch(/encontrad|disponible/);
  expect(res.headers["cache-control"]).toBe("no-store");
});
test("cuerpo JSON excesivo no filtra stack ni clave", async () => {
  const res = await request(createApp({ config }))
    .post("/api/unknown")
    .set("Origin", ORIGIN)
    .send({ big: "x".repeat(1100000) });
  expect(res.status).toBe(413);
  expect(res.body.error.message).toBeTruthy();
  expect(JSON.stringify(res.body)).not.toContain(config.adminPassword);
});
