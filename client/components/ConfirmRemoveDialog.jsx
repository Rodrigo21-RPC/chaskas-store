import React, { useEffect, useRef } from "react";
export function ConfirmRemoveDialog({ product, busy, onCancel, onConfirm }) {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current,
      previous = document.activeElement;
    if (node.showModal) node.showModal();
    else node.setAttribute("open", "");
    return () => {
      if (node.open && node.close) node.close();
      previous?.focus();
    };
  }, []);
  function key(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (!busy) onCancel();
    }
    if (e.key === "Tab") {
      const buttons = [
        ...dialog.current.querySelectorAll("button:not(:disabled)"),
      ];
      if (!buttons.length) {
        e.preventDefault();
        return;
      }
      const first = buttons[0],
        last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="remove-title"
      aria-describedby="remove-description"
      onKeyDown={key}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="remove-title">¿Quitar este producto?</h2>
      <p id="remove-description">
        {product.name} dejará de estar disponible en el catálogo.
      </p>
      <div className="dialog-actions">
        <button
          autoFocus
          className="secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancelar
        </button>
        <button
          className="danger"
          aria-label="Confirmar retirada"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy && <span className="spinner" aria-hidden="true" />}Quitar
          producto
        </button>
      </div>
    </dialog>
  );
}
