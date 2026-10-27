export class HttpError extends Error {
  constructor(status, code, message, fieldErrors) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const large =
    error.type === "entity.too.large" || error.code === "LIMIT_FILE_SIZE";
  const malformed = error.type === "entity.parse.failed";
  const multipart = error.name === "MulterError";
  const status = large
    ? 413
    : malformed || multipart
      ? 400
      : error instanceof HttpError
        ? error.status
        : 500;
  const message = large
    ? "El archivo o la solicitud supera el tamaño permitido."
    : malformed
      ? "La solicitud no tiene un formato válido."
      : multipart
        ? "Adjunta una sola foto y los campos del formulario."
        : error instanceof HttpError
          ? error.message
          : "No se pudo completar la operación. Vuelve a intentarlo.";
  res.status(status).json({
    error: {
      code: large
        ? "TOO_LARGE"
        : error instanceof HttpError
          ? error.code
          : "REQUEST_FAILED",
      message,
      ...(error.fieldErrors
        ? { fieldErrors: error.fieldErrors }
        : multipart
          ? { fieldErrors: { photo: [message] } }
          : {}),
    },
  });
}
