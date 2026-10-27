# Contrato HTTP — Chaska's Store

API del mismo origen, prefijo `/api`, JSON UTF-8 salvo foto y multipart. Cliente no envía precios al validar pedidos. Fechas: milisegundos UTC. Dinero: enteros en céntimos. Categorías: `celulares`, `laptops`, `accesorios`. Ver [modelo](../data-model.md).

## Formatos comunes

`ProductSummary`: `{ id, name, category, priceCents, imageUrl }`.

`ProductDetail`: los campos del resumen más `description` y `specifications` (texto, vacío si no existe).

Error: `{ error: { code, message, fieldErrors? } }`, con `message` y mensajes por campo en español. Nunca incluye stack, clave, cookie, token ni SQL. `fieldErrors` relaciona los nombres de campo con listas de mensajes.

Estados comunes: 400 entrada mal formada o fuera de rango; 401 acceso ausente o vencido; 403 origen inválido; 404 recurso no disponible; 413 carga demasiado grande; 415 contenido no admitido; 429 demasiados intentos de acceso (con `Retry-After`); 500/503 fallo no confirmado, reintentar. Las respuestas JSON y administrativas usan `Cache-Control: no-store`; los errores `/api/*` no caen en el HTML de la aplicación.

## Catálogo público

| Método y ruta | Entrada | Éxito y comportamiento |
| --- | --- | --- |
| `GET /api/store` | Sin parámetros | 200 `{ name: "Chaska's Store", whatsappEnabled: boolean }`. No expone la clave. |
| `GET /api/products` | Sin parámetros | 200 `{ products: ProductSummary[] }`, orden de creación descendente. Lista vacía válida. |
| `GET /api/products/:id` | UUID | 200 `ProductDetail`; 404 si no existe o se retiró. |
| `GET /api/products/:id/image` | UUID | 200 bytes originales, MIME verificado y `X-Content-Type-Options: nosniff`; 404 sin fila. No se sirve como HTML. |

Para cada Agregar desde catálogo o detalle, consultar GET /api/products/:id con caché desactivada y modificar el pedido solo ante 200 con el producto vigente devuelto. Un 404 informa No disponible y no crea ni incrementa líneas; otro error conserva el pedido y permite reintentar, sin confirmación de agregado. Se verifica disponibilidad en ese instante; una retirada posterior se detecta al revisar o enviar. No se añade una ruta de agregado ni reserva en servidor.

La búsqueda y categoría se combinan en el cliente sobre el listado completo. Normalizar nombre y búsqueda con descomposición Unicode, eliminación de marcas diacríticas, minúsculas y recorte de espacios externos. Coincidencia por subcadena, categoría por igualdad. No se introduce paginación para esta versión.

## Preparar pedido

`POST /api/order/preview`, público, JSON `{ items: [{ productId, quantity }] }`.

- `productId`: UUID; `quantity`: entero seguro positivo. IDs duplicados y entradas inválidas devuelven 400; el cliente ya consolida al agregar. Lista vacía devuelve estado `empty`.
- El servidor consulta los productos vigentes y calcula todos los importes desde SQLite. No acepta precios, subtotales ni total declarados por el navegador.
- Respuesta 200: `{ status, items, removedProductIds, totalUnits, totalCents, whatsappUrl }`.
- Cada `items[]`: `{ productId, name, quantity, unitPriceCents, subtotalCents, imageUrl }`.
- `status`: `empty`, `changed`, `unavailable` o `ready` con prioridad y significado del modelo. `whatsappUrl` es `null` excepto en `ready`. `removedProductIds` siempre es una lista obligatoria con todos los IDs solicitados que ya no existen, también en `empty`; para entrada vacía es [].
- Si `removedProductIds` no está vacío, cualquiera que sea status, capturar los nombres desde las instantáneas antes de sustituir/persistir líneas y mostrar el aviso sin navegar. En `changed` conservar líneas vigentes y exigir nueva pulsación; en `empty` conservar visible el aviso junto al estado vacío, con items=[], totalUnits=0, totalCents=0 y whatsappUrl=null. No descartar el aviso al renderizar el vacío.
- Fallo de consulta: 503, sin enlace; el cliente conserva todo el pedido y permite reintentar. No se realiza una escritura de pedido.
- Verificar enteros seguros en cada multiplicación y suma; si exceden la capacidad, 400 con explicación para reducir cantidades.

Mensaje preparado de ejemplo (los saltos de línea forman parte del texto):

```text
Hola, quiero hacer este pedido en Chaska's Store:

1 x iPhone 15 Pro 256 GB — S/ 4,299.00 c/u — Subtotal: S/ 4,299.00
2 x SSD NVMe 1 TB — S/ 329.00 c/u — Subtotal: S/ 658.00

Unidades: 3
Total: S/ 4,957.00
```

URL: `https://wa.me/{WHATSAPP_NUMBER}?text={encodeURIComponent(message)}`. Configurar número internacional solo con dígitos, sin `+`, espacios ni separadores, longitud compatible con E.164 (8 a 15 dígitos, primero no cero). La validación sintáctica no garantiza que la cuenta exista. Destino ausente o inválido no impide navegar el catálogo, pero devuelve `unavailable` para un pedido vigente.

No truncar el mensaje ni inventar un envío confirmado. Navegar en la misma pestaña después de validar y persistir el pedido; no depender de un popup abierto después de una espera asíncrona. Volver conserva el pedido. No hay callback de entrega, cobro o confirmación desde WhatsApp.

## Acceso administrativo

| Método y ruta | Entrada | Respuesta |
| --- | --- | --- |
| `POST /api/admin/session` | JSON `{ password }` | 200 `{ authenticated: true, expiresAt }` y nueva cookie; 400 vacío, 401 incorrecto. |
| `GET /api/admin/session` | Cookie | 200 `{ authenticated: true, expiresAt }`; 401 ausente o vencida. |
| `DELETE /api/admin/session` | Cookie opcional | 204; revoca la sesión si existe y elimina cookie, también si ya venció. |

Cookie `chaskas_admin`: identificador aleatorio, `HttpOnly`, `SameSite=Strict`, `Path=/api/admin`, `Secure` en HTTPS, sin `Expires` ni `Max-Age` para la sesión. Logout usa expiración pasada y el mismo Path. Expiración absoluta en servidor de 28 800 000 ms, sin renovación por actividad. Según FR-010 aprobado, restaurar el navegador puede conservar la cookie y el acceso antes del vencimiento; nunca permite superar ocho horas ni reutilizar un token revocado con Cerrar sesión. No detectar cierre mediante unload ni prometer revocación por ese evento.

Toda mutación, incluyendo acceso y preparación del pedido, exige `Origin` igual a `APP_ORIGIN`; si falta, comprobar origen de `Referer`, y rechazar cuando ninguno acredita el origen permitido. En desarrollo, Vite conserva el origen del cliente mediante proxy; producción sirve API y cliente del mismo origen. No habilitar CORS abierto ni confiar en Host arbitrario para validar origen.

Limitar intentos de clave incorrecta por IP a cinco por quince minutos, 429 en posteriores hasta terminar la ventana; contador pequeño en memoria con vencimiento, sin guardar contraseña ni IP en registros persistentes. Con proxy, configurar TRUSTED_PROXY con su IP exacta; vacío desactiva confianza, y valores generales o no IP se rechazan. No se bloquea globalmente la cuenta por intentos de terceros.

## Productos administrativos

Autenticar y validar origen antes de procesar cuerpo multipart o modificar datos.

| Método y ruta | Entrada | Respuesta |
| --- | --- | --- |
| `GET /api/admin/products` | Cookie válida | 200 `{ products: ProductSummary[] }`. |
| `POST /api/admin/products` | Cookie y `multipart/form-data` | 201 `ProductDetail` y `Location: /api/products/{id}`. |
| `DELETE /api/admin/products/:id` | Cookie válida y UUID | 204 tras retirar fila y foto; 404 si ya no existe. |

Multipart: campos `name`, `category`, `price` (soles como texto, por ejemplo `4299.00`), `description`, `specifications` opcional; exactamente un archivo `photo`. Precio decimal positivo, hasta dos decimales, sin notación exponencial ni separadores de miles. Se convierte por partes enteras a céntimos; evitar `parseFloat` como validador.

Texto obligatorio se recorta; especificaciones conservan saltos de línea. Límites defensivos de transporte: nombre 500 caracteres, descripción y especificaciones 20 000 cada una; exceder devuelve 400 por campo, sin recortar silenciosamente. Multipart: un archivo de hasta 5 000 000 bytes, cinco campos, seis partes, límites de campo suficientes para esos textos Unicode; carga JSON hasta 1 MB. Son límites técnicos de entrada, no nuevas funciones del catálogo.

Validar firma JPG/PNG/WebP, MIME resultante y decodificación antes de insertar. No basta extensión ni MIME enviado. Rechazar archivo ilegible o falso con 415 y error de `photo`, exceso con 413; cualquier error conserva el catálogo. Almacenamiento BLOB hace atómica el alta con su foto y su retirada. El cliente impide más de un guardado simultáneo y no reintenta automáticamente POST ante respuesta perdida; ofrece comprobar el panel para evitar un alta duplicada.

Confirmación de retirada pertenece a la interfaz; el servidor autoriza la operación y ejecuta una sola eliminación. Cancelar nunca llama DELETE. Si otro intento ya lo retiró, refrescar panel e informar que ya no está disponible.
