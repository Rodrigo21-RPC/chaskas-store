import { expect, test } from "vitest";
import {
  readOrder,
  writeOrder,
  ORDER_KEY,
} from "../../client/order/storage.js";
const id = "663892d0-d0b9-4f25-88f1-2f805ef40f77";
const item = {
  productId: id,
  quantity: 1,
  snapshot: { name: "Celular", priceCents: 100, imageUrl: "/image" },
};
function storage(value) {
  return {
    getItem: () => value,
    setItem: (key, next) => {
      expect(key).toBe(ORDER_KEY);
      value = next;
    },
  };
}
test("persistencia versionada restaura y consolida duplicados válidos", () => {
  const s = storage();
  expect(writeOrder(s, [item])).toBe(true);
  expect(readOrder(s).items).toEqual([item]);
  expect(
    readOrder(storage(JSON.stringify({ version: 1, items: [item, item] })))
      .items[0].quantity,
  ).toBe(2);
});
test("recupera entradas válidas y avisa de datos dañados", () => {
  const data = readOrder(
    storage(JSON.stringify({ version: 1, items: [item, { bad: true }] })),
  );
  expect(data.items).toEqual([item]);
  expect(data.warning).toBeTruthy();
  expect(readOrder(storage("{bad")).warning).toBeTruthy();
  expect(
    readOrder(storage(JSON.stringify({ version: 2, items: [item] }))).items,
  ).toEqual([]);
});
test("fallo de almacenamiento no afirma persistencia", () => {
  const s = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("quota");
    },
  };
  expect(readOrder(s).warning).toBeTruthy();
  expect(writeOrder(s, [item])).toBe(false);
});
