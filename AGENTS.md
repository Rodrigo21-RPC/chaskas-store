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
