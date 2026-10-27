export function parsePrice(value) {
  const text = String(value ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text))
    throw new Error("Escribe un precio positivo con hasta dos decimales.");
  const [whole, decimals = ""] = text.split(".");
  const cents = BigInt(whole) * 100n + BigInt(decimals.padEnd(2, "0"));
  if (cents <= 0n || cents > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("El precio está fuera del rango permitido.");
  return Number(cents);
}
export function formatMoney(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0)
    throw new Error("Importe inválido.");
  return `S/ ${Math.floor(cents / 100).toLocaleString("en-US")}.${String(cents % 100).padStart(2, "0")}`;
}
export function sumOrder(items) {
  let totalCents = 0,
    totalUnits = 0;
  for (const { priceCents, quantity } of items) {
    if (
      !Number.isSafeInteger(priceCents) ||
      priceCents <= 0 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    )
      throw new Error("Cantidad o precio inválido.");
    const subtotal = priceCents * quantity;
    if (
      !Number.isSafeInteger(subtotal) ||
      !Number.isSafeInteger(totalCents + subtotal) ||
      !Number.isSafeInteger(totalUnits + quantity)
    )
      throw new Error("Reduce la cantidad: el importe es demasiado grande.");
    totalCents += subtotal;
    totalUnits += quantity;
  }
  return { totalCents, totalUnits };
}
