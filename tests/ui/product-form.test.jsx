import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { ProductForm } from "../../client/components/ProductForm.jsx";
test("errores por campo y cancelación sin publicación", async () => {
  vi.stubGlobal("fetch", vi.fn());
  render(
    <MemoryRouter>
      <ProductForm />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Guardar producto" }));
  expect(
    await screen.findByText("Escribe el nombre del producto."),
  ).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
    "href",
    "/admin",
  );
});
test("doble clic publica solo una vez y errores conservan campos", async () => {
  let resolve;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    ),
  );
  render(
    <MemoryRouter>
      <ProductForm />
    </MemoryRouter>,
  );
  for (const [label, value] of [
    ["Nombre", "Celular nuevo"],
    ["Precio (S/)", "49.90"],
    ["Descripción", "Descripción de prueba"],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  const file = new File(["foto"], "foto.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Foto"), {
    target: { files: [file] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar producto" }));
  fireEvent.click(screen.getByRole("button", { name: "Guardar producto" }));
  expect(fetch).toHaveBeenCalledTimes(1);
  resolve({
    ok: false,
    status: 400,
    json: async () => ({
      error: {
        message: "Corrige la foto.",
        fieldErrors: { photo: ["La foto no es válida."] },
      },
    }),
  });
  await screen.findByText("La foto no es válida.");
  expect(screen.getByLabelText("Nombre")).toHaveValue("Celular nuevo");
});
