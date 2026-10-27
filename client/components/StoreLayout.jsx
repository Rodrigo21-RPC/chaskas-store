import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Icon } from "./Icon.jsx";
export function StoreLayout({ count = 0, children }) {
  const { pathname } = useLocation();
  const detail = pathname.startsWith("/productos/");
  return (
    <>
      <a className="skip-link" href="#content">
        Ir al contenido
      </a>
      <header className="store-header">
        <div className="header-inner">
          <Link
            to="/"
            className="brand-mark"
            aria-label="Chaska's Store, catálogo"
          >
            C
          </Link>
          <span className="header-title">
            {detail
              ? "Detalle de producto"
              : pathname === "/mi-pedido"
                ? "Mi pedido"
                : "Catálogo"}
          </span>
          <div className="header-actions">
            <Link to="/mi-pedido" className="order-link">
              <Icon name="bag" />
              <span>Mi pedido</span>
              <b>{count}</b>
            </Link>
            <Link
              to="/admin"
              className="admin-icon"
              aria-label="Acceso de administrador"
            >
              <Icon name="user" />
            </Link>
          </div>
        </div>
      </header>
      <main
        id="content"
        className={`store-main ${detail ? "detail-main" : ""}`}
      >
        {children}
      </main>
      {!detail && (
        <nav className="bottom-nav" aria-label="Navegación de la tienda">
          <NavLink to="/" end>
            <Icon name="store" />
            <span>Catálogo</span>
          </NavLink>
          <NavLink to="/mi-pedido">
            <span className="nav-bag">
              <Icon name="bag" />
              {count > 0 && <b>{count}</b>}
            </span>
            <span>Mi pedido</span>
          </NavLink>
        </nav>
      )}
    </>
  );
}
