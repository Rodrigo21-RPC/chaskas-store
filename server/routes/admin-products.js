import { Router } from "express";
import multer from "multer";
import { requireAdmin } from "../sessions.js";
import { productSchema, fieldErrors } from "../../shared/validation.js";
import { verifyPhoto } from "../photos.js";
import { listProducts, addProduct, removeProduct } from "../products.js";
import { HttpError } from "../errors.js";
export function adminProductRoutes(db, clock) {
  const router = Router(),
    upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 5000000,
        files: 1,
        fields: 5,
        parts: 7,
        fieldSize: 100000,
      },
    });
  router.use(requireAdmin(db, clock));
  router.get("/products", (req, res) =>
    res.json({ products: listProducts(db) }),
  );
  router.post("/products", upload.single("photo"), async (req, res) => {
    const result = productSchema.safeParse(req.body);
    if (!result.success)
      throw new HttpError(
        400,
        "INVALID_PRODUCT",
        "Corrige los campos indicados.",
        fieldErrors(result.error),
      );
    const photo = await verifyPhoto(req.file);
    const p = addProduct(db, result.data, photo, clock());
    res.location(`/api/products/${p.id}`).status(201).json(p);
  });
  router.delete("/products/:id", (req, res) => {
    if (!removeProduct(db, req.params.id))
      throw new HttpError(
        404,
        "NOT_AVAILABLE",
        "El producto ya no está disponible.",
      );
    res.status(204).end();
  });
  return router;
}
