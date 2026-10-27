import { expect, test } from "vitest";
test("el arnés ejecuta JavaScript y admite enteros seguros", () => {
  expect(Number.isSafeInteger(429900 + 2 * 32900)).toBe(true);
});
