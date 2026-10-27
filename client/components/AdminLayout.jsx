import React from "react";
import { Link } from "react-router-dom";
export function AdminLayout({ children }) {
  return (
    <>
      <a className="skip-link" href="#content">
        Ir al contenido
      </a>
      <header className="admin-header">
        <Link to="/" translate="no">
          CHASKA'S STORE
        </Link>
      </header>
      <main id="content" className="admin-main">
        {children}
      </main>
    </>
  );
}
