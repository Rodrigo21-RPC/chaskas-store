import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { HttpError } from "./errors.js";
export const SESSION_MS = 28800000;
const hash = (value) => createHash("sha256").update(value).digest("hex");
export function initSessions(db) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL) STRICT",
  );
}
export function sessionToken(req) {
  const raw = (req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("chaskas_admin="))
    ?.slice("chaskas_admin=".length);
  return raw && /^[\w-]{43}$/.test(raw) ? raw : null;
}
export function removeSession(db, token) {
  if (token)
    db.prepare("DELETE FROM admin_sessions WHERE token_hash=?").run(
      hash(token),
    );
}
export function readSession(db, token, now) {
  if (!token) return null;
  const row = db
    .prepare("SELECT expires_at FROM admin_sessions WHERE token_hash=?")
    .get(hash(token));
  if (!row || now >= row.expires_at) {
    removeSession(db, token);
    return null;
  }
  return { authenticated: true, expiresAt: row.expires_at };
}
export function createSession(db, password, expected, now, previous) {
  if (typeof password !== "string" || !password.trim())
    throw new HttpError(
      400,
      "PASSWORD_REQUIRED",
      "Ingresa la clave de administrador.",
      { password: ["Ingresa la clave de administrador."] },
    );
  if (
    !timingSafeEqual(
      Buffer.from(hash(password), "hex"),
      Buffer.from(hash(expected), "hex"),
    )
  )
    throw new HttpError(401, "WRONG_PASSWORD", "La clave no es correcta.");
  db.prepare("DELETE FROM admin_sessions WHERE expires_at<=?").run(now);
  removeSession(db, previous);
  const token = randomBytes(32).toString("base64url"),
    expiresAt = now + SESSION_MS;
  db.prepare(
    "INSERT INTO admin_sessions (token_hash,created_at,expires_at) VALUES (?,?,?)",
  ).run(hash(token), now, expiresAt);
  return { token, expiresAt };
}
export function requireAdmin(db, clock) {
  return (req, res, next) => {
    const session = readSession(db, sessionToken(req), clock());
    if (!session) {
      const error = new HttpError(
        401,
        "AUTH_REQUIRED",
        "Ingresa nuevamente la clave de administrador.",
      );
      // Descartar el flujo sin analizar multipart evita cortar la conexión durante la carga.
      if (!req.complete) {
        req.once("end", () => next(error));
        req.resume();
        return;
      }
      return next(error);
    }
    req.admin = session;
    next();
  };
}
export function cookieOptions(config) {
  return {
    httpOnly: true,
    sameSite: "strict",
    path: "/api/admin",
    secure: config.production,
  };
}
