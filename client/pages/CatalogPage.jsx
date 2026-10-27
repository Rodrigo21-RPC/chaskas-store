import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { categories, filterProducts } from "../../shared/search.js";
import { ProductCard } from "../components/ProductCard.jsx";
import { Feedback } from "../components/Feedback.jsx";
import { Icon } from "../components/Icon.jsx";
export function CatalogPage({ onAdd, adding = [] }) {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    document.title = "Catálogo | Chaska's Store";
    const controller = new AbortController();
    setError("");
    api("/api/products", { signal: controller.signal })
      .then((data) => setProducts(data.products))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [attempt]);
  const query = params.get("q") || "",
    requestedCategory = params.get("categoria") || "todos",
    category = Object.hasOwn(categories, requestedCategory)
      ? requestedCategory
      : "todos";
  function filter(key, value) {
    const next = new URLSearchParams(params);
    if (value && value !== "todos") next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  const visible = filterProducts(products || [], query, category);
  return (
    <>
      <div className="catalog-heading">
        <div>
          <span className="eyebrow">TECNOLOGÍA A TU ALCANCE</span>
          <h1 translate="no">
            Chaska's <span>Store</span>
            <i />
          </h1>
        </div>
      </div>
      <label className="search-field">
        <Icon name="search" />
        <span className="sr-only">Buscar productos</span>
        <input
          type="search"
          value={query}
          placeholder="Buscar celulares, laptops…"
          onChange={(e) => filter("q", e.target.value)}
        />
      </label>
      <div className="filters" aria-label="Categorías">
        {[["todos", "Todos"], ...Object.entries(categories)].map(
          ([id, name]) => (
            <button
              key={id}
              className={
                category === id || (!categories[category] && id === "todos")
                  ? "active"
                  : ""
              }
              aria-pressed={
                category === id || (!categories[category] && id === "todos")
              }
              onClick={() => filter("categoria", id)}
            >
              {name}
            </button>
          ),
        )}
      </div>
      {error ? (
        <Feedback message={error} retry={() => setAttempt((x) => x + 1)} />
      ) : products === null ? (
        <Feedback message="Cargando catálogo…" busy />
      ) : products.length === 0 ? (
        <Feedback message="El catálogo está vacío. Pronto tendremos novedades para ti." />
      ) : visible.length === 0 ? (
        <Feedback
          message="No encontramos productos con esos filtros."
          retry={() => setParams({})}
        />
      ) : (
        <div className="product-grid">
          {visible.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              eager={i < 2}
              onAdd={onAdd}
              busy={adding.includes(p.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
