import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { AdminLoginPage } from "../../client/pages/AdminLoginPage.jsx";
import { AdminPanelPage } from "../../client/pages/AdminPanelPage.jsx";
const json = (body, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => body,
});
test("clave oculta, error sin correo ni nombre de usuario", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        json({ error: { message: "La clave no es correcta." } }, 401),
      ),
  );
  render(
    <MemoryRouter>
      <AdminLoginPage />
    </MemoryRouter>,
  );
  const input = screen.getByLabelText("Clave de administrador");
  expect(input).toHaveAttribute("type", "password");
  fireEvent.change(input, { target: { value: "incorrecta" } });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
  await screen.findByText("La clave no es correcta.");
  expect(screen.queryByLabelText(/Correo/)).not.toBeInTheDocument();
});
test("cancelar retirada no llama DELETE y confirmar identifica el producto", async () => {
  const p = {
    id: "a",
    name: "Celular de prueba",
    category: "celulares",
    priceCents: 10000,
    imageUrl: "/a",
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, opts) =>
      opts?.method === "DELETE"
        ? { ok: true, status: 204 }
        : json({ products: [p] }),
    ),
  );
  render(
    <MemoryRouter>
      <AdminPanelPage />
    </MemoryRouter>,
  );
  await screen.findByText(p.name);
  fireEvent.click(
    screen.getByRole("button", { name: "Quitar Celular de prueba" }),
  );
  expect(screen.getByRole("dialog")).toHaveTextContent(p.name);
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(
    fetch.mock.calls.filter((x) => x[1]?.method === "DELETE"),
  ).toHaveLength(0);
  fireEvent.click(
    screen.getByRole("button", { name: "Quitar Celular de prueba" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Confirmar retirada" }));
  await waitFor(() =>
    expect(
      fetch.mock.calls.filter((x) => x[1]?.method === "DELETE"),
    ).toHaveLength(1),
  );
});
test("la confirmación de publicación es visible y accesible", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ products: [] })));
  render(
    <MemoryRouter initialEntries={["/admin?guardado=1"]}>
      <AdminPanelPage />
    </MemoryRouter>,
  );
  await screen.findByText("El catálogo está vacío. Agrega tu primer producto.");
  expect(
    screen.getByText("Producto guardado correctamente.").closest(".sr-only"),
  ).toBeNull();
});
