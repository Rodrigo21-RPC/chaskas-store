import { expect, test } from "vitest";
import { parsePrice, formatMoney, sumOrder } from "../../shared/money.js";
test.each([
  ["4299.00", 429900],
  ["0.01", 1],
  ["49.9", 4990],
  [" 49.90 ", 4990],
])("convierte %s a céntimos exactos", (input, value) =>
  expect(parsePrice(input)).toBe(value),
);
test.each([
  "0",
  "-1",
  "1.001",
  "1e3",
  "4,299.00",
  "",
  "Infinity",
  "9007199254740992",
])("rechaza precio inválido %s", (input) =>
  expect(() => parsePrice(input)).toThrow(),
);
test("formatea soles incluso total vacío", () => {
  expect(formatMoney(429900)).toBe("S/ 4,299.00");
  expect(formatMoney(4990)).toBe("S/ 49.90");
  expect(formatMoney(0)).toBe("S/ 0.00");
});
test("calcula unidades y totales sin coma flotante", () => {
  expect(
    sumOrder([
      { priceCents: 429900, quantity: 1 },
      { priceCents: 32900, quantity: 2 },
    ]),
  ).toEqual({ totalCents: 495700, totalUnits: 3 });
  expect(
    sumOrder([
      { priceCents: 429900, quantity: 1 },
      { priceCents: 32900, quantity: 1 },
    ]).totalCents,
  ).toBe(462800);
});
test.each([0, -1, 1.2, NaN, Number.MAX_SAFE_INTEGER + 1])(
  "rechaza cantidad %s",
  (quantity) => expect(() => sumOrder([{ priceCents: 1, quantity }])).toThrow(),
);
test("rechaza desbordamiento del total", () =>
  expect(() =>
    sumOrder([{ priceCents: Number.MAX_SAFE_INTEGER, quantity: 2 }]),
  ).toThrow());
