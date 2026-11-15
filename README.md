# ASTRION · Misión Chaco

**Diseñá un satélite, volá sobre Paraguay y descubrí con imágenes reales de la NASA cómo cambió el bosque
del Chaco en 40 años.**

Juego web educativo creado para el **NASA Space Apps Challenge 2026**, desafío
[Space Mission Design Game](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/).
Pensado para chicas y chicos de **9 a 12 años**.

> **English summary.** ASTRION is a web game for kids aged 9–12, made for the NASA Space Apps Challenge 2026
> (Space Mission Design Game). Players build a satellite by choosing real trade-offs (camera, solar panels,
> battery, antenna), fly it over a real map of Paraguay, deal with a surprise problem, send their photos to
> a ground station and finally compare real NASA Landsat images of the Gran Chaco from 1985 and today to
> discover the deforestation. The game is in Spanish, with a voiced AI guide (NOAH).

## El problema

El Gran Chaco paraguayo es uno de los bosques que más rápido desaparecieron en las últimas décadas. Los
satélites Landsat de la NASA lo fotografían desde hace más de 40 años, y comparando esas fotos se ve el
cambio. ASTRION lleva a los chicos a vivir ese trabajo: diseñar la misión, hacerla volar y descubrir el
cambio con sus propios ojos.

## Cómo se juega

1. **Armá tu satélite.** En el taller se elige, pieza por pieza, entre dos opciones de cámara, paneles
   solares, batería y antena, y se arrastra cada una al satélite. Cada elección tiene un costo: más
   detalle gasta más batería, más batería pesa más, y todo tiene que entrar en el cohete.
2. **Revisá antes de despegar.** NOAH revisa si alcanzan la energía, el envío de fotos y el cohete, y lleva
   directo a la pieza que hay que cambiar.
3. **Volá sobre el Chaco.** El satélite vuela solo sobre un mapa real de Paraguay. Al pasar sobre el bosque
   se toman dos fotos: el Chaco en **1985** y **hoy**.
4. **Resolvé un imprevisto.** En cada vuelo aparece uno al azar: nubes, cámara inestable o señal débil.
   Arreglarlo gasta batería.
5. **Enviá las fotos a la Tierra.** Desde la estación de Asunción, las fotos viajan por la antena. Si la
   antena es chica, no llegan todas.
6. **Investigá.** Con una lupa sobre la imagen de hoy se ve el mismo lugar en 1985. Hay que encontrar dos
   cambios y responder qué le pasó al bosque.
7. **Misión cumplida.** El final muestra lo que se practicó: diseñaste, probaste, descubriste. Si algo
   falló, el juego dice qué faltó y lleva a la pieza para intentarlo otra vez.

## Qué se aprende

- **Diseño de misiones espaciales:** cada pieza resuelve algo y cuesta algo (energía, masa, presupuesto,
  capacidad de envío). No hay una única respuesta correcta.
- **Cómo trabaja un satélite de observación:** fotografía con energía del Sol y de la batería, pasa por
  la sombra, y necesita una estación en Tierra para enviar sus datos.
- **Observación de la Tierra:** comparar imágenes de distintos años permite ver cambios que desde el
  suelo no se notan.
- **Probar y mejorar:** fallar es parte del diseño; el juego explica qué falló y cómo mejorarlo.

## Pensado para chicos

- Una tarea por pantalla, pocas palabras y el juego avanza solo cuando no hay nada que decidir.
- **NOAH**, la inteligencia de la nave, guía con voz en español (grabada) y nunca habla encima de un aviso.
- Respuesta inmediata a cada acción: animaciones, sonidos y la foto que se "revela" línea por línea.
- Se juega con mouse o pantalla táctil, sin cuentas ni datos personales.

## Datos reales de la NASA

| Dato | Fuente |
| --- | --- |
| Imágenes del Chaco, 1985 y 2025 | NASA Scientific Visualization Studio, [*Deforestation in Paraguay's Gran Chaco*](https://svs.gsfc.nasa.gov/15026/) (Landsat). NASA Goddard Space Flight Center · Ross K. Walter (SSAI) |
| Mapa base del vuelo | NASA GIBS, Blue Marble |
| Tierra 3D del taller | NASA Blue Marble (SVS) |
| Límites de países | Natural Earth (dominio público) |

El satélite, el recorrido, los imprevistos y la estación de Asunción son **simulados** con fines
didácticos. Fuentes, licencias y hashes en [`public/FUENTES.md`](public/FUENTES.md) y
[`public/data/sources.json`](public/data/sources.json).

## Tecnología

- [Phaser 4](https://phaser.io/) para las escenas del juego y [Vite](https://vite.dev/) para el desarrollo.
- [Three.js](https://threejs.org/) para la Tierra en 3D y [MapLibre GL JS](https://maplibre.org/) para el mapa de Paraguay.
- Voz de NOAH grabada con ElevenLabs; sonidos generados con la Web Audio API.
- Reglas del juego en JavaScript puro, con pruebas automáticas (`node --test`).

## Ejecutar en local

Requiere Node.js 22.12 o superior.

```sh
npm ci
npm run dev        # juego en http://localhost:5173
npm test           # pruebas de las reglas
npm run build      # versión para publicar (carpeta dist/)
```

En `localhost`, agregar `?dev=1` a la dirección abre un selector para saltar a cualquier parte del juego:
una pieza del taller, un momento del vuelo, la investigación o el final.

### Organización del código

- `src/game/`: reglas sin Phaser ni navegador (energía, datos, vuelo, imprevistos, comparación). Pruebas en
  `tests/`. Catálogo de piezas en `parts.json`.
- `src/scenes/`: una escena por pantalla (Menú, Estación, Taller, Vuelo, Investigación, Final).
- `src/ui/`: interfaz compartida y diálogos, satélite, Tierra 3D, mapa, voz de NOAH y sonidos.
- `public/`: imágenes, fuentes, voz grabada y datos de NASA.

### Voz de NOAH

Las frases están en `public/assets/voice/`. Si cambia un texto de NOAH, actualizar
`src/game/noah-lines.js` o `scripts/noah-other-lines.mjs` y correr `npm run voice -- --prune` (necesita
`ELEVENLABS_API_KEY` en `.env.local`, que no se sube al repositorio).

### Colaborar

Leer [`AGENTS.md`](AGENTS.md): dirección de diseño, estilo de código y uso de Git para el equipo y para
cualquier asistente de IA.

## Equipo

- **Lucas Azevedo:** desarrollo, diseño de la experiencia y pulido del juego.
- **Cesar Goiburu:** misión sobre el Chaco, vuelo e investigación con imágenes.
- **Jona:** contenido educativo.
