# Evidencia de implementación

## Entorno y alcance

Node 25.2.1, npm 11.6.2; rama 001-catalogo-pedido-whatsapp. No hay datos de catálogo ni credenciales reales precargados. Pruebas con DB temporal y fixtures sintéticos.

## T001–T014 — base

- npm install: completado. Sharp actualizado a 0.35.5 por aviso real de npm audit; auditoría posterior: cero vulnerabilidades.
- Rojo observado: npm test con stubs importables, 41 pruebas fallaron y una de arnés pasó. Fallos esperados: valores por defecto vacíos, ausencia de restricciones y endpoints, mensajes no renderizados. El primer intento previo a terminar instalación no se cuenta como rojo.
- Verde: npm test -- tests/unit/money.test.js tests/unit/config.test.js tests/unit/client-api.test.js tests/unit/harness.test.js tests/api/infrastructure.test.js tests/api/database.test.js tests/ui/feedback.test.jsx: 42/42.
- Node 25 expone localStorage fuera de jsdom: el setup usa explícitamente jsdom.window.localStorage. SQLite emite su advertencia experimental propia del módulo de Node, sin fallo.

## T015–T024 — catálogo y detalle

- Rojo: nueve pruebas fallaron en búsqueda, contratos públicos y vistas con stubs, antes de implementar esas reglas.
- Verde: npm test completo: 51/51, once archivos.
- Diseño visual y recorrido de navegador todavía pendientes de comprobación; no se marcan como aprobados.

## Pedido — pruebas e integración

- Rojo: quince pruebas fallaron antes de reducer, persistencia, preview y vista del pedido.
- Verde posterior: npm test completo, 66/66.
- La regresión específica de respuesta antigua se comprobó sin la protección de revisión: falló y sobrescribió cantidad dos con uno; tras implementar el descarte de respuesta antigua pasó y conserva dos. No se atribuye ese caso adicional al rojo inicial.
- El enlace de WhatsApp se captura en el navegador y se verifica su texto decodificado; no se envió ningún mensaje real ni se verificó una cuenta comercial real.

## Administración — pruebas primero

- Rojo: dieciocho pruebas fallaron antes de fotos, sesiones, endpoints y formularios administrativos.
- Verde posterior: npm test completo, 84/84.
- Fotos reales JPG/PNG/WebP, firma falsa, archivo ilegible, tamaño exacto de 5 000 000 bytes y exceso comprobados.
- Autorización antes del multipart: se reprodujo ECONNRESET al rechazar una carga no autorizada de 5 MB mientras se transmitía. Se descarta el flujo sin analizarlo antes de responder 401; la prueba pasó después de corregirlo.
- Sesión: rotación, hash en DB, revocación, cookie HttpOnly/SameSite/Path/Secure y vencimiento justo antes/a las ocho horas con reloj controlado.

## Revisión independiente y correcciones

La skill requesting-code-review solicitó una revisión de solo lectura. Se confirmaron tres defectos y se añadieron cuatro pruebas rojas: recuperación de configuración comercial, confirmación de alta visible y límite por IP detrás de proxy conocido, incluida validación de configuración. Las pruebas fallaron antes y pasaron después. La segunda revisión no encontró problemas importantes adicionales en esas correcciones.

También se reprodujo con prueba roja una categoría desconocida de URL llamada toString que no activaba Todos. Se corrigió usando pertenencia propia al conjunto de categorías.

## Navegador y volumen

Ver docs/validacion/browser-results.json y capturas 01–06. Edge headless usa catálogo, fotos y clave sintéticos en una base temporal, eliminada al finalizar; no se modifica el catálogo local.

- Seis publicaciones desde formulario y aviso visual de éxito; cancelación sin publicar.
- Búsqueda/filtro/detalle/regreso con estado conservado.
- Totales S/ 4,957.00 y S/ 4,628.00; recarga y retorno conservan selección.
- Tarjeta antigua no incrementa; retirada parcial/total conserva nombres en el aviso, aun en vacío.
- Diálogo, Escape, devolución de foco, logout y acceso protegido posterior.
- Anchos 360/390/1366 sin desbordamiento horizontal y sin errores JavaScript de página.
- Perfil cerrado/reabierto conserva pedido; cookie de sesión restaurada permite acceso antes del límite y se rechaza a las ocho horas.
- Catálogo de 200 productos con diez lecturas concurrentes; mediciones reales en browser-results.json. No implica un límite comercial.
- Copia y restauración de DB con proceso detenido conservan catálogo y fotos.

## Instalación, ejecución y compatibilidad

- npm ci completado usando explícitamente Node 22.13.0 y npm CLI; cero vulnerabilidades en la auditoría.
- npm start y npm run dev verificados con Node 25.2.1 y 22.13.0, incluidos enlace profundo, catálogo vacío, API 404 JSON y proxy/origen en desarrollo. Los procesos creados por la validación se detuvieron al terminar.
- Pruebas completas con Node mínimo: 90/90 antes de la última regresión de categoría. El resultado final actualizado se añade después de las últimas comprobaciones.
- Build de Vite comprobado con ambas versiones. Rollup informa sobre anotaciones de comentarios de Zod que elimina; no falla la compilación. SQLite emite su advertencia experimental de Node.

## Verificaciones externas pendientes

- T042: confirmar destinatario y mensaje dentro de WhatsApp con el número comercial real configurado. Solo se probó el enlace completo sin envío externo.
- T068 / SC-007: cinco personas nuevas, al menos cuatro sin ayuda en menos de tres minutos y comprensión de pago fuera de la página. No hay participantes ni resultados inventados.
- No se ha desplegado en un dominio HTTPS real. La configuración Secure/origen/proxy se verificó en pruebas; el despliegue no forma parte de este trabajo local.

## Resultado final comprobado

- Node 25.2.1: npm test, **91/91**, 21 archivos aprobados.
- Node 22.13.0: Vitest run, **91/91**, 21 archivos aprobados.
- Build de Vite final aprobado con ambas versiones; cliente compilado sin clave, número sintético de pruebas ni ADMIN_PASSWORD del servidor.
- npm audit: **cero vulnerabilidades**. npm ci limpio con Node mínimo completado.
- Navegador final ejecutado con servidor Node 22.13: **10 comprobaciones aprobadas**; ninguna excepción JavaScript de página.
- Seis altas por UI: máximo 518 ms con datos preparados; recorrido búsqueda/detalle/regreso: 367 ms. Son mediciones automatizadas locales, no resultados de cinco participantes.
- 200 productos y diez lecturas concurrentes: 329 ms; catálogo utilizable en 656 ms. Fixtures aislados, sin BLOB en JSON.
- npm start / npm run dev comprobados tanto con Node local como mínimo; procesos de prueba detenidos. Browser y runtime se ejecutan por separado, pues compilar dist durante el recorrido puede interrumpir una solicitud de la validación.
- Git ignora .env, data/, node_modules/ y dist/; .env.example queda disponible y contiene clave/número vacíos. No se añadieron secretos reales. La publicación posterior se comprueba en el historial de Git.
- 69/71 tareas marcadas como completadas. T042 y T068 siguen pendientes por las comprobaciones externas descritas arriba. Los checklists de calidad no fueron modificados.
