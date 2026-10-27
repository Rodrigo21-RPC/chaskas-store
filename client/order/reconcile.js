export function reconcile(snapshot, response) {
  const removedNames = response.removedProductIds.map(
    (id) =>
      snapshot.find((x) => x.productId === id)?.snapshot.name ||
      "Producto no disponible",
  );
  const items = response.items.map((x) => ({
    productId: x.productId,
    quantity: x.quantity,
    snapshot: {
      name: x.name,
      priceCents: x.unitPriceCents,
      imageUrl: x.imageUrl,
    },
  }));
  return {
    items,
    notice: removedNames.length
      ? `Ya no disponibles: ${removedNames.join(", ")}. Se actualizaron tu pedido y el total.`
      : "",
  };
}
