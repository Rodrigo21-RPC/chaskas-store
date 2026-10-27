import { Router } from "express";
import {
  createSession,
  readSession,
  removeSession,
  sessionToken,
  requireAdmin,
  cookieOptions,
} from "../sessions.js";
import { loginLimit } from "../login-limit.js";
export function sessionRoutes(db, config, clock) {
  const router = Router(),
    limit = loginLimit(clock);
  router.post("/session", limit.check, (req, res) => {
    try {
      const result = createSession(
        db,
        req.body?.password,
        config.adminPassword,
        clock(),
        sessionToken(req),
      );
      limit.success(req.ip);
      res
        .cookie("chaskas_admin", result.token, cookieOptions(config))
        .json({ authenticated: true, expiresAt: result.expiresAt });
    } catch (e) {
      if (e.status === 401) limit.fail(req.ip);
      throw e;
    }
  });
  router.get("/session", requireAdmin(db, clock), (req, res) =>
    res.json(req.admin),
  );
  router.delete("/session", (req, res) => {
    removeSession(db, sessionToken(req));
    res.clearCookie("chaskas_admin", cookieOptions(config));
    res.status(204).end();
  });
  return router;
}
