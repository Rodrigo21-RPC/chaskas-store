import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { ProductDetailPage } from "../../client/pages/ProductDetailPage.jsx";
test("muestra descripción completa y volver conserva filtros", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "a",
        name: "Laptop",
        category: "laptops",
        priceCents: 10000,
        description: "Descripción extensa completa.",
        specifications: "Memoria: 16 GB",
        imageUrl: "/photo",
      }),
    }),
  );
  render(
    <MemoryRouter initialEntries={["/productos/a?q=agil&categoria=laptops"]}>
      <Routes>
        <Route path="/productos/:id" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(
    await screen.findByText("Descripción extensa completa."),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Volver/ })).toHaveAttribute(
    "href",
    "/?q=agil&categoria=laptops",
  );
  expect(screen.getByText("Memoria: 16 GB")).toBeInTheDocument();
});
test("producto retirado informa y no permite agregar", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Producto no disponible." } }),
    }),
  );
  render(
    <MemoryRouter initialEntries={["/productos/a"]}>
      <Routes>
        <Route path="/productos/:id" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(
    await screen.findByText("Producto no disponible."),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Agregar/ }),
  ).not.toBeInTheDocument();
});
