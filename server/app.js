import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { requireOrigin } from "./origin.js";
import { errorHandler } from "./errors.js";
import { catalogRoutes } from "./routes/catalog.js";
import { orderRoutes } from "./routes/order.js";
import { initSessions } from "./sessions.js";
import { sessionRoutes } from "./routes/admin-session.js";
import { adminProductRoutes } from "./routes/admin-products.js";
export function createApp({
  config,
  db,
  clock = Date.now,
  distDir = resolve("dist"),
}) {
  const app = express();
  app.disable("x-powered-by");
  if (config.trustedProxy) app.set("trust proxy", config.trustedProxy);
  app.locals.db = db;
  app.locals.config = config;
  app.locals.clock = clock;
  app.use(
    "/api",
    (req, res, next) => {
      res.set("Cache-Control", "no-store");
      next();
    },
    requireOrigin(config.appOrigin),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", catalogRoutes(db, config));
  app.use("/api", orderRoutes(db, config));
  if (db) {
    initSessions(db);
    db.prepare("DELETE FROM admin_sessions WHERE expires_at<=?").run(clock());
    app.use("/api/admin", sessionRoutes(db, config, clock));
    app.use("/api/admin", adminProductRoutes(db, clock));
  }
  app.use("/api", (req, res) =>
    res.status(404).json({
      error: { code: "NOT_FOUND", message: "Recurso no encontrado." },
    }),
  );
  if (existsSync(distDir)) {
    app.use(express.static(distDir, { index: false }));
    app.get("/{*path}", (req, res) =>
      res.sendFile(resolve(distDir, "index.html")),
    );
  }
  app.use(errorHandler);
  return app;
}
