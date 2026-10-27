import React from "react";
import { ProductImage } from "./ProductImage.jsx";
import { formatMoney } from "../../shared/money.js";
export function OrderLine({ item, busy, onChange, onRemove }) {
  const { snapshot: p, quantity, productId: id } = item;
  return (
    <article className="order-line">
      <div className="order-image">
        <ProductImage src={p.imageUrl} name={p.name} />
      </div>
      <div className="order-item-content">
        <div className="order-item-heading">
          <h2>{p.name}</h2>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => onRemove(id)}
            aria-label={`Quitar ${p.name}`}
          >
            Quitar
          </button>
        </div>
        <div className="order-item-bottom">
          <div>
            <strong>{formatMoney(p.priceCents * quantity)}</strong>
            <small>{formatMoney(p.priceCents)} c/u</small>
          </div>
          <div className="quantity-controls">
            <button
              disabled={busy || quantity <= 1}
              aria-label={`Disminuir ${p.name}`}
              onClick={() => onChange(id, quantity - 1)}
            >
              −
            </button>
            <span aria-label={`Cantidad de ${p.name}`}>{quantity}</span>
            <button
              disabled={busy}
              aria-label={`Aumentar ${p.name}`}
              onClick={() => onChange(id, quantity + 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
