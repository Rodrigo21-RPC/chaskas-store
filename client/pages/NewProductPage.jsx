import React, { useEffect } from "react";
import { ProductForm } from "../components/ProductForm.jsx";
export function NewProductPage() {
  useEffect(() => {
    document.title = "Agregar producto | Chaska's Store";
  }, []);
  return (
    <>
      <h1 className="new-product-title">Agregar producto</h1>
      <ProductForm />
    </>
  );
}
