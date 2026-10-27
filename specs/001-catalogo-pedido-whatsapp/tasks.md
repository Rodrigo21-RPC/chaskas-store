# Tasks: Chaska's Store — catálogo y pedidos por WhatsApp

**Input**: Documentos de `specs/001-catalogo-pedido-whatsapp/`: [plan](plan.md), [spec](spec.md), [investigación](research.md), [modelo](data-model.md), [HTTP](contracts/http-api.md), [UI](contracts/ui.md) y [validación](quickstart.md).

**Prerequisites**: Plan aprobado, constitución 1.0.0 y aclaración de FR-010 incorporada: cookie de sesión, ocho horas absolutas y posible restauración del navegador antes del vencimiento.

**Tests**: Obligatorios por AGENTS.md y principio VI de la constitución. Cada regla se ejecuta primero en una prueba que falle; después se implementa y se exige `npm test` completo en verde antes de cerrar la funcionalidad. Esta lista planifica trabajo: ninguna casilla implica ejecución ya realizada.

**Organization**: Tres historias P1. US1 catálogo, US2 pedido, US3 administración. Sin pagos, edición, stock, cuentas de clientes ni historial.

## Format: `[ID] [P?] [Story] Description`

- `[P]` indica archivos distintos que pueden trabajarse simultáneamente cuando sus prerrequisitos indicados estén completos; no permite omitir la fase base ni el rojo previo.
- `[US1]`, `[US2]` y `[US3]` corresponden a las historias de la spec. Setup, base y cierre no llevan etiqueta de historia.
- Las rutas son relativas a la raíz del repositorio. Se crean archivos aún inexistentes; se conservan los documentos, diseños y cambios ajenos.

## Path Conventions

Un paquete npm raíz; cliente en `client/`, servidor en `server/`, reglas puras en `shared/` y pruebas en `tests/`. `data/` y `dist/` se excluyen de Git. Referencias visuales en `docs/diseno/01-catalogo-movil.png` a `docs/diseno/06-agregar-producto-escritorio.png`.

## Phase 1: Setup (Shared Infrastructure)

**Propósito**: Inicializar el proyecto y el entorno de pruebas sin anticipar funcionalidades. No ejecutar comandos npm antes de crear y comprobar sus scripts.

- [X] T001 Crear `package.json` y `package-lock.json` con JavaScript ESM, engines Node >=22.13, React 19, Vite 7/plugin React 5, Tailwind 4, React Router 7, Express 5, Zod 4, Multer 2, Sharp 0.35.5, Vitest 4, Supertest 7, Testing Library React 16/DOM 10 y jsdom 26.1.0; resolver parches compatibles según research R1, ejecutar `npm install` y definir scripts dev, test=`vitest run`, build, prestart y start según plan, con cierre coordinado de procesos de desarrollo.
- [X] T002 Configurar `vite.config.js`, `vitest.config.js`, `index.html` y `tests/setup-ui.js`: plugin React/Tailwind, Vite 5173 con proxy /api a 3000, proyectos Vitest Node/jsdom separados y limpieza de mocks/DOM; verificar una prueba de humo del arnés, sin confundirla con pruebas de negocio.
- [X] T003 [P] Crear `.env.example` con ADMIN_PASSWORD y WHATSAPP_NUMBER vacíos y APP_ORIGIN/PORT/DATABASE_PATH/NODE_ENV como en quickstart; actualizar `.gitignore` para .env, node_modules/, data/, dist/, temporales y bases de prueba, sin excluir los documentos ni secretos de ejemplo vacíos.
- [X] T004 [P] Crear `tests/helpers/fixtures.js` y fixtures sintéticos en `tests/fixtures/` para JPG/PNG/WebP válidos, archivo falso, datos de seis productos de tres categorías, rutas temporales aisladas y reloj controlable; ninguna credencial, foto de persona o número real, ni precarga comercial en la app.

**Checkpoint**: Dependencias, scripts y entornos comprobados; T003 y T004 pueden ir en paralelo después de T001/T002.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Propósito**: Infraestructura compartida. Completar T005–T014 antes de iniciar historias. Las pruebas iniciales pueden usar stubs mínimos importables para observar fallos de comportamiento; errores de instalación, sintaxis o módulo inexistente no sirven como evidencia roja.

### Pruebas previas

- [X] T005 [P] Escribir y ejecutar en rojo `tests/unit/money.test.js`: conversión textual de soles sin parseFloat, rechazo de cero/negativos/exponentes/tres decimales, formato `S/ 49.90`/`S/ 4,299.00`, sumas exactas y desbordamiento de enteros seguros; preparar expectativas de 495700 y 462800 céntimos.
- [X] T006 [P] Escribir y ejecutar en rojo `tests/api/infrastructure.test.js` y `tests/unit/config.test.js`: clave vacía impide arranque, destino ausente/inválido no rompe catálogo, número internacional 8–15 dígitos con primero no cero, origen permitido/ajeno/ausente con fallback Referer, errores JSON españoles sin secretos, límite JSON 1 MB y 404 API sin HTML.
- [X] T007 [P] Escribir y ejecutar en rojo `tests/api/database.test.js`: DB temporal vacía, restricciones del producto del modelo, fotos BLOB asociadas, nombres repetidos con IDs distintos, alta/retirada atómicas y reapertura del mismo archivo que conserva productos y fotos; no acceder a data/chaskas.sqlite real.

### Implementación base

- [X] T008 Implementar configuración y comprobación de origen en `server/config.js` y `server/origin.js` para pasar T006: entorno solo del servidor, ADMIN_PASSWORD sin valor por defecto, WHATSAPP_NUMBER ausente/inválido deshabilita envío, origen exacto APP_ORIGIN, fallback Referer y rechazo 403 sin evidencia válida; sin CORS abierto ni confianza indiscriminada en proxy.
- [X] T009 Implementar `shared/money.js` para pasar T005: convertir texto decimal por partes, calcular solo con enteros seguros, impedir multiplicaciones/sumas fuera de rango y formatear soles con coma de miles y punto decimal; no redondear entradas inválidas ni introducir topes comerciales de unidades.
- [X] T010 Implementar `server/db.js` y esquema inicial de products con node:sqlite DatabaseSync y consultas preparadas para pasar T007; respetar literalmente: id «Generado por el servidor; inmutable y nunca reutilizado.»; name «Obligatorio, recortado, distinto de espacios.»; category «`celulares`, `laptops` o `accesorios`; etiquetas públicas con inicial mayúscula.»; price_cents «Positivo, entero seguro en JavaScript. El formulario envía soles como texto decimal; se convierte sin multiplicación de coma flotante.»; description «Obligatoria y distinta de espacios; se presenta completa como texto, sin interpretar HTML.»; specifications «Opcional, vacío por defecto; texto libre que conserva saltos de línea.»; image_bytes «Una foto obligatoria, máximo 5 000 000 bytes (MB decimal).»; image_mime «`image/jpeg`, `image/png` o `image/webp`, derivado de contenido validado.»; created_at «Instante UTC en milisegundos; orden descendente con `id` como desempate.»; no unicidad de nombre ni tabla de pedidos.
- [X] T011 Crear `server/app.js`, `server/index.js` y `server/errors.js` para pasar T006: createApp con DB/config/reloj inyectables, JSON limitado, origen en mutaciones, errores sin stack/clave/SQL, Cache-Control no-store, escucha/cierre ordenado y servicio de dist con fallback solo del cliente usando sintaxis Express 5; no aplicar sesión ni multipart globalmente.
- [X] T012 Crear shell en `client/main.jsx`, `client/App.jsx`, `client/styles.css` y `client/components/StoreLayout.jsx`: React Router, tema oscuro/azul conforme a las referencias, estilos de foco, espacio para barras fijas y rutas base; el shell no anuncia funcionalidades ni resultados ficticios.
- [X] T013 Añadir pruebas rojas en `tests/unit/client-api.test.js` y `tests/ui/feedback.test.jsx`, luego implementar `client/api.js` y `client/components/Feedback.jsx`: lectura de errores por campo, carga/error/reintento accesibles y distinción de fallo de red frente a lista vacía; mantener mensajes españoles y nunca incluir password/token en errores visibles.
- [X] T014 Ejecutar `npm test` para la base y registrar comandos/resultados rojos y verdes de T005–T013 en `specs/001-catalogo-pedido-whatsapp/validation.md`; confirmar separación DB temporal/real y que .env/data no se versionan. No marcar base completa con pruebas fallidas.

**Checkpoint**: Base lista. Tras T014 comienzan US1 y las pruebas aisladas/sesión/fotos de US3; T051/T052 requieren además T018/T019 y la validación pública T059 requiere T027. US2 reutiliza las lecturas de US1; serializar integración de archivos compartidos.

---

## Phase 3: User Story 1 — Encontrar y consultar productos (Priority: P1) — primer incremento

**Objetivo**: Explorar catálogo, buscar/filtrar y ver detalle sin registro. FR-001, FR-002, FR-003 y estados/diseño/idioma aplicables de FR-016–FR-019.

**Prueba independiente**: Cargar seis productos de prueba en DB aislada mediante fixtures, sin requerir US3; buscar por nombre y categoría, consultar descripción y volver conservando filtros. Comprobar catálogo vacío y búsqueda sin coincidencias. Agregar al pedido se integra en US2; este incremento demuestra consulta.

### Pruebas primero

- [X] T015 [P] [US1] Escribir y ejecutar en rojo `tests/api/catalog.test.js` para GET /api/store, /api/products, /api/products/:id y /api/products/:id/image: formato exacto del contrato, catálogo vacío, orden, JSON sin BLOB, bytes/MIME/nosniff, 404 de detalle/foto retirados y ausencia de datos privados sin autenticación.
- [X] T016 [P] [US1] Escribir y ejecutar en rojo `tests/unit/search.test.js`: nombre parcial, normalización Unicode sin tildes/mayúsculas, espacios externos, combinación con categoría, Todos y categoría inválida; sin llamadas de red por tecla.
- [X] T017 [P] [US1] Escribir y ejecutar en rojo `tests/ui/catalog.test.jsx` y `tests/ui/product-detail.test.jsx`: tarjetas/detalle por roles, búsqueda y filtros en q/categoria, regreso conservado, descripción completa, especificaciones vacías, estados de carga/error/vacío y reemplazo de foto; sin pedir datos del cliente.

### Implementación

- [X] T018 [US1] Implementar lecturas públicas parametrizadas en `server/products.js`: resúmenes sin BLOB, detalle y foto por ID, orden created_at descendente con id de desempate y 404 para filas inexistentes; pasar las pruebas de consultas de T015 usando el esquema T010.
- [X] T019 [US1] Implementar `server/routes/catalog.js` y montar en `server/app.js` los cuatro GET de T015, con nombre Chaska's Store y whatsappEnabled desde configuración; servir solo el MIME validado sin ruta proporcionada por usuarios y pasar T015 completo.
- [X] T020 [US1] Implementar `shared/search.js` para pasar T016 con filtro local combinado; Todos es filtro y no categoría asignable, sin paginación ni ordenamientos no pedidos.
- [X] T021 [US1] Crear `client/components/ProductCard.jsx` con foto, nombre consultable, precio formateado y acción Agregar al pedido preparada para el manejador real de US2; nombres legibles, reemplazo de foto y texto alternativo según T017, sin mostrar confirmación de agregado si aún no hay manejador.
- [X] T022 [US1] Implementar `client/pages/CatalogPage.jsx`: GET de listado, búsqueda y filtros q/categoria, vista de Todos, tarjetas y estados diferenciados; usar T020/T021 y mantener parámetros al regresar desde detalle para pasar T017.
- [X] T023 [US1] Implementar `client/pages/ProductDetailPage.jsx`: foto, categoría, nombre, precio, descripción sin truncar, especificaciones opcionales como texto y Volver; estado Producto no disponible y sin agregar en 404, conforme a T017.
- [X] T024 [US1] Integrar catálogo/detalle y ruta desconocida en `client/App.jsx` y acceso administrativo en `client/components/StoreLayout.jsx`; navegación / y /productos/:id, sin iconos de compartir/favoritos ni cuentas de clientes. Los destinos de pedido y administración se completan en sus historias.
- [X] T025 [US1] Ajustar `client/styles.css`, `client/components/ProductCard.jsx` y vistas T022/T023 para las referencias `docs/diseno/01-catalogo-movil.png` y `docs/diseno/02-detalle-producto-movil.png`: dos columnas cuando quepan, acción inferior visible, superficies oscuras y teclado/foco sin contenido tapado.
- [X] T026 [US1] Ejecutar `npm test` completo, verificar el recorrido independiente con fixtures en 360/390 píxeles y cronometrar búsqueda/detalle bajo un minuto (SC-001); registrar resultados y capturas de las dos vistas en `specs/001-catalogo-pedido-whatsapp/validation.md` y `docs/validacion/` sin datos reales.
- [X] T027 [US1] Revisar contrato de catálogo y FR-001–FR-003/FR-016–FR-019 en `tests/api/catalog.test.js`, `tests/ui/catalog.test.jsx` y `specs/001-catalogo-pedido-whatsapp/validation.md`; cerrar US1 solo con sus escenarios aprobados y sin afirmar que el flujo de pedido ya está implementado.

**Checkpoint**: Catálogo y detalle demostrables de forma independiente con datos de prueba; catálogo real sigue comenzando vacío. No precargar los ejemplos de Stitch.

---

## Phase 4: User Story 2 — Armar el pedido y llevarlo a WhatsApp (Priority: P1)

**Objetivo**: Agregar, modificar y conservar una selección, validar disponibilidad y preparar el mensaje dirigido a la tienda. FR-004–FR-009 y elementos comunes aplicables.

**Prueba independiente**: Con productos fixture, un artículo de S/ 4,299.00 y dos de S/ 329.00 producen tres unidades y S/ 4,957.00 en pantalla y mensaje; al reducir uno producen dos unidades y S/ 4,628.00. Se prueba sin panel de administración usando retiro directo en la DB temporal.

### Pruebas primero

- [X] T028 [P] [US2] Escribir y ejecutar en rojo `tests/unit/order-reducer.test.js`: una línea por producto, agregar incrementa, mínimo uno, quitar, contador de unidades, subtotales y total exactos, cantidades inválidas y desbordamiento; no suponer límite comercial de stock.
- [X] T029 [P] [US2] Escribir y ejecutar en rojo `tests/unit/order-storage.test.js`: persistir/restaurar versión 1 y snapshots públicos, consolidar duplicados, recuperar entradas válidas de JSON dañado, claves desconocidas y almacenamiento bloqueado/agotado con aviso y estado en memoria, sin token ni datos personales.
- [X] T030 [P] [US2] Escribir y ejecutar en rojo `tests/api/order-preview.test.js`: POST /api/order/preview con solo IDs/cantidades, duplicados o entradas inválidas 400, recálculo con DB y estados en prioridad empty → changed → unavailable → ready; retirados, incluido el único producto y todos los productos con removedProductIds obligatorio y completo en empty, items=[], unidades/total cero y enlace nulo; consulta fallida 503, enlace solo ready, texto/encodeURIComponent y destino internacional del contrato.
- [X] T031 [P] [US2] Escribir y ejecutar en rojo `tests/ui/order.test.jsx`: agregar desde ambas vistas, confirmación y contadores, cantidades/Quitar, persistencia al remontar, aviso sin pago, comprobación actual al agregar desde tarjeta/detalle antiguos sin crear/incrementar ni anunciar éxito ante 404/error; verificación al entrar y enviar, retirada parcial con nueva pulsación y retirada total con aviso de nombres visible tras persistir vacío, total cero y envío deshabilitado; destino inválido y fallo sin navegación; cubrir edición durante verificación y respuestas fuera de orden para impedir envío de una selección anterior; volver de WhatsApp no vacía ni confirma recepción.

### Implementación

- [X] T032 [US2] Implementar `client/order/reducer.js` para pasar T028; respetar «Una línea por `productId`; lista vacía representa pedido vacío.» y cantidad «Entero seguro mayor o igual a uno.»; producto identificado por UUID, sin duplicar filas ni derivar stock.
- [X] T033 [US2] Implementar `client/order/storage.js` para pasar T029 en clave `chaskas.order.v1`: version «Valor `1`.», productId «Referencia a producto.», snapshot «`name`, `priceCents`, `imageUrl` públicos; respaldo de presentación, nunca autoridad de precio o disponibilidad.»; no persistir totales derivados, claves o datos personales.
- [X] T034 [US2] Implementar `server/order-preview.js` sobre las lecturas de T018 y dinero T009 para pasar T030: snapshot coherente de productos vigentes, unidades/subtotales/total enteros seguros, todos los IDs retirados aun en empty, unidades/total cero si no quedan líneas y prioridad de estados; sin tabla de pedidos ni escritura de mensaje, ignorar como autoridad los snapshots del navegador.
- [X] T035 [US2] Implementar `server/routes/order.js` y montarlo en `server/app.js`: validar cuerpo con Zod, IDs duplicados/UUID/cantidades según contrato, origen permitido, 200 estados o 400/503; enlace wa.me solo para ready, número desde entorno, mensaje completo con tienda/líneas/importes/unidades y sin envío automático; pasar T030 completo.
- [X] T036 [US2] Crear `client/order/OrderProvider.jsx` y `client/order/reconcile.js`: conectar reducer/persistencia y preview, capturar nombres de retirados desde instantáneas antes de sustituir/persistir líneas y mantener su aviso también en empty, sincronizar solo respuestas correspondientes al pedido actual y conservar selección ante fallos; si cambia la cantidad durante una verificación descartar esa respuesta o bloquear edición hasta terminar, sin navegar con un pedido viejo; pasar casos de T031.
- [X] T037 [US2] Conectar Agregar al pedido en `client/components/ProductCard.jsx`, `client/pages/CatalogPage.jsx` y `client/pages/ProductDetailPage.jsx`: consultar GET /api/products/:id sin caché antes de cada alta o incremento desde ambas vistas, usar el producto devuelto en 200 y solo entonces consolidar/anunciar éxito; 404 o error no crea ni incrementa líneas ni contador, muestra aviso/reintento y evita doble comprobación del mismo producto; pasar los casos de T028/T031 de ambas entradas.
- [X] T038 [US2] Crear `client/pages/OrderPage.jsx` y `client/components/OrderLine.jsx`: foto/nombre/unitario/cantidad/subtotal/Quitar, mínimo uno, resumen/total, pedido vacío con Volver al catálogo y botón WhatsApp según disponibilidad; texto exacto de FR-008 y estado verificando, sin formulario de datos personales.
- [X] T039 [US2] Implementar el envío en `client/pages/OrderPage.jsx`: validar de nuevo al pulsar, ante retirados capturar nombres y actualizar/avisar para cualquier status; si quedan líneas exigir revisión+nueva pulsación, si no quedan mantener aviso junto a vacío con total cero y envío deshabilitado; ante fallo conservar y reintentar, persistir antes de navegar con location.assign en la misma pestaña solo para ready; no borrar selección ni afirmar entrega/pago y pasar T031.
- [X] T040 [US2] Integrar provider/ruta /mi-pedido en `client/App.jsx` y contadores de suma de unidades en `client/components/StoreLayout.jsx`; navegación inferior Catálogo/Mi pedido conserva selección y filtros, sin duplicar estado del contador.
- [X] T041 [US2] Ajustar `client/styles.css`, `client/pages/OrderPage.jsx` y `client/components/OrderLine.jsx` a `docs/diseno/03-mi-pedido-movil.png`: cantidades legibles, total destacado, WhatsApp verde, aviso sin pago y barras sin tapar controles, con teclado/foco y nombres completos disponibles.
- [ ] T042 [US2] Ejecutar `npm test` completo y recorrido fixture SC-002/SC-008; revisar mensaje real en WhatsApp sin enviarlo, retorno intacto, intento de agregado desde vista anterior a la retirada sin incremento, retirados parciales y retirada del único/todos los productos con aviso aun en vacío, y fallo de red; registrar resultados/capturas en `specs/001-catalogo-pedido-whatsapp/validation.md` y `docs/validacion/`.
- [X] T043 [US2] Repetir los casos de edición durante verificación y respuestas fuera de orden de `tests/ui/order.test.jsx`, cuyo rojo corresponde a T031; corregir `client/order/reconcile.js` si fallan y repetir `npm test`; cerrar FR-004–FR-009 con evidencia en `specs/001-catalogo-pedido-whatsapp/validation.md` y sin pruebas que simulen un mensaje enviado.

**Checkpoint**: US1+US2 completan compra conversacional con fixtures y sin depender del panel; la operación autónoma de la tienda requiere US3.

---

## Phase 5: User Story 3 — Administrar el catálogo (Priority: P1)

**Objetivo**: Acceso por clave, altas con foto, retirada confirmada y cierre/revocación de acceso. FR-010–FR-015/FR-020 y estados/diseño aplicables. Las pruebas aisladas y sesión/fotos pueden comenzar después de la base. Operaciones/rutas de productos T051/T052 requieren T018/T019; recorrido público T059 requiere T027. El ciclo con pedido T062/T063 requiere además US2.

**Prueba independiente**: Con DB y clave de prueba inyectadas, verificar acceso, alta/listado/retirada administrativos, cancelación desde UI, persistencia y caducidad con reloj controlado, sin US2. La comprobación pública por ID/404 requiere T018/T019; el recorrido real como visitante y SC-003 requiere US1 completa en T027. Sin datos de clientes ni envío de WhatsApp.

### Pruebas primero

- [X] T044 [P] [US3] Escribir y ejecutar en rojo `tests/api/admin-session.test.js`: POST/GET/DELETE /api/admin/session, clave vacía/incorrecta, cookie HttpOnly/SameSite/Path/Secure sin vencimiento persistente, token nuevo y revocación del anterior, antes/a ocho horas sin renovación, token restaurado vencido, logout idempotente, 401 sin sesión y cinco fallos por IP/quince minutos con 429+Retry-After.
- [X] T045 [P] [US3] Escribir y ejecutar en rojo `tests/api/admin-products.test.js`: GET/POST/DELETE /api/admin/products, autorización antes del multipart, origen ajeno, alta atómica, campos inválidos, nombres repetidos, límite de textos, cero o múltiples archivos, exceso de campos/partes, retirada/404, foto junto a producto y persistencia tras reabrir DB; incluir guardar después de caducar sin cambio de catálogo.
- [X] T046 [P] [US3] Escribir y ejecutar en rojo `tests/unit/photos.test.js`: JPG/PNG/WebP reales, firma/MIME falsos, decodificación fallida, cero/múltiples archivos, 5 000 000 bytes admitidos y un byte más rechazado, límite de 25 millones de píxeles y ausencia de publicación en error; usar fixtures sintéticos válidos y límites inyectables cuando sea necesario.
- [X] T047 [P] [US3] Escribir y ejecutar en rojo `tests/ui/admin.test.jsx` y `tests/ui/product-form.test.jsx`: acceso/panel protegidos, errores de clave, campos y foto, Cancelar sin alta, doble clic un POST, fallo conserva campos, guardado confirma y vuelve, retirada nombra/cancela/confirma con foco, sesión caducada y logout sin publicación automática pendiente.

### Implementación

- [X] T048 [US3] Extender `server/db.js` para admin_sessions y crear `server/sessions.js` pasando T044: token_hash «SHA-256 del token aleatorio de 32 bytes; el token original solo viaja en cookie HttpOnly.»; created_at «Inicio del acceso en milisegundos UTC.»; expires_at «`created_at + 28 800 000`; nunca se renueva por actividad.»; respetar `now >= expires_at`, limpiar vencidas y nunca almacenar la clave; comparación de resúmenes de longitud fija en tiempo constante.
- [X] T049 [US3] Implementar `server/routes/admin-session.js` y `server/login-limit.js`, montar en `server/app.js` y pasar T044 completo: cookie de sesión chaskas_admin Path=/api/admin, Secure bajo HTTPS, máximo ocho horas, logout borra cookie/fila, cinco intentos incorrectos por IP en quince minutos sin bloqueo global ni registro persistente de IP/clave; restauración del navegador solo antes del límite aprobado.
- [X] T050 [US3] Implementar `shared/validation.js` y `server/photos.js` para T045/T046: campos obligatorios recortados, categoría fija, precio positivo hasta dos decimales sin exponentes/miles, especificaciones opcionales conservan líneas; límites de transporte nombre 500 y descripción/especificaciones 20 000 caracteres; un archivo máximo 5 000 000 bytes y 25 millones de píxeles, firma y decodificación JPG/PNG/WebP con Sharp, sin confiar en nombre/MIME recibidos.
- [X] T051 [US3] Después de T018/T019, extender `server/products.js` con alta/retirada parametrizadas y atómicas para T045: UUID nuevo no reutilizado, nombre no único, BLOB y datos juntos, sin foto inválida ni fila parcial, DELETE elimina producto/foto y 404 si ya no existe; no crear edición ni borrado lógico/historial.
- [X] T052 [US3] Después de T018/T019, T049 y T051, crear `server/routes/admin-products.js` y montar en `server/app.js` para T045 completo: GET autenticado, POST multipart con photo y cinco campos/seis partes, autenticar antes de recibir bytes, 201+Location con ProductDetail, DELETE 204/404, errores 400/401/403/413/415 por campo y sin filtrar secretos.
- [X] T053 [US3] Crear `client/components/AdminGuard.jsx` y `client/pages/AdminLoginPage.jsx`: verificar GET de sesión antes de renderizar panel/alta, clave oculta sin pedir usuario/correo, error vacío/incorrecto/límite y redirección al panel solo tras POST correcto; usar 401 para volver a acceso sin ejecutar automáticamente operaciones pendientes y pasar T047.
- [X] T054 [US3] Crear `client/pages/AdminPanelPage.jsx`: tabla foto/nombre/categoría/precio/Quitar, Agregar producto, Cerrar sesión, vacío y carga/error/reintento; GET administrativo y precios en soles, sin métricas ni funciones de edición; pasar estados de T047.
- [X] T055 [US3] Crear `client/components/ProductForm.jsx` y `client/pages/NewProductPage.jsx`: nombre/categoría/precio/descripción/especificaciones/foto, validación y errores asociados conservando demás campos, Cancelar sin POST, bloqueo inmediato de doble clic y alta multipart; éxito vuelve al panel con confirmación, fallo incierto ofrece comprobar panel sin reintentar POST automáticamente; pasar T047.
- [X] T056 [US3] Crear `client/components/ConfirmRemoveDialog.jsx` y conectarlo en `client/pages/AdminPanelPage.jsx`: nombrar producto, Cancelar no llama DELETE, confirmar retira/actualiza con éxito, fallo mantiene estado sin fingir retirada y 404 concurrente informa producto ausente; gestionar foco según contrato y pasar T047.
- [X] T057 [US3] Integrar /admin/acceso, /admin y /admin/productos/nuevo en `client/App.jsx` y logout en `client/pages/AdminPanelPage.jsx`: revocar servidor, borrar estado local de autorización, impedir volver con contenido sensible cacheado y solicitar clave tras 401 o vencimiento; no almacenar token/password en localStorage.
- [X] T058 [US3] Ajustar `client/styles.css` y vistas administrativas a `docs/diseno/04-acceso-administrador-escritorio.png`, `docs/diseno/05-panel-administracion-escritorio.png` y `docs/diseno/06-agregar-producto-escritorio.png`: tarjeta centrada completa aunque referencia esté recortada, tabla, campos y botones azul/rojo, 1366 píxeles sin cortes y adaptación legible a móvil.
- [X] T059 [US3] Después de T027 y T058, ejecutar `npm test` completo y recorrido administrativo/público SC-003/SC-004 con publicación menor de dos minutos, retirada menor de treinta segundos y 401 tras logout; registrar pruebas, capturas y tiempos en `specs/001-catalogo-pedido-whatsapp/validation.md` y `docs/validacion/`.
- [X] T060 [US3] Verificar manualmente sesión con restauración desactivada/activada y comprobar con reloj de prueba ocho horas y formulario abierto en `tests/api/admin-session.test.js`/`tests/ui/admin.test.jsx`; documentar en `specs/001-catalogo-pedido-whatsapp/validation.md` que no se exige detección universal del cierre ni se renueva el plazo.
- [X] T061 [US3] Verificar producto/foto persistentes después de reiniciar y copiado/restauración de DB con proceso detenido en ubicación de prueba; ejecutar `tests/api/database.test.js` y `tests/api/admin-products.test.js`, registrar rutas temporales y resultados sin secretos en `specs/001-catalogo-pedido-whatsapp/validation.md`.
- [X] T062 [US3] Con US1/US2 integradas, añadir y ejecutar prueba de integración en `tests/api/product-lifecycle.test.js` que publique, consulte, incluya en preview, retire y compruebe 404, rechazo de agregado desde vista antigua y reconciliación parcial/total con aviso de nombres también en empty; las reglas ya tienen rojo previo en T015/T030/T045, no forzar un fallo artificial. Si se detecta defecto, conservar el caso fallando antes de corregir `server/products.js`/rutas y pasar `npm test`, sin reincorporar un ID retirado al volver a publicar.
- [X] T063 [US3] Revisar FR-010–FR-015/FR-020 y contratos de administración en `specs/001-catalogo-pedido-whatsapp/validation.md`: ninguna clave/token en respuestas públicas, logs o dist, ningún alta tras sesión vencida, ningún pago/stock/edición añadido; cerrar US3 con `npm test` completo aprobado.

**Checkpoint**: Tienda operable por su administrador y recorrido de catálogo/pedido compatible con altas y retiradas reales.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Propósito**: Verificación conjunta de alcance, usabilidad, operación y documentación; no sustituye pruebas rojas previas por una ronda de pruebas tardía.

- [X] T064 [P] Revisar las seis vistas con teclado y foco, etiquetas, errores anunciados, diálogos y barras a 360/390/1366 píxeles; registrar comparación SC-005/SC-006 con `docs/diseno/` en `specs/001-catalogo-pedido-whatsapp/validation-ui.md`, listando cualquier desviación concreta para corregirla antes de cerrar.
- [X] T065 [P] Revisar límites operativos y privacidad en `specs/001-catalogo-pedido-whatsapp/validation-security.md`: cookies HTTPS, origen ajeno, clave/token fuera de logs/dist, fotos falsas/grandes y DB/.env fuera de Git; comprobar flujo público sin datos personales y sin modificar la arquitectura aprobada.
- [X] T066 Corregir únicamente fallos de T064/T065 en `client/styles.css`, componentes afectados de `client/` y módulos afectados de `server/`; por cada regla defectuosa agregar primero caso que falle en `tests/ui/` o `tests/api/`, pasar `npm test` y registrar qué se corrigió en `specs/001-catalogo-pedido-whatsapp/validation.md`.
- [X] T067 Verificar conjunto aislado de 200 productos y diez lecturas concurrentes con `tests/api/catalog.test.js` y recorrido local; observar listado utilizable dentro de dos segundos tras respuesta y JSON sin BLOB, sin imponer un tope comercial; registrar medición/entorno en `specs/001-catalogo-pedido-whatsapp/validation.md` y corregir solo problemas demostrados.
- [ ] T068 Ejecutar con cinco personas nuevas el recorrido SC-007 de `specs/001-catalogo-pedido-whatsapp/quickstart.md`: al menos cuatro llegan al mensaje de dos productos en menos de tres minutos sin ayuda y explican dónde se paga; registrar resultados anónimos y tiempos en `specs/001-catalogo-pedido-whatsapp/validation.md`, sin inventar participantes ni marcar éxito si faltan pruebas.
- [X] T069 Actualizar `README.md`, `.env.example` y `specs/001-catalogo-pedido-whatsapp/quickstart.md` con los scripts realmente implementados, requisitos, carga inicial vacía, fotos/DB persistentes, respaldo/restauración y política de sesión aprobada; mantener secretos/número real ausentes y guía HTTP local diferenciada de HTTPS productivo.
- [X] T070 Validar instalación limpia `npm ci`, `npm test`, `npm run build` y `npm start` con Node 22.13 y Node local compatible, más `npm run dev` y cierre coordinado; comprobar enlaces directos del cliente y 404 JSON API según `package.json` y registrar salidas resumidas/reales en `specs/001-catalogo-pedido-whatsapp/validation.md` sin afirmar checks no ejecutados.
- [X] T071 Revisar cobertura final FR-001–FR-020 y SC-001–SC-008 contra esta lista y `specs/001-catalogo-pedido-whatsapp/validation.md`; ejecutar `npm test` después del último cambio, actualizar casillas solo con evidencia y reflejar estado real en `specs/README.md`, dejando pendientes explícitos si falta validación humana o de entorno.

---

## Dependencies & Execution Order

### Dependencias de fases

```text
Setup T001–T004
       ↓
Base T005–T014
       ├── US1: T015–T027 ──→ US2: T028–T043
       +-- US3: T044-T050 --> T051-T061 -----+
           T018/T019 ------> T051/T052     |
           T027 -----------> T059          |
                                  ↓
                    Integración T062–T063
                                  ↓
                    Cierre T064–T071
```

US3 conserva pruebas administrativas aisladas y trabajo de sesión/fotos después de la base, sin depender de US2. T051/T052 sí requieren lecturas/rutas de US1 en T018/T019; T059 usa US1 completa en T027 para el recorrido público. US2 depende de T018/T019 y se ejecuta después de US1 en la ruta recomendada. T062/T063 requieren US1 y US2 completas, además de administración. La publicación operable del producto requiere las tres historias y el cierre, pues el catálogo empieza vacío.

### Dependencias dentro de fases

- Setup: T001 → T002; T003/T004 después de ambos. Base: T005/T006/T007 pueden ejecutarse juntos; T008 depende de T006, T009 de T005, T010 de T007, T011 de T008/T010, T012 de Setup, T013 de T011/T012 y T014 de toda la base. No empezar historias antes de T014.
- US1: T015/T016/T017 son pruebas paralelas; completar su rojo antes de implementación. T018 → T019; T020 después de T016; T021 después de T017; T022 depende de T019/T020/T021; T023 de T019/T021; T024–T027 siguen la integración. No modificar App.jsx o styles.css en paralelo sin separar commits y coordinar integración.
- US2: T028–T031 son pruebas paralelas después de US1. T032/T033 dependen de sus pruebas; T034 → T035 depende de T030 y lecturas; T036 depende de T032/T033/T035 y del rojo de concurrencia T031; T037–T041 integran las vistas; T042/T043 cierran repitiendo los casos ya definidos, antes de corregir cualquier defecto demostrado.
- US3: T044–T047 son pruebas paralelas tras la base. T048 → T049 y T050 → T051 → T052 conforman servidor; T051 y T052 también requieren T018/T019; T052 requiere T049. T053–T058 integran UI tras sus pruebas y endpoints; T059 requiere T027 antes de la comprobación como visitante; T059–T061 validan. T062 requiere US1/US2 y T061; T063 sigue a T062. Si US3 corre junto a US1, serializar escrituras en server/products.js, server/app.js, client/App.jsx y client/styles.css.
- Cierre: T064/T065 independientes; T066 depende de ambos, luego T067/T068 → T069 → T070 → T071. Una corrección posterior invalida la evidencia afectada y exige repetir sus comprobaciones.

### Disciplina de pruebas y evidencia

Para cada archivo de pruebas ejecutar `npm test -- tests/.../archivo.test.js` y observar que falla por la regla ausente. Luego implementar, repetir el archivo y ejecutar `npm test` completo antes de cerrar la funcionalidad. Cada tarea que añade una regla durante integración incluye primero su caso rojo. El arnés y stubs mínimos deben permitir ejecutar las pruebas; un fallo de importación no demuestra la regla. Registrar comandos, resultado y alcance en validation.md; nunca marcar en verde una prueba humana que no se realizó.

### Parallel Example: User Story 1

Después de T014: T015 (`tests/api/catalog.test.js`), T016 (`tests/unit/search.test.js`) y T017 (`tests/ui/catalog.test.jsx`, `tests/ui/product-detail.test.jsx`) pueden prepararse/ejecutarse sin modificar archivos compartidos. Sus implementaciones y rutas respetan las dependencias anteriores; no se ejecuta implementación en paralelo a su prueba roja aún incompleta.

### Parallel Example: User Story 2

Después de US1: T028 (`tests/unit/order-reducer.test.js`), T029 (`tests/unit/order-storage.test.js`), T030 (`tests/api/order-preview.test.js`) y T031 (`tests/ui/order.test.jsx`) permiten trabajo paralelo por archivos. Reducer, persistencia y preview se integran solo después de los fallos correspondientes, en T036.

### Parallel Example: User Story 3

Después de T014: T044 (sesión), T045 (contrato de productos), T046 (fotos) y T047 (interfaz administrativa) usan archivos distintos y DB/fixtures aislados. Cada worker conserva su evidencia roja; se integra secuencialmente en rutas y App.jsx. Estos ejemplos describen oportunidades futuras, no ordenan crear agentes durante este comando.

## Implementation Strategy

### MVP e incrementos

1. Setup/base y US1 permiten una demostración independiente de catálogo con fixtures. Es el primer incremento revisable, todavía no una tienda operable.
2. US2 permite demostrar selección y mensaje de WhatsApp sin datos personales. Validar números e importes antes de añadir administración.
3. US3 permite cargar el catálogo real vacío y mantenerlo sin desarrollador. Es parte del MVP publicable, junto con US1/US2 y las verificaciones finales; ninguna de las tres historias P1 se descarta.
4. Ejecutar cierre, corregir defectos con pruebas primero y mantener en specs/README.md la diferencia entre implementado y validado. El siguiente paso documental sugerido es `$speckit-analyze` antes de `$speckit-implement`.

### Trazabilidad de requisitos

| Requisito | Tareas principales |
| --- | --- |
| FR-001 | T015, T017, T019, T024 |
| FR-002 | T015–T022 |
| FR-003 | T017, T019, T023–T027 |
| FR-004 | T028, T031–T032, T036–T037, T040 |
| FR-005 | T005, T009, T028, T032, T038 |
| FR-006 | T029, T033, T036, T040, T042 |
| FR-007 | T030, T034–T035, T039, T042 |
| FR-008 | T031, T038, T042 |
| FR-009 | T030–T031, T034–T036, T039, T043, T062 |
| FR-010 | T044, T048–T049, T053, T057, T060 |
| FR-011 | T045, T047, T052, T054 |
| FR-012 | T045, T047, T050–T052, T055 |
| FR-013 | T005, T007, T009–T010, T045–T046, T050, T055 |
| FR-014 | T031, T037, T045, T047, T051–T052, T056, T062 |
| FR-015 | T007, T010, T045, T051, T061 |
| FR-016 | T006, T013, T017, T030–T031, T038, T047, T054 |
| FR-017 | T005, T009, T019, T025, T035, T041, T058 |
| FR-018 | T012, T025, T041, T058, T064 |
| FR-019 | T013, T017, T031, T047, T056, T064–T066 |
| FR-020 | T003, T006, T008, T015, T044, T048–T049, T063, T065 |

SC-001: T026; SC-002: T042; SC-003: T059; SC-004: T059/T060; SC-005 y SC-006: T064/T066; SC-007: T068; SC-008: T042/T059/T062. T071 comprueba cobertura conjunta y evidencia final.

## Notes

- Todos los IDs son únicos y consecutivos. Casillas inicialmente pendientes; [P] no elimina dependencias ni autoriza modificar un archivo compartido al mismo tiempo.
- Respetar las restricciones literales citadas y completar los detalles de transporte del contrato; no reinterpretar MB como MiB ni adoptar otra caducidad.
- Evitar pruebas que solo copian la implementación o snapshots masivos. Verificar resultados observables, autorización, exactitud de importes y efectos reales sobre DB temporal.
- Este comando genera tareas; no instala dependencias, implementa código, crea commits ni declara aprobadas pruebas de la aplicación.

## Estado de ejecución

Implementación y verificaciones técnicas completadas: 69/71 tareas. Las casillas T042 y T068 permanecen pendientes por requerir validación externa real; no se sustituyen por mocks o participantes simulados.

- T042: código, importes, persistencia, retiradas y URL del mensaje comprobados en navegador; falta revisar el destino y texto dentro de WhatsApp con el número comercial real.
- T068: faltan los resultados de cinco personas nuevas según SC-007.
- T071: revisión final realizada, con esos pendientes reflejados en specs/README.md y validation.md. No se declara completa la aceptación externa del producto.

Evidencia: [validation.md](validation.md), [interfaz](validation-ui.md), [seguridad](validation-security.md), [resultados de navegador](../../docs/validacion/browser-results.json) y [arranque](../../docs/validacion/runtime-results.json).
