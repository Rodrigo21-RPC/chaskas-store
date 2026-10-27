import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useOrder } from "../order/OrderProvider.jsx";
import { sumOrder, formatMoney } from "../../shared/money.js";
import { OrderLine } from "../components/OrderLine.jsx";
import { Feedback } from "../components/Feedback.jsx";
import { Icon } from "../components/Icon.jsx";
export function OrderPage({ navigate = (url) => window.location.assign(url) }) {
  const o = useOrder();
  useEffect(() => {
    document.title = "Mi pedido | Chaska's Store";
    if (o.items.length) o.preview();
  }, [o.preview]);
  const { totalCents } = sumOrder(
    o.items.map((x) => ({
      priceCents: x.snapshot.priceCents,
      quantity: x.quantity,
    })),
  );
  async function send() {
    const result = await o.preview();
    if (result?.status === "ready" && result.whatsappUrl)
      navigate(result.whatsappUrl);
  }
  return (
    <div className="order-page">
      <h1>Mi pedido</h1>
      {o.notice && <Feedback message={o.notice} />}
      <div className="order-layout">
        <section aria-label="Productos del pedido">
          {!o.items.length ? (
            <div className="empty-order">
              <Icon name="bag" />
              <h2>Tu pedido está vacío</h2>
              <p>Encuentra tu próximo equipo en el catálogo.</p>
              <Link className="primary" to="/">
                Volver al catálogo
              </Link>
            </div>
          ) : (
            o.items.map((item) => (
              <OrderLine
                key={item.productId}
                item={item}
                busy={o.busy}
                onChange={o.change}
                onRemove={o.remove}
              />
            ))
          )}
        </section>
        <aside>
          <section className="order-summary">
            <h2>Resumen de compra</h2>
            <div>
              <strong>Total</strong>
              <b>{formatMoney(totalCents)}</b>
            </div>
          </section>
          <button
            className="whatsapp-button"
            disabled={!o.items.length || !o.enabled || o.busy}
            onClick={send}
          >
            {o.busy ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              <Icon name="whatsapp" />
            )}
            Enviar pedido por WhatsApp
          </button>
          {o.busy && <p role="status">Verificando pedido…</p>}
          {o.storeError && (
            <Feedback message={o.storeError} retry={o.refreshStore} />
          )}{" "}
          {!o.enabled && !o.storeError && (
            <p className="muted">
              El envío por WhatsApp no está disponible por el momento.
            </p>
          )}
          <p className="payment-note">
            Tu pedido se envía por WhatsApp. No se realiza ningún pago en esta
            página.
          </p>
        </aside>
      </div>
    </div>
  );
}
