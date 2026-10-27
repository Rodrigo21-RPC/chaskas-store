import { Router } from "express";
import { listProducts, getProduct, getImage } from "../products.js";
import { HttpError } from "../errors.js";
export function catalogRoutes(db, config) {
  const router = Router();
  router.get("/store", (req, res) =>
    res.json({
      name: "Chaska's Store",
      whatsappEnabled: Boolean(config.whatsappNumber),
    }),
  );
  router.get("/products", (req, res) =>
    res.json({ products: listProducts(db) }),
  );
  router.get("/products/:id/image", (req, res) => {
    const row = getImage(db, req.params.id);
    if (!row)
      throw new HttpError(404, "NOT_AVAILABLE", "Producto no disponible.");
    res
      .set("X-Content-Type-Options", "nosniff")
      .type(row.image_mime)
      .send(Buffer.from(row.image_bytes));
  });
  router.get("/products/:id", (req, res) => {
    const product = getProduct(db, req.params.id);
    if (!product)
      throw new HttpError(404, "NOT_AVAILABLE", "Producto no disponible.");
    res.json(product);
  });
  return router;
}
