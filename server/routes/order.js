import { Router } from "express";
import { z } from "zod";
import { previewOrder } from "../order-preview.js";
import { HttpError } from "../errors.js";
const schema = z
  .object({
    items: z.array(
      z
        .object({
          productId: z.uuid(),
          quantity: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
        })
        .strict(),
    ),
  })
  .strict();
export function orderRoutes(db, config) {
  const router = Router();
  router.post("/order/preview", (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (
      !parsed.success ||
      new Set(parsed.data.items.map((x) => x.productId)).size !==
        parsed.data.items.length
    )
      throw new HttpError(
        400,
        "INVALID_ORDER",
        "El pedido contiene productos o cantidades inválidos.",
      );
    try {
      res.json(previewOrder(db, parsed.data.items, config.whatsappNumber));
    } catch (error) {
      if (/cantidad|precio|importe|Reduce/i.test(error.message))
        throw new HttpError(400, "INVALID_AMOUNT", error.message);
      throw new HttpError(
        503,
        "CATALOG_UNAVAILABLE",
        "No se pudo verificar el catálogo. Conservamos tu pedido para reintentar.",
      );
    }
  });
  return router;
}
