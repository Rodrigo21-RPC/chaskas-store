import { expect, test } from "vitest";
import { filterProducts } from "../../shared/search.js";
const products = [
  { name: "Teléfono Ágil", category: "celulares" },
  { name: "Laptop Ágil", category: "laptops" },
  { name: "SSD", category: "accesorios" },
];
test("combina categoría con búsqueda parcial sin tildes ni mayúsculas", () =>
  expect(filterProducts(products, "  AGIL  ", "laptops")).toEqual([
    products[1],
  ]));
test("Todos o categoría inválida no limita productos", () => {
  expect(filterProducts(products, "", "todos")).toEqual(products);
  expect(filterProducts(products, "", "invalid")).toEqual(products);
  expect(filterProducts(products, "inexistente", "celulares")).toEqual([]);
});
