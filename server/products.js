const summaryColumns = "id,name,category,price_cents";
import { randomUUID } from "node:crypto";
function summary(row) {
  return (
    row && {
      id: row.id,
      name: row.name,
      category: row.category,
      priceCents: row.price_cents,
      imageUrl: `/api/products/${row.id}/image`,
    }
  );
}
export function listProducts(db) {
  return db
    .prepare(
      `SELECT ${summaryColumns} FROM products ORDER BY created_at DESC,id DESC`,
    )
    .all()
    .map(summary);
}
export function getProduct(db, id) {
  const row = db
    .prepare(
      `SELECT ${summaryColumns},description,specifications FROM products WHERE id=?`,
    )
    .get(id);
  return row
    ? {
        ...summary(row),
        description: row.description,
        specifications: row.specifications,
      }
    : null;
}
export function getImage(db, id) {
  return db
    .prepare("SELECT image_bytes,image_mime FROM products WHERE id=?")
    .get(id);
}
export function addProduct(db, data, photo, now) {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO products (id,name,category,price_cents,description,specifications,image_bytes,image_mime,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
  ).run(
    id,
    data.name,
    data.category,
    data.priceCents,
    data.description,
    data.specifications,
    photo.bytes,
    photo.mime,
    now,
  );
  return getProduct(db, id);
}
export function removeProduct(db, id) {
  return db.prepare("DELETE FROM products WHERE id=?").run(id).changes > 0;
}
