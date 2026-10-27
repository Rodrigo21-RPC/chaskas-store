export const categories = {
  celulares: "Celulares",
  laptops: "Laptops",
  accesorios: "Accesorios",
};
export const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
export function filterProducts(products, query = "", category = "todos") {
  const q = normalize(query);
  return products.filter(
    (p) =>
      (!Object.hasOwn(categories, category) || p.category === category) &&
      normalize(p.name).includes(q),
  );
}
