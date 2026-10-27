import { isIP } from "node:net";
export function readConfig(env = process.env) {
  const adminPassword = env.ADMIN_PASSWORD;
  if (!adminPassword?.trim())
    throw new Error("Configura ADMIN_PASSWORD en el entorno antes de iniciar.");
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT debe ser un puerto válido.");
  const appOrigin = env.APP_ORIGIN || "http://localhost:5173";
  let url;
  try {
    url = new URL(appOrigin);
  } catch {
    throw new Error("APP_ORIGIN debe ser un origen HTTP válido.");
  }
  const production = env.NODE_ENV === "production";
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.origin !== appOrigin ||
    (production && url.protocol !== "https:")
  )
    throw new Error(
      "APP_ORIGIN debe ser un origen válido; producción requiere HTTPS.",
    );
  const number = env.WHATSAPP_NUMBER || "";
  const trustedProxy = env.TRUSTED_PROXY?.trim() || null;
  if (trustedProxy && !isIP(trustedProxy))
    throw new Error("TRUSTED_PROXY debe ser la IP exacta del proxy conocido.");
  return {
    adminPassword,
    appOrigin,
    port,
    production,
    trustedProxy,
    whatsappNumber: /^[1-9]\d{7,14}$/.test(number) ? number : null,
    databasePath: env.DATABASE_PATH || "./data/chaskas.sqlite",
  };
}
