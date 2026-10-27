import { HttpError } from "./errors.js";
export function loginLimit(clock) {
  const attempts = new Map();
  return {
    check(req, res, next) {
      const now = clock();
      for (const [key, value] of attempts)
        if (now >= value.until) attempts.delete(key);
      const item = attempts.get(req.ip);
      if (item?.count >= 5) {
        res.set(
          "Retry-After",
          String(Math.max(1, Math.ceil((item.until - now) / 1000))),
        );
        throw new HttpError(
          429,
          "TOO_MANY_ATTEMPTS",
          "Demasiados intentos. Espera quince minutos y vuelve a intentarlo.",
        );
      }
      next();
    },
    fail(ip) {
      const item = attempts.get(ip) || { count: 0, until: clock() + 900000 };
      item.count++;
      attempts.set(ip, item);
    },
    success(ip) {
      attempts.delete(ip);
    },
  };
}
