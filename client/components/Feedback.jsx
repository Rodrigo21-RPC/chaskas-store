import React from "react";
export function Feedback({ message, retry, busy = false }) {
  return (
    <div className="feedback" role="status" aria-live="polite">
      <p>
        {busy && <span className="spinner" aria-hidden="true" />}
        {message}
      </p>
      {retry && (
        <button className="secondary" onClick={retry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
