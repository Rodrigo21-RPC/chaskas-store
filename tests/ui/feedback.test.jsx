import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { Feedback } from "../../client/components/Feedback.jsx";
test("mensaje accesible con reintento accionable", () => {
  const retry = vi.fn();
  render(<Feedback message="No se pudo cargar." retry={retry} />);
  expect(screen.getByRole("status")).toHaveTextContent("No se pudo cargar.");
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(retry).toHaveBeenCalledOnce();
});
