export const ORDER_KEY = "chaskas.order.v1";
import { z } from "zod";
import { sumOrder } from "../../shared/money.js";
const itemSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  snapshot: z.object({
    name: z.string().min(1),
    priceCents: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    imageUrl: z.string().regex(/^\/(?!\/)/),
  }),
});
const storageWarning =
  "No se pudo guardar el pedido en este navegador. Se conservará solo mientras la página esté abierta.";
export function readOrder(storage) {
  try {
    const raw = storage.getItem(ORDER_KEY);
    if (!raw) return { items: [], warning: "" };
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.items))
      throw new Error("version");
    const items = [];
    let invalid = false;
    for (const candidate of data.items) {
      const parsed = itemSchema.safeParse(candidate);
      if (!parsed.success) {
        invalid = true;
        continue;
      }
      const p = parsed.data,
        existing = items.find((x) => x.productId === p.productId);
      const proposed = existing
        ? items.map((x) =>
            x === existing ? { ...x, quantity: x.quantity + p.quantity } : x,
          )
        : [...items, p];
      try {
        sumOrder(
          proposed.map((x) => ({
            quantity: x.quantity,
            priceCents: x.snapshot.priceCents,
          })),
        );
        items.splice(0, items.length, ...proposed);
      } catch {
        invalid = true;
      }
    }
    return {
      items,
      warning: invalid
        ? "Se recuperó el pedido; algunas entradas dañadas no pudieron restaurarse."
        : "",
    };
  } catch {
    return {
      items: [],
      warning:
        "No se pudo restaurar el pedido. Puedes armar uno nuevo; revisa el almacenamiento del navegador.",
    };
  }
}
export function writeOrder(storage, items) {
  try {
    const safe = items.map((x) => itemSchema.parse(x));
    storage.setItem(ORDER_KEY, JSON.stringify({ version: 1, items: safe }));
    return true;
  } catch {
    return false;
  }
}
export { storageWarning };
