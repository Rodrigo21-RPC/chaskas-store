import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
export function openDatabase(path = ":memory:") {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 500),
    category TEXT NOT NULL CHECK(category IN ('celulares','laptops','accesorios')),
    price_cents INTEGER NOT NULL CHECK(price_cents > 0 AND price_cents <= 9007199254740991),
    description TEXT NOT NULL CHECK(length(trim(description)) BETWEEN 1 AND 20000),
    specifications TEXT NOT NULL DEFAULT '' CHECK(length(specifications) <= 20000),
    image_bytes BLOB NOT NULL CHECK(length(image_bytes) BETWEEN 1 AND 5000000),
    image_mime TEXT NOT NULL CHECK(image_mime IN ('image/jpeg','image/png','image/webp')),
    created_at INTEGER NOT NULL
  ) STRICT;`);
  return db;
}
