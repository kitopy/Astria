# ASTRION · Misión Chaco

Juego web educativo para el NASA Space Apps Challenge 2026. Los jugadores (de 9 a 12 años) arman un
satélite, lo hacen volar sobre el Chaco paraguayo y comparan imágenes Landsat de NASA de 1985 y de hoy
para descubrir cómo cambió el bosque.

## Ejecutar en local

Usar Node.js 22.12 o superior.

```sh
npm ci
npm run dev        # juego en http://localhost:5173
npm test           # reglas del juego
npm run build      # versión para publicar (carpeta dist/)
```

En `localhost`, agregar `?dev=1` a la dirección abre un selector para saltar a cualquier parte: una pieza
del taller, un momento del vuelo, la comparación de imágenes o el final.

## Recorrido del juego

1. **Menú** y **estación**: NOAH, la inteligencia de la nave, presenta la misión.
2. **Taller** (`BuildScene`): se arma el satélite pieza por pieza (cámara, paneles, batería, antena),
   arrastrando cada una. Al final, una revisión dice si alcanzan la energía, el envío de fotos y el cohete.
3. **Vuelo** (`TestScene`): el satélite vuela solo sobre un mapa real de Paraguay. Se detiene para tomar
   las dos fotos (1985 y hoy), resuelve un imprevisto sorteado (nubes, cámara inestable o señal débil)
   y en Asunción envía las fotos.
4. **Análisis** (`ObserveScene`): con una lupa sobre la imagen de hoy se ve el mismo lugar en 1985;
   se marcan dos cambios y se responde qué le pasó al bosque.
5. **Final** (`RewardScene`): si las fotos llegaron, lo que el jugador practicó (diseñar, probar,
   descubrir) con sus dos fotos. Si faltó algo, qué faltó y un botón para cambiar esa pieza.

## Organización

- `src/game/`: reglas sin Phaser ni navegador (energía, datos, vuelo, imprevistos, comparación),
  con pruebas en `tests/`. `parts.json` es el catálogo de piezas.
- `src/scenes/`: una escena por pantalla.
- `src/ui/`: interfaz compartida (`mission-ui.js`, `dialog.js`), satélite (`satellite.js` y el atlas
  `public/assets/satellite-modules.png`), Tierra 3D (`earth3d.js`), mapa (`chaco-map.js`), interfaz del
  vuelo (`chaco-hud.js`), análisis (`chaco-brush.js`), voz (`noahVoice.js`) y sonidos (`sfx.js`).
- `public/data/`: mapa, imágenes y video de NASA y Natural Earth. `sources.json` y `public/FUENTES.md`
  registran fuentes, licencias y hashes.

## Voz de NOAH

Las frases de NOAH están grabadas con ElevenLabs (voz "Sarah", español forzado) en `public/assets/voice/`.
Si una frase cambia, actualizar `src/game/noah-lines.js` o `scripts/noah-other-lines.mjs` y correr:

```sh
npm run voice -- --prune     # graba las frases nuevas y borra las que ya no se usan
```

Necesita `ELEVENLABS_API_KEY` en `.env.local` (no se sube al repositorio). Una frase sin grabar usa la voz
del navegador. NOAH nunca habla mientras hay un diálogo abierto: espera a que se cierre.

## Para colaborar

Leer `AGENTS.md` (reglas de diseño, código y Git para el equipo y para cualquier asistente de IA).

## Datos y simulación

El mapa base (NASA GIBS Blue Marble), los límites (Natural Earth) y las imágenes del Chaco (Landsat,
NASA SVS 15026) son reales. El satélite, el recorrido, los imprevistos y la estación de Asunción son
simulados con fines didácticos. Detalle completo en `public/FUENTES.md`.
