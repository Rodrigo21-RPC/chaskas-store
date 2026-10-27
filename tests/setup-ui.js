import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
// Node 25 también ofrece localStorage: las pruebas de UI deben usar el del DOM.
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: globalThis.jsdom.window.localStorage,
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
