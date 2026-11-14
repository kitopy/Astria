# Astria — Guardianes de la Tierra

Primer borrador web jugable para niñas y niños de 9 a 13 años de Super Kids. Diseñá un satélite, elegí entre componentes con ventajas y costos, y probá si puede obtener y transmitir dos imágenes de un bosque simulado.

## Abrir en esta computadora

Hacé doble clic en **iniciar.cmd**. El navegador abre el juego y la ventana del servidor debe permanecer abierta mientras jugás. También podés visitar http://127.0.0.1:5173 si el servidor ya está activo. Para detenerlo, usá Ctrl+C en la ventana del servidor.

El lanzador usa Node del sistema o el runtime de Codex disponible en esta computadora. No instala programas globales. Si faltan dependencias, seguí la preparación indicada abajo.

## Preparar en otra computadora

Requisitos: Node.js 22.12 o superior y pnpm. Con el repositorio clonado:

```sh
pnpm install
pnpm dev
```

Abrí la dirección que muestre la consola. Si 5173 está ocupado, Vite puede elegir otro puerto. Para usar npm en lugar de pnpm: `npm install` y `npm run dev`; el archivo de bloqueo oficial del proyecto es pnpm-lock.yaml.

## Cómo jugar

1. Elegí una opción de cámara, paneles, batería y antena. Podés hacer clic, usar el teclado o arrastrar una opción hacia el satélite.
2. Comprobá los límites de masa y presupuesto. La estructura ya está incluida.
3. Pulsá **Probar mi satélite** y avanzá las etapas a tu ritmo.
4. Obtené una imagen en cada etapa de observación y transmití durante el contacto terrestre.
5. Leé el resultado y volvé al taller para mejorar tu diseño.

NOAH siempre muestra texto. Podés activar su voz o escuchar el mensaje actual si el navegador dispone de síntesis de voz. La disponibilidad y calidad de voces depende del dispositivo. El diseño se conserva localmente al recargar; reiniciar lo devuelve a las piezas iniciales. La misión en curso no se guarda.

## Tecnología y verificación

TypeScript, Phaser 3 y Vite. Interfaz HTML/CSS con controles de teclado; lienzo Phaser para la escena. Catálogo de componentes en `src/parts.json` y reglas independientes de la interfaz en `src/model.ts`.

```sh
pnpm test
pnpm build
pnpm preview
```

Las pruebas cubren éxito, falta de energía, rediseño, transmisión parcial, límites de lanzamiento y acciones inválidas. La compilación genera `dist/`, publicable en un alojamiento estático. Phaser produce un paquete grande para esta versión; no se ha hecho una optimización avanzada de carga.

## Alcance y ciencia

Consultá [fuentes y reglas](public/FUENTES.md). Los valores de componentes son unidades didácticas elegidas para el juego. La escena y el hallazgo ambiental son simulados; no hay integración de datos NASA ni detección automática de cambios. El hallazgo inicial se presenta con texto, sin un visor comparativo de imágenes. La ilustración del satélite es común a todas las combinaciones; las elecciones sí modifican las reglas y recursos.

Esta versión sirve para probar la mecánica construir → experimentar → mejorar. Falta validar comprensión, balance, duración y atractivo con participantes de Super Kids. El arte fue generado con IA y no representa materiales oficiales NASA. La apariencia de NOAH es provisional.

## Trabajo en GitHub

Repositorio: https://github.com/kitopy/astria

Los borradores se trabajan en ramas; `main` conserva la versión estable. Los documentos originales de `Otros recursos/` son contexto local y no se publican automáticamente. No se versionan dependencias, compilaciones ni credenciales.
