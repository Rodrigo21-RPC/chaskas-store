import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { OrderProvider, useOrder } from "../../client/order/OrderProvider.jsx";
import { OrderPage } from "../../client/pages/OrderPage.jsx";
const id = "663892d0-d0b9-4f25-88f1-2f805ef40f77";
const p = {
  id,
  name: "Celular Ágil",
  priceCents: 32900,
  imageUrl: "/photo",
  category: "celulares",
};
const json = (body, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => body,
});
function Controls() {
  const o = useOrder();
  return (
    <>
      <button onClick={() => o.add(p)}>Agregar desde catálogo</button>
      <button onClick={() => o.add(p)}>Agregar desde detalle</button>
      <span data-testid="count">{o.count}</span>
      <p role="status">{o.notice}</p>
    </>
  );
}
function setup() {
  render(
    <MemoryRouter>
      <OrderProvider>
        <Controls />
        <OrderPage />
      </OrderProvider>
    </MemoryRouter>,
  );
}
test("comprueba cada agregado y consolida; retirar el único muestra nombre aun en vacío", async () => {
  let removed = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, opts) => {
      if (url === "/api/store") return json({ whatsappEnabled: true });
      if (url.includes("/api/products/"))
        return removed
          ? json({ error: { message: "Producto no disponible." } }, 404)
          : json(p);
      const sent = JSON.parse(opts.body).items;
      return json(
        removed
          ? {
              status: "empty",
              items: [],
              removedProductIds: [id],
              totalUnits: 0,
              totalCents: 0,
              whatsappUrl: null,
            }
          : {
              status: sent.length ? "ready" : "empty",
              items: sent.map((x) => ({
                ...x,
                name: p.name,
                unitPriceCents: 32900,
                subtotalCents: x.quantity * 32900,
                imageUrl: "/photo",
              })),
              removedProductIds: [],
              totalUnits: sent.reduce((n, x) => n + x.quantity, 0),
              totalCents: sent.reduce((n, x) => n + x.quantity * 32900, 0),
              whatsappUrl: null,
            },
      );
    }),
  );
  setup();
  await waitFor(() =>
    expect(screen.queryByText("Verificando pedido…")).not.toBeInTheDocument(),
  );
  fireEvent.click(screen.getByText("Agregar desde catálogo"));
  await waitFor(() =>
    expect(screen.getByTestId("count")).toHaveTextContent("1"),
  );
  fireEvent.click(screen.getByText("Agregar desde detalle"));
  await waitFor(() =>
    expect(screen.getByTestId("count")).toHaveTextContent("2"),
  );
  expect(screen.getAllByText("Celular Ágil")).toHaveLength(1);
  removed = true;
  fireEvent.click(screen.getByText("Agregar desde catálogo"));
  await screen.findAllByText(/Producto no disponible/);
  expect(screen.getByTestId("count")).toHaveTextContent("2");
  fireEvent.click(
    screen.getByRole("button", { name: "Enviar pedido por WhatsApp" }),
  );
  await screen.findByText(/Tu pedido está vacío/);
  expect(screen.getByTestId("count")).toHaveTextContent("0");
  expect(
    screen.getAllByText(/Ya no disponibles: Celular Ágil/).length,
  ).toBeGreaterThan(0);
  expect(
    screen.getByRole("button", { name: "Enviar pedido por WhatsApp" }),
  ).toBeDisabled();
});
test("fallo al agregar conserva selección y no confirma éxito", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) =>
      url === "/api/store"
        ? json({ whatsappEnabled: false })
        : Promise.reject(new Error("offline")),
    ),
  );
  setup();
  fireEvent.click(screen.getByText("Agregar desde detalle"));
  await screen.findAllByText(/No se pudo conectar/);
  expect(screen.getByTestId("count")).toHaveTextContent("0");
  expect(screen.queryByText(/agregado al pedido/)).not.toBeInTheDocument();
});
test("un fallo temporal de configuración tiene reintento sin recargar", async () => {
  let calls = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      if (url === "/api/store") {
        if (calls++ === 0) throw new Error("offline");
        return json({ whatsappEnabled: true });
      }
      if (url.includes("/api/products/")) return json(p);
    }),
  );
  setup();
  await screen.findByText(/No se pudo conectar/);
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  fireEvent.click(screen.getByText("Agregar desde catálogo"));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Enviar pedido por WhatsApp" }),
    ).toBeEnabled(),
  );
});
test("respuesta anterior no sobrescribe cantidades editadas durante la verificación", async () => {
  localStorage.setItem(
    "chaskas.order.v1",
    JSON.stringify({
      version: 1,
      items: [
        {
          productId: id,
          quantity: 1,
          snapshot: {
            name: p.name,
            priceCents: p.priceCents,
            imageUrl: p.imageUrl,
          },
        },
      ],
    }),
  );
  let resolvePreview;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      if (url === "/api/store") return json({ whatsappEnabled: true });
      if (url.includes("/api/products/")) return json(p);
      return new Promise((resolve) => {
        resolvePreview = resolve;
      });
    }),
  );
  setup();
  await waitFor(() => expect(resolvePreview).toBeTypeOf("function"));
  fireEvent.click(screen.getByText("Agregar desde detalle"));
  await waitFor(() =>
    expect(screen.getByTestId("count")).toHaveTextContent("2"),
  );
  resolvePreview(
    json({
      status: "ready",
      items: [
        {
          productId: id,
          name: p.name,
          quantity: 1,
          unitPriceCents: p.priceCents,
          subtotalCents: p.priceCents,
          imageUrl: p.imageUrl,
        },
      ],
      removedProductIds: [],
      totalUnits: 1,
      totalCents: p.priceCents,
      whatsappUrl: "https://wa.me/51999999999",
    }),
  );
  await screen.findAllByText(/El pedido cambió/);
  expect(screen.getByTestId("count")).toHaveTextContent("2");
});
