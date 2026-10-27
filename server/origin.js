export const requireOrigin = (allowed) => (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  let origin = req.get("Origin");
  if (!origin && req.get("Referer")) {
    try {
      origin = new URL(req.get("Referer")).origin;
    } catch {
      /* Sin origen acreditado. */
    }
  }
  if (origin !== allowed)
    return res.status(403).json({
      error: {
        code: "ORIGIN_FORBIDDEN",
        message: "La solicitud no proviene de esta tienda.",
      },
    });
  next();
};
