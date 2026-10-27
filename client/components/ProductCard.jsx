import React from "react";
import { Link, useLocation } from "react-router-dom";
import { formatMoney } from "../../shared/money.js";
import { ProductImage } from "./ProductImage.jsx";
import { Icon } from "./Icon.jsx";
export function ProductCard({ product, onAdd, eager, busy = false }) {
  const { search } = useLocation();
  return (
    <article className="product-card">
      <Link
        to={`/productos/${product.id}${search}`}
        className="photo-link"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage
          src={product.imageUrl}
          name={product.name}
          eager={eager}
        />
      </Link>
      <Link className="product-name" to={`/productos/${product.id}${search}`}>
        {product.name}
      </Link>
      <strong className="price">{formatMoney(product.priceCents)}</strong>
      <button
        className="primary add-button"
        disabled={!onAdd || busy}
        aria-busy={busy}
        onClick={() => onAdd(product)}
      >
        {busy ? (
          <span className="spinner" aria-hidden="true" />
        ) : (
          <Icon name="bag" />
        )}
        Agregar al pedido
      </button>
    </article>
  );
}
