# Chaska's Store Constitution

## Core Principles

### I. Simplicidad ante todo

Entre dos soluciones que cumplan la spec, se elige siempre la más simple. Esta es una
versión 1: no se agrega complejidad para necesidades futuras.

### II. Idioma y mercado

Todo el producto se presenta en español de Perú. Los precios e importes se muestran en
soles, con el símbolo S/ y dos decimales; por ejemplo, S/ 49.90.

### III. Cero alcance fantasma

Solo se implementan funcionalidades escritas en la spec. Una idea nueva se propone al
responsable del proyecto y solo se construye después de su aprobación e inclusión en la spec.

### IV. Verificable por una persona no técnica

Cada criterio de éxito indica cómo comprobarlo usando la app y qué resultado observar.
La comprobación no requiere leer código ni conocimientos técnicos.

### V. Datos del usuario con respeto

Solo se piden los datos imprescindibles para el pedido. No se incluyen claves ni secretos
en el código. La clave del administrador y el número de WhatsApp se configuran mediante
variables de entorno, documentadas en un archivo .env.example sin valores reales.

### VI. Pruebas primero

Toda regla de negocio tiene una prueba automática que se ejecuta y falla antes de
implementar la regla. Antes de cerrar una funcionalidad, npm test debe pasar.

## Alcance del producto

Chaska's Store es un catálogo virtual de productos electrónicos. El administrador agrega
y quita productos; los clientes envían su pedido por WhatsApp. La spec define las
funcionalidades concretas dentro de este alcance.

## Flujo de trabajo

Antes de implementar, se revisan la spec y estos principios. Al cerrar cada funcionalidad,
se comprueban sus criterios de éxito en la app y el resultado de npm test.

## Governance

Esta constitución rige las especificaciones, los planes y las revisiones del proyecto.
Cada cambio se revisa para comprobar su cumplimiento. Para modificarla, se documentan el
motivo y el impacto, se obtiene la aprobación del responsable y se actualizan versión y fecha.
La versión aumenta en MAJOR si se elimina o redefine un principio de forma incompatible,
MINOR si se añaden o amplían reglas y PATCH si solo se aclara la redacción.

**Version**: 1.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26
