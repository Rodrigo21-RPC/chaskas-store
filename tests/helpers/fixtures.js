import sharp from "sharp";
import { randomUUID } from "node:crypto";
export const ORIGIN = "http://localhost:5173";
export const config = {
  adminPassword: "clave-sintetica-de-prueba",
  whatsappNumber: "51999999999",
  appOrigin: ORIGIN,
  port: 3000,
  databasePath: ":memory:",
  production: false,
};
export const photo = (format = "png") =>
  sharp({
    create: { width: 24, height: 24, channels: 3, background: "#4d8eff" },
  })
    .toFormat(format)
    .toBuffer();
export const product = (overrides = {}) => ({
  id: randomUUID(),
  name: "Celular de prueba",
  category: "celulares",
  priceCents: 429900,
  description: "Descripción completa del producto.",
  specifications: "Memoria: 256 GB",
  createdAt: 1000,
  imageMime: "image/png",
  ...overrides,
});
export async function seed(db, overrides) {
  const p = product(overrides),
    bytes = await photo();
  db.prepare(
    "INSERT INTO products (id,name,category,price_cents,description,specifications,image_bytes,image_mime,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
  ).run(
    p.id,
    p.name,
    p.category,
    p.priceCents,
    p.description,
    p.specifications,
    bytes,
    p.imageMime,
    p.createdAt,
  );
  return { ...p, imageUrl: `/api/products/${p.id}/image` };
}
