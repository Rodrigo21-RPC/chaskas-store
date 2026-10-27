# Feature Specification: Chaska's Store — catálogo y pedidos por WhatsApp

**Feature Branch**: `001-catalogo-pedido-whatsapp`

**Created**: 2026-10-26

**Status**: Draft — validada para planificación

**Input**: User description: "Crea la especificación de una tienda virtual llamada Chaska's Store: un catálogo de productos electrónicos (celulares, laptops y accesorios) donde el administrador puede agregar y quitar productos, sin pagos en línea, y el cliente arma su pedido y lo envía por WhatsApp. Debe ser simple. Usa como referencia de diseño las imágenes adjuntas validadas (Stitch)."

## Clarifications

### Session 2026-10-26

- Q: ¿Cuándo debe caducar el acceso del administrador si olvida cerrar sesión? → A: Al finalizar la sesión del navegador o cumplirse ocho horas desde el ingreso; la precisión sobre restauración se confirma en la respuesta siguiente.
- Q: ¿Cómo ajustamos la regla de acceso ante navegadores que restauran la sesión al reabrirse? → A: Cookie de sesión y límite absoluto de ocho horas; restaurar el navegador puede conservar el acceso hasta ese límite.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Encontrar y consultar productos (Priority: P1)

Como cliente, quiero explorar productos y consultar sus características para elegir qué pedir sin registrarme.

**Why this priority**: El catálogo permite conocer la oferta y es el punto de entrada de la tienda.

**Independent Test**: Con seis productos distribuidos entre las tres categorías, recorrer el catálogo, buscar por nombre, filtrar y abrir un detalle sin acceder a administración.

**Acceptance Scenarios**:

1. **Given** productos publicados, **When** abro el catálogo, **Then** veo Chaska's Store, Todos, Celulares, Laptops y Accesorios, y tarjetas con foto, nombre, precio y Agregar al pedido.
2. **Given** productos de distintas categorías, **When** selecciono Laptops y busco parte de un nombre, **Then** solo veo las laptops coincidentes, sin distinguir mayúsculas ni tildes; borrar el texto conserva la categoría y elegir Todos elimina el filtro de categoría.
3. **Given** una tarjeta, **When** selecciono su foto o nombre, **Then** veo foto, nombre, categoría, precio, descripción completa, especificaciones si existen, Volver y Agregar al pedido; al volver se conservan búsqueda y categoría.
4. **Given** catálogo vacío o búsqueda sin coincidencias, **When** consulto la vista, **Then** un mensaje distingue ambos casos y puedo limpiar o cambiar los filtros cuando corresponde.

---

### User Story 2 - Armar el pedido y llevarlo a WhatsApp (Priority: P1)

Como cliente, quiero agregar productos, ajustar cantidades y abrir WhatsApp con mi pedido preparado para coordinar la compra.

**Why this priority**: Es el resultado principal del recorrido comercial, sin cobros en la página.

**Independent Test**: Agregar un producto de S/ 4,299.00 y dos unidades de otro de S/ 329.00; comprobar tres unidades, total de S/ 4,957.00 y el mensaje preparado en WhatsApp.

**Acceptance Scenarios**:

1. **Given** un producto disponible, **When** lo agrego desde catálogo o detalle, **Then** se comprueba su disponibilidad actual antes de modificar Mi pedido y solo tras confirmarla se crea la línea con cantidad uno o se incrementa la existente, con confirmación visible y sin duplicar filas.
2. **Given** varias unidades en Mi pedido, **When** abro la vista, **Then** cada fila muestra foto, nombre, precio unitario, cantidad, subtotal, controles de cantidad y Quitar; el total suma los subtotales y el contador suma unidades.
3. **Given** una fila con cantidad dos, **When** reduzco la cantidad, **Then** queda en uno y se recalculan subtotal, total y contador; con uno no puedo reducir más y puedo usar Quitar para eliminar la fila.
4. **Given** un pedido armado, **When** navego, recargo o cierro y vuelvo a abrir el mismo navegador, **Then** el pedido permanece; al quitar todos los productos veo estado vacío, Volver al catálogo y envío deshabilitado.
5. **Given** el pedido de la prueba independiente y el destino configurado, **When** pulso Enviar pedido por WhatsApp, **Then** se abre WhatsApp dirigido a la tienda con nombre de la tienda, nombres de productos, cantidades, precios unitarios, subtotales y total de S/ 4,957.00; el cliente decide enviar desde WhatsApp.
6. **Given** la apertura de WhatsApp, **When** vuelvo a la tienda o cancelo el mensaje, **Then** el pedido permanece y la tienda no afirma que se haya enviado, recibido o pagado.
7. **Given** un producto de mi pedido retirado por el administrador, **When** reviso o intento enviar el pedido, **Then** se identifica el producto no disponible, se elimina del pedido y se recalcula el total. Si quedan líneas, debo revisar y pulsar nuevamente para abrir WhatsApp; si no quedan, veo el aviso que identifica los retirados junto al pedido vacío, con total cero y envío deshabilitado.
8. **Given** una tarjeta o detalle abierto antes de que el administrador retire el producto, **When** intento agregarlo después de la retirada, **Then** se comprueba su disponibilidad actual, se informa que ya no está disponible y no se crea ni incrementa su línea, ni se muestra confirmación de agregado. Si falla esa comprobación, mi pedido se conserva y puedo reintentar.

---

### User Story 3 - Administrar el catálogo (Priority: P1)

Como administrador, quiero entrar con mi clave y agregar o quitar productos para mantener la oferta publicada.

**Why this priority**: Permite operar la tienda sin intervención de quien la desarrolla.

**Independent Test**: Entrar con la clave configurada, publicar un producto de prueba, comprobarlo como visitante, cancelar una retirada, confirmar otra y comprobar que desaparece. La comprobación como visitante utiliza la consulta pública de la historia 1; las acciones administrativas se verifican por separado y no requieren armar ni enviar pedidos.

**Acceptance Scenarios**:

1. **Given** un visitante sin acceso, **When** intenta abrir el panel o agregar o quitar productos, **Then** se exige autenticación y no se modifica el catálogo.
2. **Given** la pantalla de acceso, **When** ingreso clave vacía o incorrecta, **Then** veo un error y sigo sin acceso; con la clave correcta entro sin solicitar correo ni nombre de usuario.
3. **Given** acceso autorizado, **When** abro el panel, **Then** veo foto, nombre, categoría, precio y Quitar por producto, además de Agregar producto y Cerrar sesión; sin productos se indica y puedo agregar el primero.
4. **Given** Agregar producto, **When** completo nombre, categoría, precio, descripción y foto válidos y guardo, **Then** el producto aparece una sola vez en panel, catálogo y detalle, y vuelvo al panel con confirmación; las especificaciones son opcionales.
5. **Given** datos inválidos o foto rechazada, **When** intento guardar, **Then** se explica qué corregir, se conservan los demás campos y no se publica; Cancelar vuelve al panel sin publicar.
6. **Given** un producto publicado, **When** pulso Quitar, **Then** confirmo identificando el producto; cancelar lo conserva y confirmar lo retira del panel, catálogo y detalle público.
7. **Given** una sesión abierta, **When** cierro sesión e intento volver al panel o modificar productos, **Then** se exige nuevamente la clave.
8. **Given** altas y retiradas confirmadas, **When** vuelvo a abrir la tienda después de reiniciarla, **Then** se conservan los cambios del catálogo.
9. **Given** un administrador autenticado, **When** finaliza la sesión del navegador sin restaurarla o se cumplen ocho horas desde el ingreso, **Then** debe ingresar nuevamente la clave para consultar el panel o modificar productos; navegar o recargar no reinicia el plazo. Si el navegador restaura su sesión al reabrirse, el acceso puede conservarse hasta el límite absoluto de ocho horas, nunca después.

---

### Edge Cases

- Un detalle retirado muestra Producto no disponible y Volver al catálogo, sin permitir agregarlo. Una tarjeta o detalle desactualizado comprueba disponibilidad al pulsar Agregar; si la retirada ya estaba confirmada antes de esa comprobación, no agrega ni incrementa el producto. No se exige actualización instantánea de todas las pestañas.
- Si se retira el único producto o todos los productos del pedido, el aviso identifica sus nombres también cuando el resultado queda vacío; permanece visible junto a ese estado después de actualizar la selección.
- Ante fallos al cargar, guardar o quitar, se informa y se permite reintentar; no se comunica éxito ni se cambia la vista como si la operación hubiese terminado.
- Durante un guardado se impide repetirlo; un doble clic no crea dos productos.
- Una foto publicada que no carga tiene reemplazo visual; nombre, precio y acciones siguen disponibles.
- No se aceptan cantidades cero, negativas, fraccionarias ni texto; no hay reserva ni control de stock.
- Sin número de WhatsApp válido, el envío queda deshabilitado con explicación; el catálogo y la edición del pedido siguen disponibles.
- Si WhatsApp no puede abrirse, el pedido se conserva para reintentar; no se asegura entrega ni se registra una venta.
- Si no se puede verificar el catálogo antes del envío, no se abre WhatsApp; se conserva el pedido y se permite reintentar.
- Tildes y símbolos en nombres no deben romper la presentación ni el mensaje del pedido.
- Si caduca el acceso con el formulario de producto abierto, intentar guardar exige volver a ingresar la clave y no publica el producto sin autenticación.
- Restaurar ventanas del navegador puede restaurar el acceso administrativo antes de las ocho horas. Cerrar sesión lo revoca siempre y ninguna restauración permite superar el vencimiento absoluto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Se DEBE permitir consultar catálogo y detalle y armar el pedido sin registro ni datos personales del cliente. Aceptación: historia 1 e historia 2, escenarios 1–4.
- **FR-002**: El catálogo DEBE mostrar solo productos disponibles, con foto, nombre, precio y Agregar al pedido, y ofrecer búsqueda parcial por nombre combinable con una categoría o Todos, ignorando mayúsculas y tildes. Aceptación: historia 1, escenarios 1–2.
- **FR-003**: El detalle DEBE mostrar categoría, foto, nombre, precio, descripción completa y especificaciones opcionales; DEBE permitir volver conservando filtros y agregar al pedido. Aceptación: historia 1, escenario 3.
- **FR-004**: Antes de crear o incrementar una línea desde catálogo o detalle, se DEBE comprobar la disponibilidad actual del producto. Solo una comprobación satisfactoria permite modificar el pedido, confirmar visiblemente el agregado y actualizar el contador de unidades. Si el producto fue retirado o la comprobación falla, no se DEBE crear ni incrementar la línea ni anunciar éxito; se informa el problema y se permite reintentar cuando corresponda. Aceptación: historia 2, escenarios 1, 2 y 8.
- **FR-005**: Mi pedido DEBE permitir aumentar y disminuir cantidades enteras desde uno, quitar líneas y mostrar precio unitario, subtotal y total. Los importes DEBEN coincidir exactamente con precio por cantidad y suma de subtotales. Aceptación: historia 2, escenarios 2–3.
- **FR-006**: El pedido DEBE conservarse al navegar, recargar y cerrar y reabrir el mismo navegador y dispositivo, hasta quitar sus productos o borrar los datos del sitio. Abrir WhatsApp no lo vacía. Aceptación: historia 2, escenarios 4 y 6.
- **FR-007**: Con pedido no vacío y productos vigentes, el envío DEBE abrir WhatsApp hacia la tienda con un mensaje legible que incluya Chaska's Store, cada nombre, cantidad, precio unitario, subtotal y total en soles. No DEBE enviar automáticamente ni afirmar recepción o pago. Aceptación: historia 2, escenarios 5–6.
- **FR-008**: Mi pedido DEBE indicar: “Tu pedido se envía por WhatsApp. No se realiza ningún pago en esta página.” No DEBE ofrecer cobros ni solicitar datos de pago. Aceptación: revisar la vista antes de abrir WhatsApp.
- **FR-009**: Al revisar el pedido y antes de abrir WhatsApp se DEBE comprobar disponibilidad. Todos los productos retirados se DEBEN identificar por nombre, excluir y recalcular el total, incluso si el resultado queda vacío. El aviso DEBE seguir visible junto al estado vacío después de actualizar la selección; el total es cero y el envío permanece deshabilitado. Si quedan líneas, se exige revisar y una nueva acción de envío. Si no se puede verificar, se DEBE conservar el pedido sin abrir WhatsApp y permitir reintentar. Aceptación: historia 2, escenario 7 y casos límite de retirada parcial y total.
- **FR-010**: El administrador DEBE acceder con una clave oculta durante la escritura; sin autenticación no se DEBE consultar el panel ni agregar o quitar productos. Cerrar sesión DEBE revocar el acceso. El acceso DEBE usar una sesión del navegador y caducar como máximo a las ocho horas desde el ingreso; navegar y recargar no prolongan el plazo. Finalizar la sesión del navegador sin restaurarla exige ingresar nuevamente la clave. Si el navegador restaura la sesión al reabrirse, el acceso puede conservarse hasta ese límite absoluto de ocho horas; no se garantiza su revocación solo por cerrar el navegador. Una vez caducado, consultar el panel o modificar productos DEBE exigir nuevamente la clave. Aceptación: historia 3, escenarios 1–3, 7 y 9, y caso de caducidad con formulario abierto.
- **FR-011**: El panel DEBE listar foto, nombre, categoría, precio y Quitar y ofrecer Agregar producto y Cerrar sesión. Aceptación: historia 3, escenario 3.
- **FR-012**: Agregar producto DEBE solicitar nombre, categoría, precio, descripción, especificaciones opcionales como texto libre y una foto, con Cancelar y Guardar producto. El guardado correcto DEBE publicar catálogo y detalle y regresar al panel con confirmación. Aceptación: historia 3, escenarios 4–5.
- **FR-013**: Nombre y descripción DEBEN contener texto distinto de espacios; categoría DEBE ser Celulares, Laptops o Accesorios; precio DEBE ser mayor que cero con hasta dos decimales; foto DEBE ser JPG, PNG o WebP de hasta 5 MB. Se DEBEN señalar errores antes de publicar conservando los demás datos. Aceptación: historia 3, escenario 5, probando cada campo inválido y límites de precio y foto.
- **FR-014**: Quitar DEBE requerir confirmación con el nombre del producto y permitir cancelar. Tras confirmar la retirada, las nuevas consultas de detalle DEBEN mostrarlo como no disponible y los intentos de agregar o incrementar desde tarjetas o detalles antiguos DEBEN comprobar disponibilidad antes de modificar el pedido. Una retirada confirmada antes de esa comprobación DEBE impedir el agregado o incremento, con aviso y sin confirmación de éxito. No se exige invalidación instantánea de vistas ni reserva después de una comprobación satisfactoria; la revisión y el envío vuelven a verificar según FR-009. Aceptación: historia 3, escenario 6, historia 2, escenario 8 y caso de detalle retirado.
- **FR-015**: Altas y retiradas DEBEN persistir tras recargar y reiniciar la tienda. Aceptación: historia 3, escenario 8.
- **FR-016**: Catálogo vacío, búsqueda sin resultados, pedido vacío, carga en curso y errores DEBEN tener estados comprensibles en español. Pedido vacío o destino inválido DEBEN impedir abrir WhatsApp. Aceptación: historia 1, escenario 4, historia 2, escenario 4 y casos límite.
- **FR-017**: Todo el producto DEBE estar en español de Perú, usar Chaska's Store y mostrar soles con S/ y dos decimales, por ejemplo S/ 49.90 y S/ 4,299.00. Aceptación: revisar catálogo, detalle, pedido, panel y mensaje preparado.
- **FR-018**: Las seis vistas DEBEN conservar jerarquía y estilo de las referencias: fondo oscuro, superficies y esquinas redondeadas, texto claro, acciones azules, WhatsApp verde y retirada administrativa roja. El catálogo móvil DEBE tener dos columnas cuando quepan sin cortes y navegación inferior Catálogo/Mi pedido con contador. Aceptación: SC-005 y SC-006.
- **FR-019**: Las acciones DEBEN poder operarse con teclado, tener etiquetas comprensibles y foco visible; los campos DEBEN estar etiquetados y las barras fijas no DEBEN tapar contenido ni acciones. Aceptación: SC-005 y SC-006.
- **FR-020**: La clave administrativa NO DEBE mostrarse a visitantes ni incluirse en el mensaje. Configurar acceso y destino comercial DEBE corresponder al responsable de la tienda, sin pedir esos datos al cliente. Aceptación: historia 3, escenario 1 y revisión de pantallas públicas y mensaje.

### Key Entities *(include if feature involves data)*

- **Producto**: Artículo identificado de forma única con nombre, categoría, precio en soles, descripción, especificaciones opcionales y foto. Solo los productos no retirados se pueden consultar y agregar.
- **Categoría**: Clasificación fija: Celulares, Laptops o Accesorios. Todos es un filtro, no una categoría asignable.
- **Pedido en preparación**: Selección del cliente en su navegador, con líneas y total; no constituye venta confirmada ni reserva.
- **Línea de pedido**: Producto, cantidad entera positiva, precio unitario y subtotal. Un producto ocupa una sola línea.
- **Acceso de administrador**: Autorización mediante la clave de la tienda, revocada al cerrar sesión y limitada a ocho horas absolutas. Finaliza con la sesión del navegador salvo que este la restaure al reabrirse; incluso restaurada no supera las ocho horas. No hay múltiples cuentas.
- **Destino comercial**: Número de WhatsApp de la tienda para la conversación del pedido.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con seis productos distribuidos entre las tres categorías, una persona encuentra un producto por búsqueda y filtro y consulta su descripción en menos de un minuto. Comprobación: cronometrar el recorrido y comparar resultados con nombres y categorías publicados.
- **SC-002**: Un producto de S/ 4,299.00 y dos unidades de S/ 329.00 muestran exactamente tres unidades y S/ 4,957.00 en Mi pedido y WhatsApp. Al quitar una unidad del segundo, muestran dos unidades y S/ 4,628.00. Comprobación: revisar importes visibles y texto preparado.
- **SC-003**: Un administrador con datos y foto preparados publica un producto en menos de dos minutos y lo retira en menos de treinta segundos. Comprobación: cronometrar y verificar presencia y ausencia desde una vista de visitante, también tras reiniciar la tienda.
- **SC-004**: El 100 % de los intentos de abrir el panel, agregar o quitar sin autenticación exige la clave y conserva el catálogo. Comprobación: repetir como visitante, con clave incorrecta, después de cerrar sesión, tras finalizar la sesión del navegador con restauración desactivada y al cumplirse ocho horas desde el ingreso, incluyendo guardar un formulario abierto antes de caducar. Comprobar también con restauración activada: se admite conservar acceso antes de las ocho horas, pero nunca después ni tras Cerrar sesión. Navegar y recargar mantienen el acceso vigente sin reiniciar el plazo.
- **SC-005**: A anchos de 360 y 390 píxeles se completa catálogo → detalle → pedido → WhatsApp sin desplazamiento horizontal ni contenido o acciones tapados. A 1366 píxeles se completa acceso → agregar → quitar → cerrar sesión. Comprobación: recorrer cada vista a esos anchos.
- **SC-006**: Las seis vistas conservan los bloques principales, jerarquía visual, colores de acciones y navegación de FR-018. Todas sus acciones funcionan con teclado y foco visible. Comprobación: comparar cada vista con su referencia y recorrer sus controles; se permiten diferencias de nombre oficial, textos reales, adaptación al ancho y estados ausentes en las imágenes.
- **SC-007**: Al menos cuatro de cinco personas que prueban la tienda por primera vez completan un pedido de dos productos hasta el mensaje preparado en WhatsApp en menos de tres minutos, sin ayuda, y explican correctamente que pago y coordinación ocurren fuera de la página. Comprobación: observar y cronometrar las cinco pruebas y preguntar dónde se paga.
- **SC-008**: El 100 % de las pruebas de pedido vacío, producto retirado, producto inválido y fallo de operación muestra explicación y una acción para continuar o reintentar, sin confirmar operaciones fallidas. Comprobación: provocar cada caso en las pantallas y verificar que no se abra un pedido inválido en WhatsApp.

## Assumptions

- La versión 1 sirve a una tienda con una clave administrativa y un número de WhatsApp. Los valores reales se proporcionarán al configurar la aplicación y no son necesarios para redactar esta especificación; su gestión debe respetar la constitución.
- Pago, entrega y disponibilidad final se coordinan por WhatsApp; no se piden nombre, correo, teléfono ni dirección al preparar el mensaje.
- Quedan fuera pagos en línea, edición de productos existentes, stock, reservas, variantes, descuentos, favoritos, comparaciones, compartir productos, gestión de categorías, historial y seguimiento de pedidos y panel de ventas. Para corregir un producto se retira y agrega de nuevo.
- El catálogo comienza vacío y lo carga el administrador. Productos, precios y fotos de Stitch son ejemplos visuales, no un catálogo inicial obligatorio.
- El pedido pertenece al mismo navegador y dispositivo, sin sincronización entre dispositivos ni historial de envíos en la tienda.
- Se adopta una foto obligatoria de hasta 5 MB y especificaciones opcionales como texto libre, sin campos distintos por categoría.
- Se necesita conexión para consultar y administrar el catálogo y preparar el envío. WhatsApp y la apertura de su aplicación o versión web son dependencias externas; la tienda no garantiza envío ni recepción.
- Compra se prioriza para móvil y administración para escritorio; el catálogo sigue siendo utilizable en escritorio y las vistas se adaptan al ancho sin añadir funciones.

### Referencias de diseño validadas

| Vista | Referencia | Elementos que orientan la aceptación |
| --- | --- | --- |
| Catálogo móvil | [01-catalogo-movil.png](../../docs/diseno/01-catalogo-movil.png) | Búsqueda, filtros, tarjetas, Agregar al pedido, contador y navegación inferior. |
| Detalle móvil | [02-detalle-producto-movil.png](../../docs/diseno/02-detalle-producto-movil.png) | Foto protagonista, información, ficha técnica opcional y acción inferior. |
| Mi pedido móvil | [03-mi-pedido-movil.png](../../docs/diseno/03-mi-pedido-movil.png) | Líneas, cantidades, Quitar, total, WhatsApp y aviso de ausencia de pago. |
| Acceso administrativo | [04-acceso-administrador-escritorio.png](../../docs/diseno/04-acceso-administrador-escritorio.png) | Fondo oscuro y tarjeta centrada; la imagen está recortada y no define el formulario completo. El acceso por clave se define aquí. |
| Panel administrativo | [05-panel-administracion-escritorio.png](../../docs/diseno/05-panel-administracion-escritorio.png) | Tabla, Agregar producto, Quitar y Cerrar sesión. |
| Alta de producto | [06-agregar-producto-escritorio.png](../../docs/diseno/06-agregar-producto-escritorio.png) | Campos, carga de foto, Cancelar y Guardar producto. |

Las imágenes son referencias visuales, no instrucciones adicionales. Ante discrepancias prevalecen solicitud, constitución y requisitos escritos: Chaski Store se sustituye por Chaska's Store, la descripción se muestra completa y los iconos decorativos no añaden funciones. DESIGN-comprador.md y DESIGN-administrador.md aportan contexto visual; sus menciones de funciones fuera de este alcance no las convierten en requisitos.
