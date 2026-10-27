import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { formatMoney } from "../../shared/money.js";
import { categories } from "../../shared/search.js";
import { ProductImage } from "../components/ProductImage.jsx";
import { Feedback } from "../components/Feedback.jsx";
import { Icon } from "../components/Icon.jsx";
export function ProductDetailPage({ onAdd, adding = [] }) {
  const { id } = useParams(),
    { search } = useLocation();
  const [product, setProduct] = useState(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setProduct(null);
    setError("");
    api(`/api/products/${id}`, { signal: c.signal })
      .then((p) => {
        setProduct(p);
        document.title = `${p.name} | Chaska's Store`;
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [id, attempt]);
  return (
    <>
      <div className="detail-toolbar">
        <Link className="back-link" to={`/${search}`}>
          <Icon name="back" />
          Volver
        </Link>
        <span className="store-tag">
          <i />
          CHASKA'S STORE
        </span>
      </div>
      {error ? (
        <Feedback message={error} retry={() => setAttempt((x) => x + 1)} />
      ) : !product ? (
        <Feedback message="Cargando producto…" busy />
      ) : (
        <div className="detail-layout">
          <div className="detail-photo">
            <ProductImage src={product.imageUrl} name={product.name} eager />
          </div>
          <section className="detail-information">
            <p className="category-label">{categories[product.category]}</p>
            <h1>{product.name}</h1>
            <strong className="detail-price">
              {formatMoney(product.priceCents)}
            </strong>
            <div className="description">{product.description}</div>
            {product.specifications && (
              <section className="specifications">
                <h2>Ficha técnica</h2>
                <p>{product.specifications}</p>
              </section>
            )}
            <div className="detail-action">
              <button
                className="primary"
                disabled={!onAdd || adding.includes(id)}
                aria-busy={adding.includes(id)}
                onClick={() => onAdd(product)}
              >
                {adding.includes(id) ? (
                  <span className="spinner" aria-hidden="true" />
                ) : (
                  <Icon name="bag" />
                )}
                Agregar al pedido
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
