# Chaska's Store

Catálogo de celulares, laptops y accesorios con pedidos por WhatsApp. El administrador publica y retira productos; la página no cobra ni confirma compras.

## Requisitos

- Node.js **22.13 o superior** y npm. SQLite viene integrado en Node.
- Un número comercial con WhatsApp para habilitar el envío y una clave de administrador propia.
- Disco persistente para conservar catálogo y fotos. El catálogo inicial está vacío.

## Ejecutar localmente

Desde la raíz del repositorio:

```powershell
npm install
Copy-Item -LiteralPath .env.example -Destination .env
```

Edita `.env`: completa `ADMIN_PASSWORD` con tu clave y `WHATSAPP_NUMBER` con el número comercial internacional, solo dígitos, sin `+` ni espacios. No hay clave predeterminada. El archivo `.env` está excluido de Git.

```powershell
npm run dev
```

Abre **http://localhost:5173**. El acceso administrativo está en **/admin**. Express escucha en el puerto 3000 y Vite le redirige `/api`. Ctrl+C detiene ambos procesos.

Si `WHATSAPP_NUMBER` está vacío o es inválido, puedes usar catálogo y administración; el envío queda deshabilitado con una explicación. Sin `ADMIN_PASSWORD` válida, el servidor no inicia.

## Servidor compilado

Para probarlo localmente por HTTP, configura `APP_ORIGIN=http://localhost:3000` y conserva `NODE_ENV=development`:

```powershell
npm start
```

`prestart` compila el cliente y Express sirve la web y la API en el mismo origen. También puedes ejecutar `npm run build` por separado.

En un despliegue real usa HTTPS, `NODE_ENV=production`, `APP_ORIGIN` con el origen HTTPS exacto y un volumen persistente para `DATABASE_PATH`. Si un proxy conocido termina HTTPS, configura **solo su IP exacta** en `TRUSTED_PROXY`; vacío significa que no se confía en encabezados de proxies. No se acepta `true` ni confianza general.

## Configuración

| Variable | Uso |
| --- | --- |
| `ADMIN_PASSWORD` | Clave administrativa; obligatoria, sin valor predeterminado. |
| `WHATSAPP_NUMBER` | Número internacional de 8–15 dígitos; su formato no garantiza que exista una cuenta. |
| `APP_ORIGIN` | Origen exacto autorizado para mutaciones; desarrollo: `http://localhost:5173`. |
| `PORT` | Puerto Express; predeterminado 3000. |
| `DATABASE_PATH` | Archivo SQLite; predeterminado `./data/chaskas.sqlite`. |
| `NODE_ENV` | `production` exige origen HTTPS y cookies Secure. |
| `TRUSTED_PROXY` | IP exacta del proxy conocido; opcional. |

No uses prefijos `VITE_` para secretos. Ningún cliente necesita proporcionar correo, dirección o datos de pago.

## Comportamiento

- Buscar por nombre y filtrar por categoría, sin distinguir tildes o mayúsculas.
- Antes de agregar, comprobar que el artículo siga publicado; antes de abrir WhatsApp, volver a verificar y recalcular precios y cantidades.
- Mi pedido se conserva en el mismo navegador mediante almacenamiento local. Se avisa si el navegador bloquea el guardado.
- Una retirada parcial o total identifica los productos afectados; incluso con pedido vacío se conserva el aviso y no se abre WhatsApp.
- Publicar requiere nombre, categoría, precio positivo, descripción y una foto JPG/PNG/WebP de hasta **5 MB**. Especificaciones opcionales. Límite defensivo: 25 millones de píxeles.
- No hay edición, stock, pagos, historial ni pedidos guardados en servidor. Para corregir un producto, retíralo y publícalo de nuevo.
- El acceso administrativo vence a las **ocho horas desde el ingreso**, sin renovación por actividad. Cerrar sesión revoca el token. Restaurar el navegador puede conservar la cookie de sesión antes de ese límite.

## Verificar

```powershell
npm test
npm run build
npm run validate:browser
npm run validate:runtime
```

La validación de navegador requiere Microsoft Edge instalado y usa el puerto 4173; la validación de arranque usa los puertos 4174/3000/5173. Generan datos sintéticos en bases temporales, nunca en tu catálogo. La validación de navegador captura el enlace de WhatsApp **sin enviar mensajes reales** y guarda capturas en `docs/validacion/`. `validate:runtime` prueba `npm start`, `npm run dev` y el cierre de sus procesos.

Pruebas unitarias, de API y de componentes: Vitest, Supertest y Testing Library. La evidencia y las comprobaciones humanas pendientes están en [validation.md](specs/001-catalogo-pedido-whatsapp/validation.md). La prueba con cinco personas y la revisión del destinatario en un WhatsApp comercial real se registran por separado.

## Respaldo

Detén el servidor y copia el archivo de `DATABASE_PATH` a una ubicación protegida. Guarda el respaldo fuera del repositorio: también contiene sesiones administrativas. Para restaurar, con el servidor detenido, coloca la copia en una ruta de prueba, configura `DATABASE_PATH` y comprueba catálogo/fotos antes de usarla como copia principal. No uses almacenamiento efímero para la base.

Los diseños validados están en `docs/diseno/`; las capturas de implementación usan fixtures sintéticos, no productos reales. El alcance y las tareas se consultan en [specs/README.md](specs/README.md).
