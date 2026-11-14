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

- Menu y Station conservan su implementación original.
- Build permite elegir o arrastrar una opción por categoría: cámara, paneles solares, batería y antena. Muestra costo, masa, capacidad de batería y consumo. El lanzamiento queda bloqueado si supera 100 créditos o 12 kg.
- Test recibe una copia del diseño de Build. Permite avanzar una misión por etapas: lanzamiento, dos observaciones y una transmisión. Las piezas elegidas determinan consumo, recarga, detalle y capacidad de envío.
- Reward recibe el resultado real de la simulación. Se necesitan dos imágenes completas recibidas en Tierra. Explica limitaciones y permite volver a Build conservando el diseño.

## Organización y colaboración

- `src/game/parts.json`: catálogo editable de piezas.
- `src/game/model.js`: reglas de recursos y simulación, independientes de Phaser y del navegador.
- `src/game/design.js`: validación y persistencia opcional del diseño en localStorage.
- `src/ui/mission-ui.js` y `workshop.css`: interfaz compartida, propiedad de cada escena. Se monta sobre el contenedor DOM de Phaser y se destruye al salir para no duplicar controles.
- `tests/model.test.js`: casos de éxito, fallo de energía, rediseño, datos incompletos y acciones inválidas.

La integración convierte las reglas del borrador de TypeScript a JavaScript. No incorpora un segundo motor ni cambia las versiones de Phaser/Vite del esqueleto. El diseño viaja mediante datos de escena y se conserva también al volver al menú; la misión en curso se reinicia al volver a probar. La voz opcional de NOAH usa mensajes preparados y síntesis del navegador; se detiene al cambiar de escena.

## Alcance del borrador

La interfaz de construcción mantiene la dirección visual del borrador anterior. Respeta el formato 1920 × 1080 con escalado FIT del esqueleto; la primera prueba está orientada a computadora o tablet horizontal. En teléfonos puede resultar pequeña y falta validar accesibilidad y lectura con Super Kids. Los controles de selección son HTML y permiten teclado; Menu y Station todavía usan los botones originales de Phaser.

La ilustración del satélite es común a todas las combinaciones; el tamaño general distingue paneles compactos de extendidos, pero no representa ensamblaje geométrico de piezas individuales. Las elecciones sí cambian los recursos y los resultados. El hallazgo del bosque se explica con texto simulado, sin imágenes ambientales reales ni visor comparativo.

Las ilustraciones son generadas con IA. Los valores del catálogo son didácticos. Consultar [fuentes, atribuciones y reglas](public/FUENTES.md). Todavía falta validar el balance y la experiencia con usuarios del público objetivo.

`borrador-local/` se conserva fuera del control de versiones mediante `.git/info/exclude` en esta computadora. No es una dependencia de la aplicación integrada. `Otros recursos/` contiene material de referencia local y no debe incorporarse accidentalmente a un commit.
