export async function api(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "No se pudo conectar. Revisa tu conexión y vuelve a intentarlo.",
    );
  }
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw Object.assign(
      new Error(body?.error?.message || "No se pudo completar la operación."),
      { status: response.status, fieldErrors: body?.error?.fieldErrors },
    );
  }
  return body;
}
