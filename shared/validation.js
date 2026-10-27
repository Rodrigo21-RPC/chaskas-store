import { z } from "zod";
import { parsePrice } from "./money.js";
export const productSchema = z
  .object({
    name: z
      .string({ error: "Escribe el nombre del producto." })
      .trim()
      .min(1, "Escribe el nombre del producto.")
      .max(500, "Usa hasta 500 caracteres."),
    category: z.enum(["celulares", "laptops", "accesorios"], {
      error: "Elige Celulares, Laptops o Accesorios.",
    }),
    price: z
      .string({ error: "Escribe el precio." })
      .trim()
      .refine((value) => {
        try {
          parsePrice(value);
          return true;
        } catch {
          return false;
        }
      }, "Escribe un precio mayor que cero con hasta dos decimales."),
    description: z
      .string({ error: "Escribe una descripción." })
      .trim()
      .min(1, "Escribe una descripción.")
      .max(20000, "Usa hasta 20 000 caracteres."),
    specifications: z
      .string()
      .max(20000, "Usa hasta 20 000 caracteres.")
      .optional()
      .default(""),
  })
  .strict()
  .transform(({ price, ...rest }) => ({
    ...rest,
    priceCents: parsePrice(price),
  }));
export function fieldErrors(error) {
  const result = {};
  for (const issue of error.issues) {
    const field = issue.path[0] || "form";
    (result[field] ??= []).push(issue.message);
  }
  return result;
}
