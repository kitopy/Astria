# Astrion
Videojuego para hackaton.

## Saltar a una parte durante el desarrollo

En este equipo, abri `http://localhost:5173/?dev=1` (o `http://localhost:4173/?dev=1` para el preview local) para ver el selector de desarrollo. Permite abrir directamente una pieza del armado o una etapa del viaje. **Regreso - bateria en cero** inicia el tramo desde el Chaco hacia Asuncion con la bateria agotada; en esa pantalla podes cambiar la velocidad del viaje y repetir el ajuste visual. La opcion solo se activa en `localhost` o `127.0.0.1`; el juego normal no muestra el selector.

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
- `src/ui/satellite-sensor.js`: visor Canvas 2D con tomas históricas del Chaco, paneo suave y capturas con año; `src/game/chaco-sensor-view.js`: selección del archivo y encuadre.
- `src/ui/earth3d.js`: fondo de Tierra giratoria con Three.js y textura NASA; visible en construcción y resultados. Se oculta durante la operación sobre el mapa del Chaco.
- `src/game/chaco-visibility.js`: sorteo y reglas de los tres imprevistos. Nubes y cámara inestable aparecen entre observaciones; señal débil, antes del contacto terrestre. Cada intento tiene un único imprevisto y resolverlo cuesta 6 de energía una sola vez.
- `src/game/chaco-comparison.js`: pasos, pistas y zonas didácticas de la comparación; `src/ui/chaco-comparison.js` y su CSS: comparador adaptable con controles HTML y teclado.
- `public/data/`: cartografía Natural Earth de la región, imagen georreferenciada NASA GIBS Blue Marble y video histórico Landsat de NASA. `sources.json` registra las fuentes, el encuadre y los hashes de los recursos de NASA.
- `src/ui/mission-ui.js` y `workshop.css`: interfaz compartida, propiedad de cada escena. Se monta sobre el contenedor DOM de Phaser y se destruye al salir para no duplicar controles.
- `tests/model.test.js`: casos de éxito, fallo de energía, rediseño, datos incompletos y acciones inválidas.

La integración convierte las reglas del borrador de TypeScript a JavaScript. No incorpora un segundo motor ni cambia las versiones de Phaser/Vite del esqueleto. El diseño viaja mediante datos de escena y se conserva también al volver al menú; la misión en curso se reinicia al volver a probar. La voz opcional de NOAH usa mensajes preparados y síntesis del navegador; se detiene al cambiar de escena.

## Alcance del borrador

La interfaz de construcción mantiene la dirección visual del borrador anterior y el área de diseño 1920 × 1080 con EXPAND del esqueleto. La misión sobre Paraguay tiene un HUD HTML adaptable al tamaño real de la ventana. La primera prueba está orientada a computadora o tablet horizontal; falta validar accesibilidad y lectura con Super Kids. Los controles de selección y de operación son HTML y permiten teclado; Menu y Station conservan los controles Phaser del equipo.

El satélite se compone de piezas visuales independientes en `src/ui/satellite.js`, tomadas de un atlas generado con IA. La cámara cambia de una a dos lentes, los paneles cambian de longitud, la batería de uno a dos módulos y la antena de varilla a plato. Al seleccionar una pieza se anima su montaje y aparece un realce breve, respetando movimiento reducido. La misma configuración visual se conserva en Build, Test y Reward. Las proporciones son ilustrativas y no corresponden a hardware real. Las elecciones también cambian los recursos y los resultados.

Al iniciar el recorrido se despliegan los paneles y el mapa sigue al satélite con un acercamiento gradual. El visor usa los fotogramas del Chaco en 1985 y 2025, con un paneo suave sobre imágenes de 1920 × 1080. La primera observación recrea 1985 y la segunda, 2025; el año se identifica en el visor y las miniaturas. La cámara Esencial produce 640 × 360 y la Exploradora 960 × 540, con un encuadre algo más cerrado. Se reduce una imagen grande, en lugar de ampliar unos pocos píxeles del mapa continental. Estas diferencias son didácticas y no equivalen a resolución física de sensores. No se dibuja una huella geográfica del sensor, porque la vista de archivo no está vinculada a la posición exacta del marcador. El mapa conserva su función de recorrido ilustrativo.

Al observar se guarda el fotograma del visor y su año; las miniaturas indican si fue enviado. En resultados se muestra el par histórico completo **Antes · 1985 / Después · 2025**, el mismo utilizado por el comparador. La galería identifica el material como archivo, independientemente de cuántas fotos se hayan obtenido o enviado; los contadores de la misión mantienen ese resultado real. Las capturas recreadas sólo permanecen en memoria durante ese intento; no se suben ni se guardan en localStorage.

El arte de satélite es generado con IA. El mapa base y el video histórico provienen de NASA; los límites geográficos, de Natural Earth. El caso real aparece en **Caso real NASA** con video reproducible localmente y créditos. Es una secuencia Landsat del Chaco paraguayo entre 1985 y 2025, no imágenes capturadas por el satélite del jugador. La base Blue Marble es un mosaico de archivo, no una observación actual ni una capa de deforestación.

El punto de observación del Chaco es una ubicación didáctica elegida dentro de Paraguay; no es la huella exacta del video de NASA ni un sitio de monitoreo validado. La estación de Asunción es ficticia. El recorrido sobre el mapa es una traza ilustrativa, no la trayectoria física de un satélite. La sombra es una representación pedagógica, no un cálculo solar. Los valores del catálogo son didácticos. El vuelo, los resultados y Observe utilizan el mismo archivo histórico, sin representar un viaje real de cuarenta años. Consultar [fuentes, atribuciones y reglas](public/FUENTES.md).

**Detectives del Chaco** reemplaza la antigua comparación de ilustraciones por una investigación guiada: explorar con la barra, señalar un claro, responder qué cambió y obtener una insignia. Hay pistas progresivas, reintentos libres y controles de teclado. Volver a resultados conserva las capturas de la misión. El comparador usa provisionalmente dos fotogramas reales y sin recorte del mismo encuadre NASA SVS 15026, etiquetados 1985 y 2025 en el video; se extrajeron en los segundos 0.05 y 7.25. La selección final de imágenes queda pendiente. `public/data/sources.json` registra hashes, años y procedencia. Las zonas aceptadas son anotaciones didácticas manuales, no detección automática de pérdida de bosque. Si se cambia el par de imágenes, también deben revisarse esas zonas y pistas.

La pausa automática en cada oportunidad evita perder la misión por reflejos. La energía cambia al pasar de etapa o al observar/transmitir, sin consumo continuo durante esperas o pausas. El vuelo se pausa también al ocultar la pestaña o abrir el caso NASA. Se conserva el flujo posterior del compañero: Reward → Observe → Finale cuando la misión resulta exitosa.

En cada prueba se sortea uno entre tres imprevistos: **nubes**, **cámara inestable** o **señal débil**. Se excluye el anterior del sorteo, sin usar una ronda fija; el último se conserva en localStorage para mantener la exclusión al recargar. Si el almacenamiento no está disponible, se recuerda durante la sesión del juego. El sorteo sucede al iniciar cada intento válido, aunque se repita el mismo diseño o se abandone la misión.

Con nubes, el jugador busca un claro y se desplaza el encuadre; con cámara inestable, estabiliza la imagen que tiembla; con señal débil, alinea la antena y observa cómo mejoran las barras de señal. El recorrido se pausa, el ajuste tarda dos segundos y cuesta 6 de energía una sola vez, registrado en la bitácora. No se cobra por segundo ni por pulsaciones repetidas. Son efectos didácticos: no se altera el clima ni se calculan vibraciones o enlaces de radio reales. Abrir el caso NASA u ocultar la pestaña pausa también el ajuste. El diseño inicial sigue pudiendo completar cualquiera de los tres casos.

Los recursos del mapa, las fuentes, el worker MapLibre y el video se sirven desde la aplicación local. La misión no requiere cuentas, claves ni servicios externos durante la partida; el enlace de consulta a NASA sí abre su sitio. Hace falta un navegador con WebGL para el mapa interactivo.

`borrador-local/` se conserva fuera del control de versiones mediante `.git/info/exclude` en esta computadora. No es una dependencia de la aplicación integrada. `Otros recursos/` contiene material de referencia local y no debe incorporarse accidentalmente a un commit.
