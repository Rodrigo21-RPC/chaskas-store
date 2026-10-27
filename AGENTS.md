# Chaska's Store

Tienda virtual de electrónicos con catálogo y pedidos por WhatsApp.
El administrador agrega y quita productos.

## Stack

- Todo en JavaScript; Node.js 22.13 o superior, requerido por `node:sqlite`.
- Cliente: React con Vite y Tailwind CSS.
- Servidor: Express en Node.js; SQLite mediante el módulo integrado `node:sqlite`.
- Validación: Zod. Pruebas: Vitest y supertest.

## Trabajo local

Desde la raíz: `npm install` instala dependencias; `npm run dev` inicia el desarrollo;
`npm test` ejecuta las pruebas; `npm start` inicia la aplicación.
Estos comandos son el contrato previsto; comprobar los scripts de `package.json`
antes de ejecutarlos (la aplicación aún no está inicializada).

## Convenciones

- Elegir la solución más simple para la versión 1; evitar complejidad anticipada.
- Implementar solo lo escrito en la spec; proponer las ideas nuevas antes de construirlas.
- Presentar todo el producto en español de Perú; importes en soles: `S/ 49.90`.
- Definir criterios de éxito comprobables usando la app, sin leer código.
- Pedir solo datos imprescindibles. Clave de administrador y número de WhatsApp en
  variables de entorno; documentarlas en `.env.example` sin valores reales ni secretos.
- Por cada regla de negocio, ejecutar primero una prueba automática que falle;
  implementar después y exigir que `npm test` pase antes de cerrar la funcionalidad.

Las reglas de producto viven en .specify/memory/constitution.md y el estado del producto en specs/README.md

## Cierre de una feature

Cuando el usuario pida «cerrar la feature», ejecutar en este orden:

1. Verificar el working tree y commitear los cambios pendientes. Identificar la
   rama de la feature, su número `NNN` y su nombre antes de cambiar de rama.
2. Ejecutar `npm test`. Si falla, detener el flujo e informar el resultado.
3. Hacer checkout de `main`.
4. Fusionar la rama de la feature con `--no-ff` y el mensaje
   `Merge feature NNN: <nombre>`, sustituyendo el número y el nombre de la feature.
5. Borrar la rama local de la feature y su rama remota correspondiente.
6. Subir `main` al remoto.
7. Mostrar `git log --oneline --graph -10`.

Si un push falla (incluida la eliminación de la rama remota), informar el error
y dejar claro qué pasos sí se completaron. No presentar el cierre como completo
si queda alguna operación pendiente.
