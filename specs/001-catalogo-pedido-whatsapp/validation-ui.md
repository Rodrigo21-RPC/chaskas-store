# Revisión de interfaz

Las seis capturas en docs/validacion/ se inspeccionaron visualmente contra docs/diseno/. Conservan fondo oscuro, superficies redondeadas, jerarquía, acciones azules, WhatsApp verde y retirada roja. Marca oficial: Chaska's Store. Las imágenes de producto son fixtures sintéticos claramente identificados; no son productos comerciales precargados.

Recorridos de navegador automatizados y revisión de capturas: 360/390 para compra y 1366 para administración. No hay desbordamiento horizontal. El contenido puede desplazarse completamente por encima de las barras gracias al espacio inferior; las capturas de página completa muestran las barras fijas en su posición de viewport. Descripción y especificaciones se presentan completas.

Se verificaron foco inicial por Tab, diálogo nativo, Escape/cancelación y retorno al botón original. Controles de cantidad y filtros móviles tienen área mínima de 44 px; campos de entrada usan 16 px y hay foco visible y etiquetas asociadas. Acciones de teclado y formularios también se cubren en Testing Library. Estado vacío, error de red, producto retirado y errores de campos tienen mensajes españoles y recuperación.

La referencia de acceso estaba recortada: el formulario completo se deriva del requisito de clave. Variaciones permitidas: nombre oficial, contenido real, especificaciones de texto libre, estados de error y adaptación al ancho. La prueba con cinco usuarios sigue pendiente y se registra en validation.md.
