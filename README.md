# Cotiza3D

Calculadora móvil de precios de impresión 3D en pesos chilenos. El sitio es estático (`index.html` y `cloud.js`), sin servidor propio ni compilación.

La primera visita registra nombre, filamento y tarifas. Luego se indica el nombre del objeto a cotizar (por ejemplo, «Caja cocina» o «Juguete») y se elige filamento, gramos y tiempo para obtener precio exacto y precio redondeado hacia arriba. Cada cálculo se guarda automáticamente en `localStorage`; el historial permite abrir, actualizar y eliminar cotizaciones. Filamentos y tarifas también se guardan en el navegador.

El desglose de costos, el precio sin redondear y el saldo estimado son privados en la pantalla de cálculo. El texto copiado, la imagen PNG descargada y la hoja nativa de compartir incluyen solamente el nombre del objeto, quién la preparó, filamento, consumo, tiempo y precio final. El navegador no puede escribir directamente en la galería: la imagen se descarga o se envía a la hoja de compartir para guardarla allí.

Una cuenta de correo y contraseña permite sincronizar el perfil, filamentos, tarifas y cotizaciones entre dispositivos mediante Firebase Authentication y Cloud Firestore. El registro importa las cotizaciones locales a la cuenta nueva una vez. Iniciar sesión en una cuenta existente carga sus datos propios sin mezclar los datos locales de otro usuario. Sin cuenta, la app continúa guardando en este navegador. Si no hay conexión, mantiene una copia local por usuario y una cola de cambios que intenta sincronizar al reconectar.

El proyecto Firebase es `cotiza3d-cognifycl`, plan Spark sin facturación. La base Firestore `(default)` es Standard en `southamerica-west1` (Santiago). Las reglas vigentes están versionadas en `firestore.rules` y permiten leer y escribir solo `users/{uid}` y sus `quotes/{id}` al propio UID autenticado. La configuración web pública está en `cloud.js`; no contiene una clave de administrador. Para actualizar reglas, valida y despliega ese archivo en el proyecto Firebase. Controla los límites actuales en [precios de Firebase](https://firebase.google.com/pricing) y [cuota de Firestore](https://firebase.google.com/docs/firestore/pricing).

Para usarla localmente, abre `index.html` en un navegador moderno. Para alojarla, sirve la raíz del repositorio por HTTPS en GitHub Pages u otro hosting estático. La API de portapapeles y la opción de compartir requieren un contexto seguro; la descarga PNG funciona como respaldo. Sin cuenta, los datos locales se pierden si se borran los datos del sitio.

## Cálculo

- Material = gramos × precio del rollo / gramos del rollo.
- Tiempo = (horas + minutos / 60) × tarifa por hora.
- Precio real = material + tiempo.
- Precio final = precio real redondeado hacia arriba al múltiplo elegido.
- Saldo estimado = precio final − material − electricidad − reserva de mantenimiento.

La tarifa por hora incluye electricidad, desgaste y margen. Electricidad y mantenimiento se descuentan solamente al estimar el saldo; no se suman de nuevo al precio. El saldo no valora el trabajo manual ni considera impuestos.
