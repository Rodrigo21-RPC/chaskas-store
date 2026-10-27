# Implementation Plan: Chaska's Store

**Branch**: `001-catalogo-pedido-whatsapp` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: `specs/001-catalogo-pedido-whatsapp/spec.md`, constitución 1.0.0 y AGENTS.md.

**Estado**: Fases 0 y 1 completas; revisión constitucional aprobada y sin decisiones pendientes. Tareas generadas; ejecución y evidencia en [tasks.md](tasks.md) y [validation.md](validation.md).

## Summary

Aplicación web de una tienda: catálogo de electrónicos, detalle, pedido local con apertura de WhatsApp y administración por clave para agregar y quitar productos. React/Vite/Tailwind sirven las seis vistas de Stitch; Express y node:sqlite mantienen productos, fotos y sesiones. Una API de preparación verifica disponibilidad y calcula precios actuales antes de construir el enlace; no almacena compras ni procesa pagos.

Un paquete npm en raíz y un servidor en producción. SQLite almacena fotos BLOB junto al producto para altas y retiradas atómicas. Pedido versionado en localStorage; clave y destino comercial solo en configuración del servidor. No hay cuentas de clientes, stock, edición de productos ni WhatsApp Business API.

## Technical Context

**Language/Version**: JavaScript ESM y JSX; Node >=22.13.0. Entorno observado: Node 25.2.1/npm 11.6.2. Verificar ambos durante implementación.

**Primary Dependencies**: React 19, Vite 7, plugin React 5, Tailwind 4 con plugin Vite, React Router 7, Express 5, Zod 4, Multer 2, Sharp 0.35.5. Usar APIs de node:sqlite y node:crypto presentes en 22.13; fijar versiones resueltas y engines compatibles en lockfile.

**Storage**: SQLite local persistente en data/chaskas.sqlite: productos con foto BLOB y sesiones con token hasheado; pedido en localStorage del navegador. Sin ORM, drivers SQLite externos ni servicios de archivos.

**Testing**: Vitest 4 con proyectos Node/jsdom 26.1.0; Supertest 7 para HTTP; Testing Library React 16/DOM 10 para comportamiento de UI. Playwright con Edge para recorridos y capturas en DB aislada. Reloj y DB inyectables. Pruebas de negocio ejecutadas primero en rojo y luego en verde por cada regla.

**Target Platform**: Navegadores actuales Chrome/Edge/Firefox/Safari; compra móvil y administración de escritorio. Servidor Node en Windows o Linux, disco local persistente y HTTPS en producción. Desarrollo Vite 5173 con proxy /api a Express 3000; producción mismo origen.

**Project Type**: Aplicación web cliente + servidor en un repositorio y un paquete npm; no monorepo ni microservicios.

**Performance Goals**: Cumplir tiempos de recorridos SC-001/003/007. Objetivo técnico de validación local: lista utilizable dentro de dos segundos tras recibir datos con 200 productos y diez lecturas simultáneas; búsqueda local sin nueva petición por tecla. Las fotos no viajan dentro del JSON de lista. No se promete latencia de servicios externos.

**Constraints**: Español de Perú, soles exactos en céntimos; foto JPG/PNG/WebP hasta 5 MB decimales; una tienda y una clave. Límite absoluto de acceso ocho horas sin renovación. Se usa cookie de sesión; el responsable aceptó que restaurar el navegador puede conservar el acceso hasta el límite absoluto. Ver FR-010 y R3 en research.md.

**Scale/Scope**: Seis pantallas, tres categorías fijas y un proceso. Doscientos productos es un conjunto de prueba, no tope comercial. Sin réplica, balanceador ni despliegue serverless con disco efímero. No se fijan arbitrariamente límites de unidades del pedido; sí se verifica aritmética de enteros seguros.

## Constitution Check

Gate inicial, antes de investigar: principios I–VI compatibles con el alcance y stack obligatorio. Tras investigar y diseñar, se incorporó a FR-010 la decisión del responsable sobre restauración del navegador: cookie de sesión y máximo absoluto de ocho horas. La revisión posterior queda aprobada sin excepciones a la constitución.

| Principio | Evidencia de diseño | Revisión posterior |
| --- | --- | --- |
| I. Simplicidad | Un paquete, proceso y DB; fotos en la misma transacción; carrito local. | Conforme. |
| II. Idioma y mercado | Contrato UI en español, formato S/ y dos decimales; cálculos en céntimos. | Conforme. |
| III. Cero alcance fantasma | Trazabilidad FR-001–020; sin pagos, usuarios cliente, stock, edición ni historial. | Conforme; FR-010 actualizado con la decisión del responsable. |
| IV. Verificación no técnica | Quickstart contiene recorridos y observaciones para SC-001–008. | Conforme; no son resultados ya ejecutados. |
| V. Respeto de datos | Sin datos personales; secretos en entorno; .env.example sin valores reales; sesiones HttpOnly. | Conforme. |
| VI. Pruebas primero | Matriz de reglas, rojo → verde por regla y npm test completo antes de cerrar funcionalidad. | Conforme como plan; ejecución pendiente de implementación. |

**Gate posterior al diseño**: APROBADO. Los seis principios cuentan con evidencia de diseño; la limitación de restauración está aceptada e integrada en spec, contratos y validación. No quedan aclaraciones ni violaciones constitucionales pendientes. Las pruebas y recorridos se ejecutarán durante implementación.

## Project Structure

### Documentation (this feature)

```text
specs/001-catalogo-pedido-whatsapp/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http-api.md
│   └── ui.md
└── checklists/requirements.md
```

La fase de tareas generó [tasks.md](tasks.md) con dependencias y pasos verificables.

### Source Code (repository root)

Estructura acordada e implementada:

```text
package.json
package-lock.json
.env.example
.gitignore
index.html
vite.config.js
vitest.config.js
client/
├── main.jsx
├── App.jsx
├── styles.css
├── api.js
├── components/       # navegación, tarjeta, estados, confirmación y formulario
├── pages/            # catálogo, detalle, pedido, acceso, panel y alta
└── order/            # reducer, persistencia y reconciliación del pedido
server/
├── index.js          # entorno, listen y cierre ordenado
├── app.js            # createApp inyectable, middleware y rutas
├── config.js         # validación del entorno
├── db.js             # abrir DB, esquema inicial y cierre
├── products.js       # consultas preparadas, alta y retirada
├── sessions.js       # tokens, expiración, cookies y autorización
├── order-preview.js  # disponibilidad, totales y WhatsApp
├── photos.js         # límites y validación de imagen
└── routes/           # catálogo público, pedido y administración
shared/
├── validation.js     # categorías y esquemas Zod sin secretos
├── money.js          # conversión/formato de soles y aritmética segura
└── search.js         # normalización y filtros
tests/
├── unit/             # dinero, búsqueda, pedido y validación
├── api/              # catálogo, sesión, fotos, altas, bajas y preview
├── ui/               # interacción y estados por roles/etiquetas
└── fixtures/         # imágenes sintéticas y datos de prueba
data/                # SQLite y auxiliares, ignorados por Git
dist/                # compilación Vite, ignorada por Git
```

**Structure Decision**: Separar cliente, servidor y reglas puras compartidas con un solo manifiesto. El código compartido no importa configuración privada. createApp recibe DB, configuración y reloj para pruebas sin puertos fijos ni datos reales. Módulos por responsabilidad sin capas genéricas de repositorios o servicios.

## Phase 0 — Research

Resultado: [research.md](research.md), decisiones R1–R6 con fuentes primarias, motivos y alternativas. Se verificaron compatibilidad con Node mínimo, SQLite integrado, fotos atómicas, persistencia local, formato click-to-chat y estrategia de pruebas. Se descartaron Vitest 5 por el Node 25 local y jsdom actual por elevar el mínimo. El responsable aceptó la cookie de sesión con ocho horas absolutas y la posible restauración del acceso dentro de ese plazo; la decisión está registrada en la spec.

## Phase 1 — Design & Contracts

Resultados: [data-model.md](data-model.md), [HTTP](contracts/http-api.md), [UI](contracts/ui.md) y [quickstart.md](quickstart.md).

Flujos y límites de responsabilidad:

1. Catálogo: GET de resúmenes, filtrado local y detalle por ID. Cada Agregar consulta de nuevo GET /api/products/:id sin caché antes de crear o incrementar la línea; un 404 o fallo conserva el pedido y no anuncia éxito. La comprobación verifica ese instante, sin prometer actualización instantánea de pestañas ni reserva posterior. Imágenes por endpoint independiente y filtros conservados.
2. Pedido: reducer consolida cantidades solo tras comprobar disponibilidad y localStorage conserva selección. Preview recalcula desde IDs/cantidades y siempre devuelve todos los IDs retirados. Capturar sus nombres desde snapshots antes de sustituir las líneas; mostrar y conservar el aviso también en empty, junto al pedido vacío, con total cero y envío deshabilitado. Con líneas vigentes se exige nueva pulsación; no se crea una venta.
3. WhatsApp: respuesta ready contiene enlace completo codificado; persistir antes de navegar en la misma pestaña. No borrar carrito ni afirmar entrega. Fallo de consulta no produce enlace.
4. Administración: comprobar acceso para panel y en cada operación. Cookie opaca y tabla SQLite garantizan revocación y ocho horas absolutas; restaurar el navegador puede conservar acceso dentro de ese plazo, según FR-010 aprobado. Formulario con errores por campo, bloqueo de doble clic y confirmación de retirada.
5. Guardado: autenticar antes de recibir foto; validar texto, precio, bytes y decodificación; insertar producto/foto de forma atómica. No anunciar éxito ante un fallo o reintentar POST ciegamente.
6. Operación: entorno validado al iniciar, errores en español sin secretos, consultas parametrizadas y origen permitido. DB persistente fuera de dist; respaldos con proceso detenido. No agregar telemetría comercial.

### Dependencias de administración y consulta pública

Las pruebas administrativas aisladas y sesión/fotos de US3 pueden comenzar después de la base. Las operaciones/rutas administrativas de productos T051/T052 reutilizan las consultas públicas y requieren T018/T019 completas. El recorrido de navegador T059 usa el catálogo de US1 completo (T027). Las pruebas administrativas no dependen de US2; T062/T063 sí requieren las dos historias de compra para el ciclo completo. Serializar la integración de archivos compartidos según tasks.md.

## Validation Strategy

Cada regla de negocio debe tener una prueba observada fallando antes de su implementación, luego pasar y formar parte de npm test completo. Configurar Vitest para Node (DB/API/reglas) y jsdom (UI/almacenamiento). Usar reloj controlado para ocho horas, DB temporal para persistencia y fixtures de imagen para límites y falsificaciones. Las pruebas de UI observan roles, etiquetas y resultados, sin duplicar estructura interna.

| Requisitos | Evidencia prevista |
| --- | --- |
| FR-001–003 | Público sin registro; filtro combinado, normalización, detalle, filtros conservados y vacíos. |
| FR-004–006 | Comprobación al agregar desde catálogo/detalle antiguo, sin mutación en 404/error; reducer, mínimo uno, contadores, céntimos y restauración. |
| FR-007–009 | Preview sin precios del cliente, texto íntegro, destino, reconciliación parcial/total y aviso de nombres retirados incluso en empty, sin navegación. |
| FR-010/020 | 401, clave incorrecta, revocación, caducidad absoluta y ausencia de secretos; política de cierre aprobada. |
| FR-011–015 | Panel, alta válida/inválida, foto falsa/límite, doble clic, cancelar/confirmar, bloqueo de agregado desde vista antigua y persistencia tras reabrir DB. |
| FR-016–019 | Estados, idioma/soles, seis referencias, teclado, foco y anchos 360/390/1366. |

SC-001–008 se validan con los recorridos de quickstart, incluida prueba con cinco personas. Revisión visual y WhatsApp real son manuales; no se afirma que jsdom compruebe diseño o apertura de una app externa. Probar npm install/ci, npm test, npm run build y npm start en implementación, incluyendo Node 22.13. La ejecución real de estos comandos está documentada en validation.md; las verificaciones humanas y externas se distinguen de las automáticas.

Scripts previstos: install instala desde raíz; dev ejecuta Vite y Node watch con cierre coordinado; test usa vitest run; build usa vite build; prestart compila y start ejecuta servidor con carga de .env. Producción sirve dist y fallback solo de rutas del cliente, nunca de /api.

## Riesgos y límites operativos

- Restauración del navegador: limitación aceptada en R3 y FR-010. Una cookie de sesión puede restaurarse; comprobar que ni restauración ni actividad superan las ocho horas y que Cerrar sesión revoca siempre.
- Una foto de hasta 5 MB y SQLite síncrono consumen recursos del único proceso. Límites de transporte y decodificación y la prueba de referencia acotan esta versión; cambiar arquitectura requiere nueva necesidad medida.
- localStorage puede estar bloqueado o borrarse, en especial en modo privado. Avisar si falla la persistencia; no tratarlo como sincronización ni respaldo del cliente.
- WhatsApp es externo: enlace preparado no equivale a envío, el número puede ser sintácticamente válido sin cuenta y mensajes extensos pueden encontrar límites de plataforma. Conservar pedido y no truncar silenciosamente.
- Disco efímero o varias réplicas no cumplen la topología de esta versión. Usar volumen persistente y respaldo verificable, sin infraestructura adicional anticipada.
