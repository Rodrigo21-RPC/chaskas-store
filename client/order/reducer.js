import { sumOrder } from "../../shared/money.js";
export function orderReducer(state, action) {
  let next = state;
  if (action.type === "add") {
    const p = action.product,
      existing = state.find((x) => x.productId === p.id);
    next = existing
      ? state.map((x) =>
          x.productId === p.id
            ? {
                ...x,
                quantity: x.quantity + 1,
                snapshot: {
                  name: p.name,
                  priceCents: p.priceCents,
                  imageUrl: p.imageUrl,
                },
              }
            : x,
        )
      : [
          ...state,
          {
            productId: p.id,
            quantity: 1,
            snapshot: {
              name: p.name,
              priceCents: p.priceCents,
              imageUrl: p.imageUrl,
            },
          },
        ];
  } else if (action.type === "quantity") {
    if (!Number.isSafeInteger(action.quantity) || action.quantity < 1)
      throw new Error("La cantidad debe ser un entero desde uno.");
    next = state.map((x) =>
      x.productId === action.id ? { ...x, quantity: action.quantity } : x,
    );
  } else if (action.type === "remove")
    next = state.filter((x) => x.productId !== action.id);
  sumOrder(
    next.map((x) => ({
      quantity: x.quantity,
      priceCents: x.snapshot.priceCents,
    })),
  );
  return next;
}
