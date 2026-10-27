import { expect, test } from "vitest";
import { verifyPhoto } from "../../server/photos.js";
import { photo } from "../helpers/fixtures.js";
test.each([
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
])("admite foto decodificable %s y deriva MIME real", async (format, mime) => {
  const bytes = await photo(format);
  const result = await verifyPhoto({ buffer: bytes, mimetype: "text/html" });
  expect(result.mime).toBe(mime);
  expect(result.bytes).toEqual(bytes);
});
test.each([
  undefined,
  { buffer: Buffer.from("<html>hola</html>"), mimetype: "image/png" },
  { buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) },
])(
  "rechaza foto ausente/falsa/ilegible",
  async (file) =>
    await expect(verifyPhoto(file)).rejects.toMatchObject({ status: 415 }),
);
test("acepta exactamente 5 MB y rechaza un byte adicional", async () => {
  const original = await photo();
  const exact = Buffer.concat([
    original,
    Buffer.alloc(5000000 - original.length),
  ]);
  expect((await verifyPhoto({ buffer: exact })).bytes.length).toBe(5000000);
  await expect(
    verifyPhoto({ buffer: Buffer.concat([exact, Buffer.from([0])]) }),
  ).rejects.toMatchObject({ status: 413 });
});
test("limita dimensión decodificada sin depender de la extensión", async () =>
  await expect(
    verifyPhoto({ buffer: await photo() }, { maxPixels: 100 }),
  ).rejects.toMatchObject({ status: 415 }));
