# Cotiza3D

Calculadora móvil de precios de impresión 3D en pesos chilenos. Todo vive en `index.html`; no hay servidor, dependencias ni compilación.

La primera visita registra nombre, filamento y tarifas. Luego se asigna un nombre a cada cotización y se elige filamento, gramos y tiempo para obtener precio exacto y precio redondeado hacia arriba. Cada cálculo se guarda automáticamente en `localStorage`; el historial permite abrir, actualizar y eliminar cotizaciones. Filamentos y tarifas también se guardan en el navegador.

El desglose de costos, el precio sin redondear y el saldo estimado son privados en la pantalla de cálculo. El texto copiado, la imagen PNG descargada y la hoja nativa de compartir incluyen solamente el nombre de la cotización, quién la preparó, filamento, consumo, tiempo y precio final. El navegador no puede escribir directamente en la galería: la imagen se descarga o se envía a la hoja de compartir para guardarla allí.

Para usarla localmente, abre `index.html` en un navegador moderno. Para alojarla, sirve la raíz del repositorio por HTTPS en GitHub Pages u otro hosting estático. La API de portapapeles y la opción de compartir requieren un contexto seguro; la descarga PNG funciona como respaldo. Los datos permanecen en el mismo navegador y se pierden si se borran sus datos de sitio.

## Cálculo

- Material = gramos × precio del rollo / gramos del rollo.
- Tiempo = (horas + minutos / 60) × tarifa por hora.
- Precio real = material + tiempo.
- Precio final = precio real redondeado hacia arriba al múltiplo elegido.
- Saldo estimado = precio final − material − electricidad − reserva de mantenimiento.

La tarifa por hora incluye electricidad, desgaste y margen. Electricidad y mantenimiento se descuentan solamente al estimar el saldo; no se suman de nuevo al precio. El saldo no valora el trabajo manual ni considera impuestos.
