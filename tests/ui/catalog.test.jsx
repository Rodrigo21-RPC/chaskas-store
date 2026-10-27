import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { CatalogPage } from "../../client/pages/CatalogPage.jsx";
const products = [
  {
    id: "a",
    name: "Teléfono Ágil",
    category: "celulares",
    priceCents: 10000,
    imageUrl: "/a.png",
  },
  {
    id: "b",
    name: "Laptop Ágil",
    category: "laptops",
    priceCents: 20000,
    imageUrl: "/b.png",
  },
];
function setup(data = products) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ products: data }),
    }),
  );
  render(
    <MemoryRouter>
      <CatalogPage />
    </MemoryRouter>,
  );
}
test("presenta tarjetas y combina búsqueda con filtros sin nuevas peticiones", async () => {
  setup();
  await screen.findByRole("link", { name: "Teléfono Ágil" });
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "AGIL" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Laptops" }));
  expect(
    screen.queryByRole("link", { name: "Teléfono Ágil" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Laptop Ágil" })).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "sin resultados" },
  });
  expect(screen.getByRole("status")).toHaveTextContent("No encontramos");
});
test("distingue catálogo vacío", async () => {
  setup([]);
  expect(await screen.findByRole("status")).toHaveTextContent(
    /catálogo está vacío/,
  );
});
test("un error de red no se presenta como catálogo vacío", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  render(
    <MemoryRouter>
      <CatalogPage />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("conectar"),
  );
  expect(
    screen.getByRole("button", { name: "Reintentar" }),
  ).toBeInTheDocument();
});
test("una categoría desconocida de la URL activa Todos, incluso claves heredadas", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ products }),
      }),
  );
  render(
    <MemoryRouter initialEntries={["/?categoria=toString"]}>
      <CatalogPage />
    </MemoryRouter>,
  );
  await screen.findByRole("link", { name: "Teléfono Ágil" });
  expect(
    screen.getByRole("button", { name: "Todos", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
