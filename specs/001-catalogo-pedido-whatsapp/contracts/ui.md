# Contrato de interfaz y estados

Referencia: [spec.md](../spec.md), sección Referencias de diseño validadas. Se implementan las seis vistas usando su jerarquía, sin extraer funciones de iconos o textos decorativos. Marca única: Chaska's Store; textos en español de Perú.

| Ruta | Vista y acciones | Estados relevantes |
| --- | --- | --- |
| `/` | Catálogo: búsqueda, Todos/Celulares/Laptops/Accesorios, tarjetas, Mi pedido y acceso administrativo. | Cargando, catálogo vacío, sin coincidencias, error con Reintentar. |
| `/productos/:id` | Foto, nombre, categoría, precio, descripción completa, especificaciones opcionales y Agregar al pedido. Volver conserva filtros. | Cargando, producto no disponible, error, imagen de reemplazo. |
| `/mi-pedido` | Foto/nombre, unitario, cantidad, subtotal, Quitar, total, WhatsApp y aviso de ausencia de pago. | Vacío, verificando, productos retirados, destino inválido, fallo, listo. |
| `/admin/acceso` | Tarjeta centrada, clave oculta y botón Ingresar. | Error de campo o clave, enviando, límite de intentos. |
| `/admin` | Tabla foto/nombre/categoría/precio/Quitar, Agregar producto y Cerrar sesión. | Verificando acceso, vacío, error, confirmación de retirada, acceso vencido. |
| `/admin/productos/nuevo` | Nombre, categoría, precio, descripción, especificaciones, subir foto, Cancelar y Guardar producto. | Errores junto al campo, guardando, fallo, acceso vencido. |

Rutas administrativas se verifican con el servidor antes de mostrar contenido; el servidor vuelve a verificar cada operación. 401 muestra acceso requerido, sin publicar el formulario pendiente automáticamente tras autenticarse. Una ruta desconocida muestra página no encontrada con Volver al catálogo.

Filtros en parámetros `q` y `categoria` del catálogo permiten regresar y recargar conservándolos. Parámetros desconocidos no rompen la vista; categoría inválida vuelve a Todos. El pedido usa el contrato de persistencia del modelo. Al entrar al pedido se reconcilia con el servidor; los controles funcionan con estado local y cada envío vuelve a validar. No se considera una lista vacía por fallo de red.

Agregar desde catálogo y detalle usa la comprobación GET actual del contrato HTTP antes de modificar la selección. Mientras comprueba se evita repetir esa acción para el mismo producto; 404 muestra No disponible sin incrementar contador ni línea, y error permite reintentar conservando el pedido. No confirmar éxito antes de comprobar y agregar.

Ante removedProductIds, capturar nombres desde snapshots antes de actualizar/persistir líneas. Mostrar el aviso también con la selección vacía, junto al estado vacío y envío deshabilitado, sin borrarlo por persistir items=[].

Las pruebas administrativas usan datos aislados; publicación y comprobación como visitante utilizan las consultas de US1. El ciclo de retirada con pedido requiere además US2.

Los botones de cantidad tienen etiquetas con producto, mínimo uno y estado deshabilitado coherente. El contador suma unidades en encabezado y navegación. Confirmar retirada nombra el producto, ofrece Cancelar y Quitar, gestiona foco y devuelve foco al control de origen si se cancela. Guardar usa bloqueo inmediato de la acción y estado ocupado, también para clics repetidos antes de un nuevo render.

Formato de soles uniforme: prefijo `S/ `, agrupación de miles con coma, dos decimales con punto. Aritmética en céntimos y formato independiente del separador predeterminado del navegador. No acortar la descripción ni el nombre de forma que impida consultarlos completos.

Fondo oscuro, tarjetas redondeadas, texto claro, acentos azules, WhatsApp verde y Quitar administrativo rojo. Tipografía Inter si se incluye localmente, con alternativa del sistema; sin depender de fuentes externas para funcionar. Dos columnas móviles mientras quepan sin recortes; apilar cuando sea necesario. Panel de escritorio en tabla y adaptación legible a anchos menores.

Navegación inferior Catálogo/Mi pedido en vistas de compra; acción inferior en detalle. Reservar espacio para barras y zona segura del dispositivo. No duplicar botones de compartir ni añadir favoritos. El icono de acceso lleva a administración, no crea una cuenta de cliente.

Accesibilidad: elementos semánticos, etiquetas asociadas, foco visible, mensajes de estado anunciados sin mover foco innecesariamente, errores asociados a campos y fotografía con texto alternativo. Todas las acciones funcionan con teclado. Revisión manual a 360, 390 y 1366 píxeles, comparando bloques con las seis imágenes; la referencia de acceso está recortada y no dicta un formulario incompleto.

Trazabilidad: FR-001–FR-003 catálogo/detalle; FR-004–FR-009 pedido; FR-010–FR-015 administración; FR-016 estados; FR-017 idioma/importes; FR-018 diseño; FR-019 teclado/foco; FR-020 acceso y privacidad. Las verificaciones se detallan en [quickstart.md](../quickstart.md).
