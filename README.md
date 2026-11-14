# Astrion
Videojuego para hackaton.

## Ejecutar en local

Usar Node.js 22.12 o superior. Instalar las dependencias respetando el archivo de bloqueo:

```sh
npm ci
npm run dev
```

Abrir la dirección que indique Vite. Para compilar: `npm run build`. Para verificar las reglas: `npm test`.

## Flujo de escenas

Se conserva el esqueleto JavaScript + Phaser 4 + Vite 8 y el recorrido Menu → Station → Build → Test → Reward.

- Menu y Station conservan el flujo y el diseño del equipo; la introducción sitúa la misión en el Chaco paraguayo.
- Build permite elegir una opción por categoría: cámara, paneles solares, batería y antena. Muestra costo, masa, capacidad de batería y consumo. El lanzamiento queda bloqueado si supera 100 créditos o 12 kg.
- Test recibe una copia del diseño de Build y ejecuta **Guardianes del Chaco**, una misión sobre un mapa real de Paraguay. El satélite se mueve, deja una traza y se detiene automáticamente en las oportunidades de observar y transmitir. Se puede pausar, reanudar, centrar el mapa y cambiar la velocidad visual. Las piezas elegidas determinan consumo, recarga, detalle y capacidad de envío.
- Reward recibe el resultado real de la simulación. Se necesitan dos imágenes completas recibidas en Tierra. Explica limitaciones y permite volver a Build conservando el diseño.

## Organización y colaboración

- `src/game/parts.json`: catálogo editable de piezas.
- `src/game/model.js`: reglas de recursos y simulación, independientes de Phaser y del navegador.
- `src/game/design.js`: validación y persistencia opcional del diseño en localStorage.
- `src/game/chaco-flight.js`: ruta geográfica didáctica, reloj visual y detención en cada oportunidad. No es un propagador orbital.
- `src/ui/chaco-map.js`: mapa MapLibre con datos locales; `chaco-hud.js` y `chaco.css`: controles y animaciones de la misión.
- `src/ui/satellite-sensor.js`: visor Canvas 2D que recorta el mosaico georreferenciado en la posición del satélite y guarda el fotograma al observar.
- `public/data/`: cartografía Natural Earth de la región, imagen georreferenciada NASA GIBS Blue Marble y video histórico Landsat de NASA. `sources.json` registra las fuentes, el encuadre y los hashes de los recursos de NASA.
- `src/ui/mission-ui.js` y `workshop.css`: interfaz compartida, propiedad de cada escena. Se monta sobre el contenedor DOM de Phaser y se destruye al salir para no duplicar controles.
- `tests/model.test.js`: casos de éxito, fallo de energía, rediseño, datos incompletos y acciones inválidas.

La integración convierte las reglas del borrador de TypeScript a JavaScript. No incorpora un segundo motor ni cambia las versiones de Phaser/Vite del esqueleto. El diseño viaja mediante datos de escena y se conserva también al volver al menú; la misión en curso se reinicia al volver a probar. La voz opcional de NOAH usa mensajes preparados y síntesis del navegador; se detiene al cambiar de escena.

## Alcance del borrador

La interfaz de construcción mantiene la dirección visual del borrador anterior y el área de diseño 1920 × 1080 con EXPAND del esqueleto. La misión sobre Paraguay tiene un HUD HTML adaptable al tamaño real de la ventana. La primera prueba está orientada a computadora o tablet horizontal; falta validar accesibilidad y lectura con Super Kids. Los controles de selección y de operación son HTML y permiten teclado; Menu y Station conservan los controles Phaser del equipo.

El satélite se compone de piezas visuales independientes en `src/ui/satellite.js`, tomadas de un atlas generado con IA. La cámara cambia de una a dos lentes, los paneles cambian de longitud, la batería de uno a dos módulos y la antena de varilla a plato. Al seleccionar una pieza se anima su montaje y aparece un realce breve, respetando movimiento reducido. La misma configuración visual se conserva en Build, Test y Reward. Las proporciones son ilustrativas y no corresponden a hardware real. Las elecciones también cambian los recursos y los resultados.

Al iniciar el recorrido se despliegan los paneles y el mapa sigue al satélite con un acercamiento gradual. El visor muestra el terreno debajo del dispositivo y un rectángulo en el mapa identifica ese encuadre. La cámara Exploradora utiliza un encuadre más estrecho y una salida de 640 × 360; la Esencial, 320 × 180. Estas diferencias son didácticas y no equivalen a resolución física de sensores. La fuente es el mismo mosaico Blue Marble de archivo para ambas pasadas: no se inventan diferencias históricas. Al observar se guarda el fotograma mostrado, aparece una miniatura y, después de transmitir, se marca como enviada. Reward conserva ambas capturas con su estado. Las imágenes sólo permanecen en memoria durante ese intento; no se suben ni se guardan en localStorage.

El arte de satélite es generado con IA. El mapa base y el video histórico provienen de NASA; los límites geográficos, de Natural Earth. El caso real aparece en **Caso real NASA** con video reproducible localmente y créditos. Es una secuencia Landsat del Chaco paraguayo entre 1985 y 2025, no imágenes capturadas por el satélite del jugador. La base Blue Marble es un mosaico de archivo, no una observación actual ni una capa de deforestación.

El punto de observación del Chaco es una ubicación didáctica elegida dentro de Paraguay; no es la huella exacta del video de NASA ni un sitio de monitoreo validado. La estación de Asunción es ficticia. El recorrido sobre el mapa es una traza ilustrativa, no la trayectoria física de un satélite. La sombra es una representación pedagógica, no un cálculo solar. Los valores del catálogo son didácticos y los cambios del bosque del minijuego Observe siguen siendo simulados. Consultar [fuentes, atribuciones y reglas](public/FUENTES.md).

La pausa automática en cada oportunidad evita perder la misión por reflejos. La energía cambia al pasar de etapa o al observar/transmitir, sin consumo continuo durante esperas o pausas. El vuelo se pausa también al ocultar la pestaña o abrir el caso NASA. Se conserva el flujo posterior del compañero: Reward → Observe → Finale cuando la misión resulta exitosa.

Los recursos del mapa, las fuentes, el worker MapLibre y el video se sirven desde la aplicación local. La misión no requiere cuentas, claves ni servicios externos durante la partida; el enlace de consulta a NASA sí abre su sitio. Hace falta un navegador con WebGL para el mapa interactivo.

`borrador-local/` se conserva fuera del control de versiones mediante `.git/info/exclude` en esta computadora. No es una dependencia de la aplicación integrada. `Otros recursos/` contiene material de referencia local y no debe incorporarse accidentalmente a un commit.
