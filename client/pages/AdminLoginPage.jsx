import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { Icon } from "../components/Icon.jsx";
export function AdminLoginPage() {
  const navigate = useNavigate(),
    lock = useRef(false),
    input = useRef(null);
  const [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    document.title = "Acceso de administrador | Chaska's Store";
  }, []);
  async function submit(e) {
    e.preventDefault();
    if (lock.current) return;
    if (!password.trim()) {
      setError("Ingresa la clave de administrador.");
      input.current.focus();
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/session", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      navigate("/admin", { replace: true });
    } catch (e) {
      setError(e.message);
      input.current.focus();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="login-wrap">
      <form className="login-card" onSubmit={submit} noValidate>
        <div className="login-symbol">
          <Icon name="user" />
        </div>
        <h1>
          Acceso de
          <br />
          administrador
        </h1>
        <p>Ingresa tu clave para administrar el catálogo.</p>
        <label htmlFor="admin-password">Clave de administrador</label>
        <input
          ref={input}
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "login-error" : undefined}
        />
        {error && (
          <p className="field-error" id="login-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}Ingresar
        </button>
        <Link className="back-to-store" to="/">
          Volver al catálogo
        </Link>
      </form>
    </section>
  );
}
