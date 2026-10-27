import { getProduct } from "./products.js";
import { sumOrder, formatMoney } from "../shared/money.js";
export function previewOrder(db, requested, number) {
  const items = [],
    removedProductIds = [];
  db.exec("BEGIN");
  try {
    for (const line of requested) {
      const p = getProduct(db, line.productId);
      if (!p) {
        removedProductIds.push(line.productId);
        continue;
      }
      items.push({
        productId: p.id,
        name: p.name,
        quantity: line.quantity,
        unitPriceCents: p.priceCents,
        subtotalCents: p.priceCents * line.quantity,
        imageUrl: p.imageUrl,
      });
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  const totals = sumOrder(
    items.map((x) => ({ priceCents: x.unitPriceCents, quantity: x.quantity })),
  );
  const status = !items.length
    ? "empty"
    : removedProductIds.length
      ? "changed"
      : !number
        ? "unavailable"
        : "ready";
  const message = [
    "Hola, quiero hacer este pedido en Chaska's Store:",
    "",
    ...items.map(
      (x) =>
        `${x.quantity} x ${x.name} — ${formatMoney(x.unitPriceCents)} c/u — Subtotal: ${formatMoney(x.subtotalCents)}`,
    ),
    "",
    `Unidades: ${totals.totalUnits}`,
    `Total: ${formatMoney(totals.totalCents)}`,
  ].join("\n");
  return {
    status,
    items,
    removedProductIds,
    ...totals,
    whatsappUrl:
      status === "ready"
        ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
        : null,
  };
}
