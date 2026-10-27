import { expect, test } from "vitest";
import { readConfig } from "../../server/config.js";
test("exige clave y no tiene una por defecto", () =>
  expect(() => readConfig({})).toThrow(/ADMIN_PASSWORD/));
test("configura valores locales sin exponer el entorno completo", () => {
  const c = readConfig({
    ADMIN_PASSWORD: "solo-prueba",
    APP_ORIGIN: "http://localhost:5173",
    PRIVATE_VALUE: "oculto",
  });
  expect(c).toMatchObject({
    adminPassword: "solo-prueba",
    port: 3000,
    databasePath: "./data/chaskas.sqlite",
    production: false,
  });
  expect(c).not.toHaveProperty("PRIVATE_VALUE");
});
test.each([
  "",
  "+51999999999",
  "123",
  "01999999999",
  "51999 999999",
  "1234567890123456",
])("destino inválido deshabilita envío: %s", (number) =>
  expect(
    readConfig({ ADMIN_PASSWORD: "test", WHATSAPP_NUMBER: number })
      .whatsappNumber,
  ).toBeNull(),
);
test("acepta número internacional solo dígitos", () =>
  expect(
    readConfig({ ADMIN_PASSWORD: "test", WHATSAPP_NUMBER: "51999999999" })
      .whatsappNumber,
  ).toBe("51999999999"));
test.each([
  { PORT: "no" },
  { APP_ORIGIN: "javascript:alert(1)" },
  { NODE_ENV: "production", APP_ORIGIN: "http://example.com" },
])("rechaza configuración operativa inválida", (extra) =>
  expect(() => readConfig({ ADMIN_PASSWORD: "test", ...extra })).toThrow(),
);
test("confía solo en una IP de proxy explícita y válida", () => {
  expect(
    readConfig({ ADMIN_PASSWORD: "test", TRUSTED_PROXY: "127.0.0.1" })
      .trustedProxy,
  ).toBe("127.0.0.1");
  expect(() =>
    readConfig({ ADMIN_PASSWORD: "test", TRUSTED_PROXY: "true" }),
  ).toThrow();
});
