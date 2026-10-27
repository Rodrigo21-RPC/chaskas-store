import request from "supertest";
import { expect, test } from "vitest";
import { openDatabase } from "../../server/db.js";
import { createApp } from "../../server/app.js";
import { config, ORIGIN } from "../helpers/fixtures.js";
test("acceso, cookie de sesión, expiración absoluta y revocación real", async () => {
  const db = openDatabase();
  let now = 1000;
  try {
    const app = createApp({ db, config, clock: () => now });
    const agent = request.agent(app);
    const login = () =>
      agent
        .post("/api/admin/session")
        .set("Origin", ORIGIN)
        .send({ password: config.adminPassword });
    expect((await agent.get("/api/admin/session")).status).toBe(401);
    expect(
      (
        await agent
          .post("/api/admin/session")
          .set("Origin", ORIGIN)
          .send({ password: "" })
      ).status,
    ).toBe(400);
    expect(
      (
        await agent
          .post("/api/admin/session")
          .set("Origin", ORIGIN)
          .send({ password: "incorrecta" })
      ).status,
    ).toBe(401);
    const first = await login();
    expect(first.status).toBe(200);
    expect(first.body.expiresAt).toBe(28801000);
    const cookie = first.headers["set-cookie"][0];
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/api/admin");
    expect(cookie).not.toMatch(/Max-Age|Expires/);
    const old = cookie.split(";")[0];
    await login();
    expect(
      (await request(app).get("/api/admin/session").set("Cookie", old)).status,
    ).toBe(401);
    now = 28800999;
    expect((await agent.get("/api/admin/session")).status).toBe(200);
    now = 28801000;
    expect((await agent.get("/api/admin/session")).status).toBe(401);
    await login();
    const token = (await login()).headers["set-cookie"][0].split(";")[0];
    expect(
      (await agent.delete("/api/admin/session").set("Origin", ORIGIN)).status,
    ).toBe(204);
    expect(
      (await request(app).get("/api/admin/session").set("Cookie", token))
        .status,
    ).toBe(401);
    expect(
      (await agent.delete("/api/admin/session").set("Origin", ORIGIN)).status,
    ).toBe(204);
    const rows = db.prepare("SELECT token_hash FROM admin_sessions").all();
    expect(JSON.stringify(rows)).not.toContain(config.adminPassword);
  } finally {
    db.close();
  }
});
test("cinco fallos por IP y ventana de quince minutos", async () => {
  const db = openDatabase();
  let now = 0;
  try {
    const app = createApp({ db, config, clock: () => now });
    const fail = () =>
      request(app)
        .post("/api/admin/session")
        .set("Origin", ORIGIN)
        .send({ password: "incorrecta" });
    for (let i = 0; i < 5; i++) expect((await fail()).status).toBe(401);
    const blocked = await fail();
    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toBeTruthy();
    now = 900001;
    expect((await fail()).status).toBe(401);
    expect(
      (
        await request(app)
          .post("/api/admin/session")
          .set("Origin", "https://otro.test")
          .send({ password: config.adminPassword })
      ).status,
    ).toBe(403);
  } finally {
    db.close();
  }
});
test("cookie productiva usa Secure sin publicar token en JSON", async () => {
  const db = openDatabase();
  try {
    const app = createApp({ db, config: { ...config, production: true } });
    const r = await request(app)
      .post("/api/admin/session")
      .set("Origin", ORIGIN)
      .send({ password: config.adminPassword });
    expect(r.status).toBe(200);
    expect(r.headers["set-cookie"][0]).toContain("Secure");
    expect(Object.keys(r.body).sort()).toEqual(["authenticated", "expiresAt"]);
  } finally {
    db.close();
  }
});
test("proxy conocido conserva límite por IP sin bloquear a otro visitante", async () => {
  const db = openDatabase();
  try {
    const app = createApp({
      db,
      config: { ...config, trustedProxy: "127.0.0.1" },
    });
    for (let i = 0; i < 5; i++)
      expect(
        (
          await request(app)
            .post("/api/admin/session")
            .set("Origin", ORIGIN)
            .set("X-Forwarded-For", "198.51.100.10")
            .send({ password: "incorrecta" })
        ).status,
      ).toBe(401);
    expect(
      (
        await request(app)
          .post("/api/admin/session")
          .set("Origin", ORIGIN)
          .set("X-Forwarded-For", "198.51.100.11")
          .send({ password: config.adminPassword })
      ).status,
    ).toBe(200);
  } finally {
    db.close();
  }
});
