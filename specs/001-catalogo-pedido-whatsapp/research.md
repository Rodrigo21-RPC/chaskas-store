# Investigación técnica — Chaska's Store

Fecha: 2026-10-26. Fuentes primarias consultadas y contrastadas para el stack fijado en AGENTS.md. Investigación dividida entre persistencia/seguridad e interfaz/validación; no se instaló ni implementó la aplicación.

## R1. Versiones y comandos

**Decisión**: JavaScript ESM, Node mínimo 22.13.0, React 19, Vite 7, `@vitejs/plugin-react` 5, Tailwind 4 con `@tailwindcss/vite`, React Router 7, Express 5, Zod 4, Multer 2 y Sharp 0.35.5. Pruebas con Vitest 4, Supertest 7, Testing Library React 16, DOM 10 y jsdom 26.1.0. Resolver parches mantenidos dentro de estas líneas y revisar sus engines antes de fijar `package-lock.json` en implementación.

**Motivo**: Node local observado: 25.2.1; npm 11.6.2. Vite 7 y Vitest 4 admiten tanto 22.13 como el entorno observado. Evitar elegir `latest` sin comprobar requisitos transitivos. El contrato >=22.13 exige validar también el mínimo y no solo la máquina actual.

**Alternativas**: Vite 8/Vitest 5 funcionan en Node 22.13, pero Vitest 5 excluye Node 25 en sus engines; jsdom actual eleva el mínimo respecto a 22.13. No se adopta TypeScript ni un segundo gestor de paquetes.

**Fuentes**: [Vite 7.2.2, engines](https://raw.githubusercontent.com/vitejs/vite/v7.2.2/packages/vite/package.json), [Vitest 4.0.8](https://raw.githubusercontent.com/vitest-dev/vitest/v4.0.8/packages/vitest/package.json), [Vitest 5.0.0, exclusión de Node 25](https://raw.githubusercontent.com/vitest-dev/vitest/v5.0.0/packages/vitest/package.json), [plugin React 5.1](https://raw.githubusercontent.com/vitejs/vite-plugin-react/plugin-react@5.1.0/packages/plugin-react/package.json), [React](https://react.dev/versions), [Tailwind con Vite](https://tailwindcss.com/docs/installation/using-vite), [jsdom 26.1.0](https://raw.githubusercontent.com/jsdom/jsdom/v26.1.0/package.json), [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/), [React Router](https://reactrouter.com/start/declarative/installation).

## R2. Persistencia e importes

**Decisión**: SQLite integrado, `DatabaseSync`, sentencias preparadas y consultas cortas; un proceso Express y archivo local persistente. Importes en céntimos enteros, con cálculo y validación final en servidor. Fotos BLOB en la misma fila; alta y retirada atómicas. Cargar resúmenes sin fotos binarias y servir cada foto en ruta dedicada.

**Motivo**: Reduce configuración y evita sincronizar transacciones SQLite con archivos separados. No hay historial, contabilidad ni pedidos persistentes. Un volumen de referencia de 200 productos permite comprobar comportamiento sin convertirlo en un límite comercial.

**Alternativas**: ORM y drivers externos incumplen la preferencia de simplicidad y el módulo integrado elegido; almacenamiento de fotos en disco exige limpieza y consistencia adicional. Servicios remotos no aportan valor a esta versión. BLOB aumenta el tamaño del respaldo; se acepta para este catálogo pequeño.

**Fuente**: [Node 22.13, SQLite](https://nodejs.org/download/release/v22.13.0/docs/api/sqlite.html). Se usan exclusivamente APIs existentes en esa versión; no usar opciones de conexión añadidas después ni copiar ejemplos de Node más nuevo sin revisar su disponibilidad.

## R3. Acceso y límite de ocho horas

**Decisión técnica**: Token opaco aleatorio en cookie HttpOnly, SameSite Strict, Secure en HTTPS; almacenar solo su hash y vencimiento en SQLite. Ningún token en localStorage. Caducidad absoluta de ocho horas desde ingreso, comprobada en cada ruta protegida, sin renovación. Logout revoca el token y borra cookie.

**Motivo**: Permite revocar realmente y medir el vencimiento con reloj controlado, sin agregar usuarios, JWT ni servicios externos. La clave solo proviene de `ADMIN_PASSWORD`.

**Alternativas**: JWT introduce revocación adicional; `express-session` necesita un store apropiado, pues su MemoryStore no es para producción; adaptadores SQLite pueden añadir otro driver. La tabla de sesiones con tokens aleatorios evita estas dependencias.

**Limitación aceptada por el responsable (2026-10-26)**: Usar cookie de sesión y límite absoluto de ocho horas, documentando que restaurar el navegador puede conservar el acceso hasta ese límite. La decisión está integrada en FR-010. Una cookie sin Expires/Max-Age representa una sesión de navegador, pero restaurar ventanas puede restaurarla. No existe una señal fiable de cierre desde la web; no usar unload ni heartbeat para prometer revocación universal. Se descarta exigir clave en cada apertura o recarga, porque no fue la opción elegida. Cerrar sesión revoca siempre el token; el servidor impide acceso a partir del vencimiento incluso con una cookie restaurada.

**Fuentes**: [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie), [express-session, advertencia del store](https://expressjs.com/en/resources/middleware/session/), [Node crypto](https://nodejs.org/download/release/v22.13.0/docs/api/crypto.html).

## R4. Superficie HTTP y fotos

**Decisión**: Mismo origen para web y API, proxy Vite en desarrollo, sin CORS abierto; comprobar Origin/Referer de mutaciones contra APP_ORIGIN. Autenticar antes del multipart; Multer limitado a un archivo de 5 000 000 bytes; firma, MIME y decodificación real con Sharp, admitiendo solo JPG/PNG/WebP. Rechazar dimensión excesiva con límite defensivo de 25 millones de píxeles y mensaje de foto no admitida. No renderizar HTML de descripciones, no exponer archivos del sistema ni registrar claves/cookies.

**Motivo**: El nombre y MIME enviados no prueban que un archivo sea una foto válida. Los límites defensivos reducen uso de memoria del proceso único; validar antes de insertar impide productos incompletos. Respuestas de imagen con tipo fijo y nosniff.

**Alternativas**: Confiar solo en extensión permite archivos falsos; implementar decodificadores propios aumenta complejidad. Sharp incorpora binarios, pero la aplicación sigue escrita en JavaScript y no cambia el almacenamiento integrado.

**Fuentes**: [Express 5](https://expressjs.com/en/guide/migrating-5/), [Multer](https://expressjs.com/en/resources/middleware/multer/), [Sharp instalación](https://sharp.pixelplumbing.com/install/), [Sharp entrada y límites](https://sharp.pixelplumbing.com/api-constructor/), [Zod](https://zod.dev/), [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [OWASP carga de archivos](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

## R5. Pedido y WhatsApp

**Decisión**: Antes de cada agregado desde catálogo o detalle, consultar el producto actual sin caché; crear/incrementar solo ante éxito, sin mutación ante retirada o fallo. Estado React con reducer sencillo y almacenamiento versionado en localStorage. Guardar IDs, cantidades e instantáneas públicas para presentar el pedido en errores de red. El servidor recalcula con catálogo vigente, devuelve todos los IDs retirados incluso en empty y solo prepara enlace para un pedido válido. Capturar sus nombres antes de actualizar la selección y conservar el aviso también junto al estado vacío. Número internacional solo dígitos y mensaje completo codificado con encodeURIComponent. Tras verificar y persistir, navegar en la misma pestaña.

**Motivo**: No hay necesidad de cuentas, tabla de pedidos ni integración de WhatsApp Business. Navegar en la misma pestaña evita depender de ventanas emergentes tras una espera. Abrir un enlace no prueba envío o recepción; la aplicación no puede detectar universalmente el fallo de la app externa.

**Alternativas**: Carrito en servidor exigiría identidad y conservación de datos innecesarias; enviar precios del cliente como autoridad permite importes alterados. Un popup tras await puede bloquearse. No se encontró un máximo oficial fiable para longitud de click-to-chat: no se inventa un límite comercial ni se trunca texto.

**Fuentes**: [WhatsApp click-to-chat](https://faq.whatsapp.com/5913398998672934), [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent), [window.open](https://developer.mozilla.org/en-US/docs/Web/API/Window/open).

## R6. Validación y operación

**Decisión**: Vitest para reglas puras y componentes; Supertest sobre Express con configuración, reloj y DB inyectables; pruebas Node y jsdom separadas. Por regla: escribir prueba, ejecutarla y observar fallo por la regla ausente, implementar y observar pase; cerrar solo con npm test completo en verde. Revisión manual visual/teclado y WhatsApp real adicional, no sustituida por mocks.

**Motivo**: Cubre matemática, autorización, caducidad, persistencia y reconciliación de manera determinista. Las pruebas usan datos temporales, nunca la DB local real. El cierre real del navegador y una app externa necesitan comprobación en navegador.

**Alternativas**: Snapshots masivos no demuestran reglas de negocio; un despliegue distribuido, colas, SSR, telemetría comercial o un panel de métricas no están justificados. Registro de errores operativo mínimo, sin datos sensibles, y respaldo manual con proceso detenido bastan para esta escala inicial.

**Fuentes**: [Vitest guía](https://vitest.dev/guide/), [Supertest](https://github.com/forwardemail/supertest), [Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

## Ajuste de dependencia durante implementación

La auditoría de npm detectó vulnerabilidades heredadas de Sharp 0.34 (GHSA-f88m-g3jw-g9cj, GHSA-rgj7-g3m4-5g8c y GHSA-wq5f-xc86-pv6w). Se actualizó a Sharp 0.35.5, cuyo engine es Node >=20.9 y conserva compatibilidad con el mínimo 22.13 del proyecto. npm audit tras instalar: cero vulnerabilidades. No cambia el alcance del producto.
