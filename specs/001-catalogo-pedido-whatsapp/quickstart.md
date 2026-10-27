# Guía de ejecución y validación

Estado: aplicación implementada. Scripts de instalación, desarrollo, pruebas y servidor compilado verificados con Node 22.13 y Node 25.2.1. La evidencia real y las verificaciones externas pendientes están en [validation.md](validation.md). Ver [plan.md](plan.md), [modelo](data-model.md), [API](contracts/http-api.md) e [interfaz](contracts/ui.md).

## Preparación

1. Usar Node >=22.13.0 con node:sqlite disponible. Validar instalación, pruebas y build tanto con 22.13 como con la versión local soportada; la planificación observó Node 25.2.1.
2. Desde la raíz, comprobar los scripts y engines del package.json.
3. Ejecutar `npm install` y conservar package-lock.json. En una instalación reproducible con lock existente, `npm ci`.
4. En PowerShell, copiar la plantilla: `Copy-Item -LiteralPath .env.example -Destination .env`. Completar clave administrativa local y número comercial de prueba autorizado; no versionar .env ni compartir sus valores.
5. Ejecutar `npm run dev`. Abrir `http://localhost:5173`; API interna en puerto 3000 mediante proxy. Para validar producción local, detener desarrollo y ejecutar `npm start`, que compila mediante prestart y sirve en `http://localhost:3000`; ajustar APP_ORIGIN a ese origen antes de iniciarlo.

Variables de .env.example (sin secretos ni números reales):

```dotenv
ADMIN_PASSWORD=
WHATSAPP_NUMBER=
APP_ORIGIN=http://localhost:5173
PORT=3000
DATABASE_PATH=./data/chaskas.sqlite
NODE_ENV=development
TRUSTED_PROXY=
```

ADMIN_PASSWORD vacía impide iniciar el servidor con un error de configuración; no hay clave por defecto. WHATSAPP_NUMBER ausente o inválida deshabilita envío sin impedir catálogo. Para probar npm start local por HTTP mantener NODE_ENV=development y usar APP_ORIGIN=http://localhost:3000. En despliegue real definir NODE_ENV=production, APP_ORIGIN con el origen HTTPS público y disco persistente para DATABASE_PATH; no se publican variables con prefijo VITE_ que contengan la clave. Verificar allí la cookie Secure bajo HTTPS.

## Comandos y resultado

| Comando desde raíz | Resultado esperado |
| --- | --- |
| `npm install` | Dependencias compatibles instaladas; ningún engine incompatible con Node mínimo. |
| `npm run dev` | Vite y Express observando cambios; al detener se cierran ambos. |
| `npm test` | Vitest run, sin modo observación; reglas de negocio, API y componentes en verde. |
| `npm run build` | Cliente compilado en dist/ sin secretos del servidor. |
| `npm start` | prestart compila y Express sirve cliente/API con fallback para rutas del cliente. |

No ejecutar procesos de dev y producción simultáneamente sobre la misma DB. Los ejemplos de precios siguientes se cargan manualmente en una DB de validación; no implican datos precargados en el producto.

## Pruebas primero

Antes de implementar cada regla escribir su prueba y ejecutar el archivo correspondiente con `npm test -- ruta/al/archivo.test.js`. Confirmar fallo por comportamiento ausente, no por error de configuración. Implementar lo mínimo, repetir el archivo y después `npm test`. Registrar el resultado rojo y verde al cerrar la tarea. No crear una prueba vacía para simular el ciclo.

| Grupo | Comprobaciones automáticas exigidas |
| --- | --- |
| Catálogo, FR-001–FR-003 | Listado vacío, detalle y 404, búsqueda parcial sin tildes/mayúsculas combinada con categoría, filtros conservados. |
| Pedido, FR-004–FR-009 | Consolidar línea, mínimo uno, quitar, unidades, subtotales exactos, persistir/restaurar, JSON inválido, comprobación al agregar desde vista antigua sin incremento ante retirada/error, retirada parcial y nueva pulsación, retirada total con nombres visibles en vacío y total cero, destino inválido, fallo sin navegación, texto y URL completos. |
| Acceso, FR-010/FR-020 | Acceso ausente/incorrecto, token revocado, límite absoluto antes y a ocho horas, no renovar por actividad, rechazo al guardar vencido, origen ajeno y límite de intentos. Cookie de sesión sin vencimiento persistente; probar restauración antes y después del límite absoluto, según FR-010. |
| Administración, FR-011–FR-015 | Alta y retirada persistentes, cancelar sin llamada, doble clic con un POST, campos inválidos, firma falsa, foto ilegible y tamaño exactamente en límite/excedido. |
| Interfaz, FR-016–FR-019 | Estados vacíos/carga/error, mensajes por campo, importes en soles, etiquetas, foco y navegación por teclado. Completar con revisión visual manual. |

Con Supertest crear app sin escuchar un puerto fijo y usar agent para cookies; reloj inyectado para ocho horas sin esperar tiempo real; DB temporal para reinicio; archivos de prueba sin datos reales. Las peticiones mutantes de prueba deben acreditar Origin permitido. No se realiza envío real de WhatsApp desde pruebas automáticas.

## Recorrido manual de aceptación

1. Iniciar con catálogo vacío: mensaje claro sin productos ficticios. Abrir /admin sin acceso: exigir clave; probar vacía e incorrecta y comprobar catálogo intacto (SC-004).
2. Ingresar y agregar seis productos entre las tres categorías. Incluir iPhone a 4299.00 y SSD a 329.00, descripción y fotos JPG/PNG/WebP. Verificar errores de categoría, precio cero/negativo/con tres decimales, nombre vacío y foto falsa/excesiva, sin publicaciones parciales. Cancelar no crea producto. Publicar con datos preparados en menos de dos minutos (SC-003).
3. Buscar un nombre con tildes usando texto sin tildes, combinar con categoría, abrir detalle y volver. Ver descripción completa y especificaciones opcionales. Cronometrar menos de un minuto y comprobar ausencia de resultados cuando corresponde (SC-001).
4. Agregar un iPhone y dos SSD: una línea por producto, contador tres, total S/ 4,957.00. Reducir SSD a uno: contador dos y S/ 4,628.00. No bajar de uno; Quitar elimina. Navegar, recargar y cerrar/reabrir navegador normal conserva el pedido (SC-002).
5. Restaurar tres unidades y pulsar WhatsApp: revisar destinatario y mensaje completo con S/ 4,957.00. No es necesario enviar realmente. Volver conserva pedido; no aparece confirmación de venta o pago. Verificar aviso de ausencia de pago.
6. Mantener una tarjeta o detalle del SSD abierto, retirarlo desde otra pestaña administrativa tras cancelar primero la confirmación y pulsar Agregar en la vista antigua: avisar No disponible sin crear/incrementar línea ni contador. Simular fallo de comprobación: conservar pedido y permitir reintentar sin éxito falso. Revisar pedido: explicar retirada y recalcular sin abrir WhatsApp; con líneas vigentes revisar y pulsar otra vez. Repetir con otro producto como única línea y retirarlo: ver su nombre en el aviso junto al estado vacío después de actualizar la selección, total S/ 0.00 y envío deshabilitado. Abrir URL antigua: Producto no disponible (SC-008).
7. Simular error de red al verificar pedido: conservar líneas y ofrecer reintento sin abrir WhatsApp. Probar pedido vacío y WHATSAPP_NUMBER vacía: envío deshabilitado. Restaurar conexión y configuración para repetir.
8. Cerrar sesión: impedir panel y escrituras con token viejo. Probar caducidad exacta de ocho horas con reloj controlado en pruebas, incluido formulario abierto. Cerrar y reabrir con restauración desactivada: pedir clave al finalizar la sesión del navegador. Repetir con restauración activada: se admite conservar acceso antes de ocho horas, pero nunca después ni tras Cerrar sesión. No tomar cerrar una pestaña como cerrar todo el navegador.
9. Reiniciar servidor con la misma DB: catálogo y fotos se conservan y producto retirado sigue ausente. Guardar una copia de DB con proceso detenido, restaurar en ruta de prueba y repetir consulta.
10. A 360 y 390 píxeles recorrer compra; a 1366 administración. Sin desplazamiento horizontal ni barras tapando acciones. Comparar con cada una de las seis referencias; recorrer controles con teclado y revisar foco, etiquetas y errores (SC-005/SC-006).
11. Cinco personas nuevas arman pedido de dos productos sin ayuda; al menos cuatro llegan al mensaje en menos de tres minutos y saben que el pago se coordina fuera de la página (SC-007).

## Revisión técnica de entrega

- Confirmar que cada FR-001–FR-020 tiene prueba de negocio o revisión de interfaz indicada arriba y que los SC-001–SC-008 se cumplen en los recorridos.
- Tras cambios finales: npm test, npm run build y comprobación de npm start. En instalación limpia usar npm ci y Node mínimo. No afirmar éxito de checks que no se ejecutaron.
- Comprobar arranque con enlaces directos del cliente y 404 JSON de API, cookies bajo HTTPS, origen ajeno rechazado y foto falsa no publicada.
- Con 200 productos de prueba y diez lecturas simultáneas del catálogo, observar que la lista y filtros permanecen utilizables. Objetivo técnico local: listado visible dentro de dos segundos después de recibir la respuesta, sin descargar fotos binarias en JSON. No es un compromiso de tráfico comercial ni de latencia de WhatsApp.
- Revisar Git: .env, data/, credenciales, archivos temporales y bases de prueba excluidos. .env.example conserva valores secretos vacíos. Logs no incluyen password, cookies, cuerpos multipart ni mensaje de pedido.

## Evidencia disponible

`npm run validate:browser` usa Edge y una DB temporal para reproducir los recorridos, con imágenes sintéticas y captura del enlace sin envío externo. `npm run validate:runtime` comprueba los scripts de arranque y detiene sus procesos. Los resultados se guardan en docs/validacion/. Si hay un proxy HTTPS real, configurar TRUSTED_PROXY solo con su IP exacta; no se confía en cualquier remitente.

Pendientes externos: T042 requiere revisar el destinatario y texto en un WhatsApp comercial real; T068/SC-007 requiere las cinco personas indicadas. No se registran como aprobados mediante automatización.
