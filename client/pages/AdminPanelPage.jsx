import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { formatMoney } from "../../shared/money.js";
import { categories } from "../../shared/search.js";
import { ProductImage } from "../components/ProductImage.jsx";
import { Feedback } from "../components/Feedback.jsx";
import { ConfirmRemoveDialog } from "../components/ConfirmRemoveDialog.jsx";
export function AdminPanelPage() {
  const navigate = useNavigate(),
    location = useLocation(),
    lock = useRef(false);
  const [products, setProducts] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(() =>
      new URLSearchParams(location.search).get("guardado")
        ? "Producto guardado correctamente."
        : "",
    ),
    [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    document.title = "Panel de administración | Chaska's Store";
    const c = new AbortController();
    api("/api/admin/products", { signal: c.signal })
      .then((d) => setProducts(d.products))
      .catch((e) => {
        if (e.name === "AbortError") return;
        if (e.status === 401) navigate("/admin/acceso", { replace: true });
        else setError(e.message);
      });
    return () => c.abort();
  }, [attempt, navigate]);
  async function remove() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/products/" + selected.id, { method: "DELETE" });
      setProducts((old) => old.filter((x) => x.id !== selected.id));
      setNotice("Producto retirado del catálogo.");
      setSelected(null);
    } catch (e) {
      if (e.status === 401) navigate("/admin/acceso", { replace: true });
      else if (e.status === 404) {
        setProducts((old) => old.filter((x) => x.id !== selected.id));
        setNotice("El producto ya no está disponible.");
        setSelected(null);
      } else {
        setSelected(null);
        setError(e.message);
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function logout() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await api("/api/admin/session", { method: "DELETE" });
      navigate("/admin/acceso", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-title-row">
        <h1>Panel de administración</h1>
        <div>
          <Link className="primary button-link" to="/admin/productos/nuevo">
            Agregar producto
          </Link>
          <button className="text-button" onClick={logout} disabled={busy}>
            Cerrar sesión
          </button>
        </div>
      </div>
      {notice && <Feedback message={notice} />}
      {error && (
        <Feedback
          message={error}
          retry={() => {
            setError("");
            setAttempt((x) => x + 1);
          }}
        />
      )}
      {products === null && !error ? (
        <Feedback message="Cargando productos…" busy />
      ) : products?.length === 0 ? (
        <Feedback message="El catálogo está vacío. Agrega tu primer producto." />
      ) : (
        products && (
          <div className="table-shell">
            <table>
              <caption className="sr-only">Productos publicados</caption>
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-photo">
                        <ProductImage src={p.imageUrl} name={p.name} />
                      </div>
                    </td>
                    <td className="table-name">{p.name}</td>
                    <td>{categories[p.category]}</td>
                    <td className="table-price">{formatMoney(p.priceCents)}</td>
                    <td>
                      <button
                        className="danger"
                        onClick={() => setSelected(p)}
                        disabled={busy}
                        aria-label={`Quitar ${p.name}`}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      {selected && (
        <ConfirmRemoveDialog
          product={selected}
          busy={busy}
          onCancel={() => setSelected(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}
