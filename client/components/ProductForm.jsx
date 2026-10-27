import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { productSchema, fieldErrors } from "../../shared/validation.js";
import { Icon } from "./Icon.jsx";
export function ProductForm() {
  const navigate = useNavigate(),
    form = useRef(null),
    lock = useRef(false);
  const [values, setValues] = useState({
      name: "",
      category: "celulares",
      price: "",
      description: "",
      specifications: "",
    }),
    [file, setFile] = useState(null),
    [preview, setPreview] = useState(""),
    [errors, setErrors] = useState({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!file || !URL.createObjectURL) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    const dirty =
      file ||
      values.name ||
      values.price ||
      values.description ||
      values.specifications;
    const warn = (e) => {
      if (dirty && !lock.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [file, values]);
  function focusError(next) {
    const name = Object.keys(next)[0];
    form.current?.elements.namedItem(name)?.focus();
  }
  function change(e) {
    setValues((old) => ({ ...old, [e.target.name]: e.target.value }));
  }
  async function submit(e) {
    e.preventDefault();
    if (lock.current) return;
    setError("");
    const parsed = productSchema.safeParse(values);
    const next = parsed.success ? {} : fieldErrors(parsed.error);
    if (!file) next.photo = ["Selecciona una foto del producto."];
    else if (file.size > 5000000) next.photo = ["La foto supera los 5 MB."];
    else if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      next.photo = ["Usa una foto JPG, PNG o WebP."];
    setErrors(next);
    if (Object.keys(next).length) {
      focusError(next);
      return;
    }
    lock.current = true;
    setBusy(true);
    const data = new FormData();
    for (const [key, value] of Object.entries(values)) data.set(key, value);
    data.set("photo", file);
    try {
      await api("/api/admin/products", { method: "POST", body: data });
      navigate("/admin?guardado=1", { replace: true });
    } catch (e) {
      if (e.status === 401) navigate("/admin/acceso", { replace: true });
      else {
        setError(
          e.message +
            (e.status ? "" : " Comprueba el panel antes de volver a guardar."),
        );
        if (e.fieldErrors) {
          setErrors(e.fieldErrors);
          focusError(e.fieldErrors);
        }
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const hint = (name) =>
    errors[name]?.length ? (
      <span className="field-error" id={`${name}-error`}>
        {errors[name][0]}
      </span>
    ) : null;
  const props = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: change,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });
  return (
    <form
      ref={form}
      className="product-form"
      onSubmit={submit}
      noValidate
      aria-busy={busy}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          form.current.requestSubmit();
        }
      }}
    >
      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input
            {...props("name")}
            placeholder="Ej. iPhone 15 Pro Max o MacBook Air M3"
            autoComplete="off"
          />
          {hint("name")}
        </div>
        <div className="field">
          <label htmlFor="category">Categoría</label>
          <select {...props("category")}>
            <option value="celulares">Celulares</option>
            <option value="laptops">Laptops</option>
            <option value="accesorios">Accesorios</option>
          </select>
          {hint("category")}
        </div>
        <div className="field full">
          <label htmlFor="price">Precio (S/)</label>
          <input
            {...props("price")}
            inputMode="decimal"
            placeholder="0.00"
            autoComplete="off"
          />
          {hint("price")}
        </div>
        <div className="field full">
          <label htmlFor="description">Descripción</label>
          <textarea
            {...props("description")}
            placeholder="Escribe la descripción general del producto…"
          />
          {hint("description")}
        </div>
        <div className="field full">
          <label htmlFor="specifications">
            Especificaciones <small>(opcional)</small>
          </label>
          <textarea
            {...props("specifications")}
            placeholder="Ej. memoria RAM, procesador, dimensiones, conectividad…"
          />
          {hint("specifications")}
        </div>
        <div className="field full">
          <label htmlFor="photo">Foto</label>
          <div className="photo-upload">
            {preview ? (
              <img src={preview} alt="Vista previa de la foto seleccionada" />
            ) : (
              <Icon name="upload" />
            )}
            <p>Formatos admitidos: JPG, PNG, WebP · Hasta 5 MB</p>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files[0] || null)}
              aria-invalid={Boolean(errors.photo)}
              aria-describedby={errors.photo ? "photo-error" : undefined}
            />
            {file && <small>{file.name}</small>}
          </div>
          {hint("photo")}
        </div>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Link className="secondary button-link" to="/admin">
          Cancelar
        </Link>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <Icon name="check" />
          )}
          Guardar producto
        </button>
      </div>
    </form>
  );
}
