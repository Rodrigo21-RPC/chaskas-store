import { expect, test, vi, afterEach } from "vitest";
import { api } from "../../client/api.js";
afterEach(() => vi.unstubAllGlobals());
test("distingue error HTTP y conserva mensajes por campo", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          message: "Corrige los campos.",
          fieldErrors: { name: ["Escribe un nombre."] },
        },
      }),
    }),
  );
  await expect(api("/api/products")).rejects.toMatchObject({
    message: "Corrige los campos.",
    status: 400,
    fieldErrors: { name: ["Escribe un nombre."] },
  });
});
test("fallo de red no se interpreta como listado vacío", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
  );
  await expect(api("/api/products")).rejects.toThrow(/conexión|conectar/);
});
test("GET de producto desactiva caché y no envía claves", async () => {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ id: "id" }),
  });
  vi.stubGlobal("fetch", fetch);
  expect(await api("/api/products/id")).toEqual({ id: "id" });
  expect(fetch.mock.calls[0][1]).toMatchObject({
    cache: "no-store",
    credentials: "same-origin",
  });
});
