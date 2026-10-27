# Modelo de datos — Chaska's Store

Fuente: [spec.md](spec.md). Persistencia local en un archivo SQLite, accedido con `node:sqlite`. No se almacenan compras confirmadas ni información personal del cliente.

## Producto (`products`)

| Campo | Representación | Regla |
| --- | --- | --- |
| `id` | TEXT, UUID, clave primaria | Generado por el servidor; inmutable y nunca reutilizado. |
| `name` | TEXT | Obligatorio, recortado, distinto de espacios. |
| `category` | TEXT | `celulares`, `laptops` o `accesorios`; etiquetas públicas con inicial mayúscula. |
| `price_cents` | INTEGER | Positivo, entero seguro en JavaScript. El formulario envía soles como texto decimal; se convierte sin multiplicación de coma flotante. |
| `description` | TEXT | Obligatoria y distinta de espacios; se presenta completa como texto, sin interpretar HTML. |
| `specifications` | TEXT | Opcional, vacío por defecto; texto libre que conserva saltos de línea. |
| `image_bytes` | BLOB | Una foto obligatoria, máximo 5 000 000 bytes (MB decimal). |
| `image_mime` | TEXT | `image/jpeg`, `image/png` o `image/webp`, derivado de contenido validado. |
| `created_at` | INTEGER | Instante UTC en milisegundos; orden descendente con `id` como desempate. |

Validar con Zod antes de persistir y respaldar categoría, precio y obligatoriedad con restricciones SQLite. El nombre no es único: dos artículos pueden tener el mismo nombre; la identidad siempre es `id`. No hay precio editable, stock, SKU, variantes, descuentos ni categorías administrables.

La foto se recibe con multipart limitado, se verifica por firma y decodificación y se guarda en la misma operación que el producto. No se guarda el nombre o ruta enviados por el cliente. Las respuestas JSON omiten el BLOB y exponen `imageUrl = /api/products/{id}/image`.

Transiciones: formulario válido → producto publicado; confirmación de Quitar → eliminación definitiva de la fila y su foto. Cancelar y validar con error no escriben. Un identificador retirado da 404 en detalle y foto. El pedido del navegador puede conservar referencias antiguas hasta reconciliarse.

## Acceso administrativo (`admin_sessions`)

| Campo | Representación | Regla |
| --- | --- | --- |
| `token_hash` | TEXT, clave primaria | SHA-256 del token aleatorio de 32 bytes; el token original solo viaja en cookie HttpOnly. |
| `created_at` | INTEGER | Inicio del acceso en milisegundos UTC. |
| `expires_at` | INTEGER | `created_at + 28 800 000`; nunca se renueva por actividad. |

No se almacena la clave en SQLite. Se compara la clave recibida con `ADMIN_PASSWORD` usando resúmenes de longitud fija y comparación de tiempo constante. Cada ingreso correcto crea un token nuevo y revoca la sesión previa de esa cookie, si existe. Logout elimina su fila y borra la cookie. En cada ruta protegida, `now >= expires_at` invalida el token antes de cualquier lectura administrativa o escritura. Limpiar filas vencidas al iniciar y al autenticar.

Cookie de sesión sin Expires/Max-Age: finalizar la sesión del navegador normalmente elimina el acceso, pero su restauración puede conservarlo hasta el vencimiento absoluto de ocho horas. Esta limitación fue aceptada en FR-010; el servidor verifica el límite en cada operación y logout revoca el token aunque el navegador lo restaure. Ver [research.md](research.md).

## Pedido del navegador (`chaskas.order.v1`)

Objeto JSON versionado en `localStorage`, sin tokens ni datos personales:

| Campo | Representación | Regla |
| --- | --- | --- |
| `version` | número | Valor `1`. |
| `items` | lista | Una línea por `productId`; lista vacía representa pedido vacío. |
| `items[].productId` | UUID | Referencia a producto. |
| `items[].quantity` | número entero | Entero seguro mayor o igual a uno. |
| `items[].snapshot` | objeto | `name`, `priceCents`, `imageUrl` públicos; respaldo de presentación, nunca autoridad de precio o disponibilidad. |

Subtotal y total son derivados, no una segunda fuente persistida. Operaciones y sumas deben permanecer dentro de enteros seguros; rechazar un incremento que exceda esa capacidad con explicación. No se fija un límite comercial arbitrario de productos o unidades.

Transiciones: agregar crea línea o incrementa solo tras consulta actual satisfactoria del producto; 404 o fallo no cambia la selección ni confirma agregado; disminuir se detiene en uno; Quitar elimina la línea; navegar y recargar restauran; abrir WhatsApp no modifica; reconciliar reemplaza datos públicos vigentes y excluye IDs retirados. Un UUID nuevo tras volver a publicar no resucita una línea retirada.

Al leer, validar versión, estructura y cantidades; recuperar entradas válidas, consolidar IDs repetidos y avisar si hubo datos irrecuperables. Si el almacenamiento está bloqueado o agotado, mantener el estado actual en memoria y avisar que no podrá conservarse tras cerrar; no afirmar persistencia lograda.

## Resumen validado del pedido (transitorio)

Se deriva de IDs y cantidades enviados al servidor y productos actuales consultados en una lectura coherente. Incluye líneas vigentes con nombre, precio y subtotal; unidades totales, total en céntimos, `removedProductIds`, estado y URL de WhatsApp cuando corresponde. No crea tablas de pedidos ni guarda el mensaje.

Estados: `empty` si no quedan líneas; `changed` si se retiró al menos una y quedan otras; `unavailable` si hay líneas pero falta destino válido; `ready` si está listo. La prioridad es empty → changed → unavailable → ready. Solo `ready` incluye enlace; después de `changed` se exige otra pulsación con el pedido revisado. removedProductIds siempre contiene todos los IDs retirados solicitados, incluso en empty. Si todos fueron retirados: items=[], totalUnits=0, totalCents=0 y enlace nulo. Capturar nombres desde snapshots antes de sustituir la selección y conservar visible el aviso junto al estado vacío.

## Configuración y persistencia

`ADMIN_PASSWORD` y `WHATSAPP_NUMBER` se leen del entorno; `APP_ORIGIN`, `PORT`, `DATABASE_PATH`, `NODE_ENV` y `TRUSTED_PROXY` son configuración operativa. No se envía la clave al cliente. El número comercial aparece únicamente en el enlace necesario para conversar y no se trata como una credencial secreta.

Archivo SQLite y posibles archivos auxiliares quedan en `data/`, ignorados por Git. Las pruebas crean bases temporales o en memoria, sin tocar datos de desarrollo. Respaldar el archivo con el proceso detenido, restaurar en una ubicación de prueba y verificar catálogo y fotos; el respaldo se trata como datos privados por contener sesiones. Un solo proceso y almacenamiento local persistente son la topología de esta versión.
