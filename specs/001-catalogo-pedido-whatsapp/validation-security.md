# Revisión de acceso, entradas y privacidad

- Clave obligatoria del entorno, sin valor por defecto; .env.example con secretos vacíos. Ninguna clave comercial real utilizada.
- Token aleatorio de 32 bytes, solo hash SHA-256 en SQLite y cookie HttpOnly/SameSite Strict/Path restringido. Secure en producción HTTPS; sin Max-Age/Expires persistentes.
- Ocho horas absolutas, sin renovación; rotación y revocación comprobadas. Cookie restaurada no prolonga acceso.
- Origen exacto o Referer permitido en mutaciones; origen ajeno/ausente rechazado. Sin CORS abierto.
- TRUSTED_PROXY admite una IP exacta y ninguna confianza general. Cinco fallos por IP/quince minutos; prueba con dos IP distintas detrás de proxy conocido.
- Sesión validada antes del multipart. Límite de bytes, campos/partes y decodificación; MIME derivado de contenido y respuesta nosniff. Catálogo intacto en errores.
- Consultas preparadas; texto del producto renderizado por React sin HTML interpretado. API no expone stack, SQL, clave ni token.
- El navegador no proporciona precios autorizados: preview recalcula desde DB y rechaza campos extra, cantidades inválidas y duplicados.
- No se piden datos personales ni de pago. Pedido solo en navegador; sin historial ni tabla de ventas.
- Comprobación final de Git y bundle para excluir .env, DB y valores sintéticos de credenciales se documenta en validation.md. Un despliegue HTTPS real aún debe configurar su origen y proxy; no se afirma haberlo desplegado.
