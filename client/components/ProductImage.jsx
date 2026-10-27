import React, { useState } from "react";
import { Icon } from "./Icon.jsx";
export function ProductImage({ src, name, eager = false }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div
      className="image-placeholder"
      role="img"
      aria-label={`Sin foto: ${name}`}
    >
      <Icon name="bag" />
      <span>Foto no disponible</span>
    </div>
  ) : (
    <img
      src={src}
      alt={name}
      loading={eager ? "eager" : "lazy"}
      width="400"
      height="400"
      onError={() => setFailed(true)}
    />
  );
}
