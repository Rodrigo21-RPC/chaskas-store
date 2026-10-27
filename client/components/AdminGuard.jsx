import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api.js";
import { Feedback } from "./Feedback.jsx";
export function AdminGuard({ children }) {
  const [status, setStatus] = useState("checking"),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true,
      timer;
    const c = new AbortController();
    setStatus("checking");
    api("/api/admin/session", { signal: c.signal })
      .then((s) => {
        if (!active) return;
        setStatus("ready");
        timer = setTimeout(
          () => setStatus("login"),
          Math.max(0, s.expiresAt - Date.now()),
        );
      })
      .catch((e) => {
        if (!active || e.name === "AbortError") return;
        if (e.status === 401) setStatus("login");
        else {
          setError(e.message);
          setStatus("error");
        }
      });
    return () => {
      active = false;
      c.abort();
      clearTimeout(timer);
    };
  }, [attempt]);
  if (status === "login") return <Navigate to="/admin/acceso" replace />;
  if (status === "error")
    return <Feedback message={error} retry={() => setAttempt((x) => x + 1)} />;
  if (status !== "ready")
    return <Feedback message="Verificando acceso…" busy />;
  return children;
}
