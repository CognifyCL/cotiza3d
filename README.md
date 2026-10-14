# Cotiza3D

Calculadora móvil de precios de impresión 3D en pesos chilenos. Todo vive en `index.html`; no hay servidor, dependencias ni compilación.

La primera visita registra nombre, filamento y tarifas. Luego se elige filamento, gramos y tiempo para obtener precio exacto y precio redondeado hacia arriba. El resultado se puede copiar como texto, descargar como PNG o compartir mediante la hoja nativa cuando el navegador la admite. Filamentos y tarifas se guardan en `localStorage` del dispositivo.

Para usarla localmente, abre `index.html` en un navegador moderno. Para alojarla, sirve la raíz del repositorio por HTTPS en GitHub Pages u otro hosting estático. La API de portapapeles y la opción de compartir requieren un contexto seguro; la descarga PNG funciona como respaldo. El navegador no puede escribir directamente en la galería: la imagen se descarga o se envía a la hoja de compartir para que la persona la guarde allí.

## Cálculo

- Material = gramos × precio del rollo / gramos del rollo.
- Tiempo = (horas + minutos / 60) × tarifa por hora.
- Precio real = material + tiempo.
- Precio final = precio real redondeado hacia arriba al múltiplo elegido.
- Saldo estimado = precio final − material − electricidad − reserva de mantenimiento.

La tarifa por hora incluye electricidad, desgaste y margen. Electricidad y mantenimiento se descuentan solamente al estimar el saldo; no se suman de nuevo al precio. El saldo no valora el trabajo manual ni considera impuestos.
