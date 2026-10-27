import { expect, test } from "vitest";
import { orderReducer } from "../../client/order/reducer.js";
const p = { id: "a", name: "Celular", priceCents: 429900, imageUrl: "/a" };
test("agregar consolida líneas y disminuir se detiene en uno", () => {
  let state = orderReducer([], { type: "add", product: p });
  expect(state).toHaveLength(1);
  expect(state[0].quantity).toBe(1);
  state = orderReducer(state, { type: "add", product: p });
  expect(state).toHaveLength(1);
  expect(state[0].quantity).toBe(2);
  state = orderReducer(state, { type: "quantity", id: "a", quantity: 1 });
  expect(state[0].quantity).toBe(1);
  expect(() =>
    orderReducer(state, { type: "quantity", id: "a", quantity: 0 }),
  ).toThrow();
  expect(orderReducer(state, { type: "remove", id: "a" })).toEqual([]);
});
test.each([-1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1])(
  "cantidades inválidas no entran al pedido: %s",
  (quantity) => {
    const state = [
      {
        productId: "a",
        quantity: 1,
        snapshot: { name: "A", priceCents: 1, imageUrl: "/a" },
      },
    ];
    expect(() =>
      orderReducer(state, { type: "quantity", id: "a", quantity }),
    ).toThrow();
  },
);
test("no admite desbordamiento", () =>
  expect(() =>
    orderReducer(
      [
        {
          productId: "a",
          quantity: Number.MAX_SAFE_INTEGER,
          snapshot: { name: "A", priceCents: 1, imageUrl: "/a" },
        },
      ],
      { type: "add", product: { ...p, priceCents: 1 } },
    ),
  ).toThrow());
