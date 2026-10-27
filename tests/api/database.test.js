import { expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "../../server/db.js";
import { product, photo } from "../helpers/fixtures.js";
const columns =
  "id,name,category,price_cents,description,specifications,image_bytes,image_mime,created_at";
function insert(db, p, bytes) {
  db.prepare(
    `INSERT INTO products (${columns}) VALUES (?,?,?,?,?,?,?,?,?)`,
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
}
test("crea catálogo vacío con restricciones e identidad independiente del nombre", async () => {
  const db = openDatabase();
  try {
    expect(
      db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all()
        .map((x) => x.name),
    ).toContain("products");
    expect(
      db.prepare("SELECT count(*) AS count FROM products").get().count,
    ).toBe(0);
    const bytes = await photo();
    insert(db, product(), bytes);
    insert(db, product(), bytes);
    expect(
      db.prepare("SELECT count(*) AS count FROM products").get().count,
    ).toBe(2);
    for (const patch of [
      { name: "" },
      { name: "  " },
      { category: "otra" },
      { priceCents: 0 },
      { priceCents: -1 },
      { priceCents: 1.5 },
      { description: "" },
      { imageMime: "text/html" },
    ])
      expect(() => insert(db, product(patch), bytes)).toThrow();
    expect(() => insert(db, product(), Buffer.alloc(5000001))).toThrow();
  } finally {
    db.close();
  }
});
test("producto y foto se conservan al reabrir y se retiran juntos", async () => {
  const dir = mkdtempSync(join(tmpdir(), "chaskas-"));
  const path = join(dir, "store.sqlite");
  let db = openDatabase(path);
  try {
    expect(
      db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all()
        .map((x) => x.name),
    ).toContain("products");
    const p = product(),
      bytes = await photo();
    insert(db, p, bytes);
    db.close();
    db = openDatabase(path);
    expect(
      Buffer.from(
        db.prepare("SELECT image_bytes FROM products WHERE id=?").get(p.id)
          .image_bytes,
      ),
    ).toEqual(bytes);
    db.prepare("DELETE FROM products WHERE id=?").run(p.id);
    db.close();
    db = openDatabase(path);
    expect(
      db.prepare("SELECT count(*) AS count FROM products").get().count,
    ).toBe(0);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
