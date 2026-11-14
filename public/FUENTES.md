# Fundamentos del borrador Astria

## Guardianes del Chaco

La operación se desarrolla sobre cartografía real de Paraguay. El punto de observación del Chaco y la estación terrestre ficticia de Asunción son elementos del juego. El recorrido y los tiempos son ilustrativos: no se calcula una órbita, cobertura de sensor, posición solar ni una ventana real de comunicaciones. La sombra del HUD es pedagógica. Los consumos se aplican por acción o etapa, no por segundo de vuelo.

Recursos geográficos y científicos incorporados localmente:

- Límites regionales: Natural Earth, 1:50m, selección de Paraguay, Bolivia, Brasil, Argentina, Uruguay y Chile. Dominio público. Fuente y condiciones: https://www.naturalearthdata.com/about/terms-of-use/ . Geometría original: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson .
- Imagen base: NASA Global Imagery Browse Services (GIBS), capa BlueMarble_ShadedRelief_Bathymetry. Mosaico de archivo servido por WMS en EPSG:3857, descargado para el encuadre oeste -75, sur -35, este -43, norte -12. No es una imagen en vivo ni un mapa de pérdida de bosque. Información: https://nasa-gibs.github.io/gibs-api-docs/ . Créditos: NASA GIBS, parte de ESDIS.
- Caso histórico: “Deforestation in Paraguay’s Gran Chaco”, NASA SVS, ID 15026, publicado el 6 de mayo de 2026. Serie natural-color Landsat de 1985 a 2025. Créditos: NASA’s Goddard Space Flight Center; Ross K. Walter (SSAI). Fuente: https://svs.gsfc.nasa.gov/15026/ . El video se conserva localmente y se muestra con reproductor y créditos.
- Motor cartográfico: MapLibre GL JS 6.18.0, licencia BSD-3-Clause. https://maplibre.org/projects/gl-js/ .

`data/sources.json` registra las URL exactas y hashes de los recursos NASA descargados. La región de observación del juego no identifica la huella exacta de la secuencia Landsat. El visor, la galería final, el video y el comparador utilizan el mismo caso histórico real. Las observaciones del vuelo recrean ese archivo; no son adquisiciones reales de un dispositivo actual ni representan un viaje de cuarenta años.

Guardianes de la Tierra es una simulación educativa para participantes de Super Kids de 9 a 13 años. Objetivo: obtener y transmitir dos observaciones de un bosque simulado. No predice el rendimiento de hardware ni de órbitas reales.

El visor usa los fotogramas locales de 1985 y 2025 de la secuencia NASA SVS 15026, a 1920 × 1080, con paneo y acercamiento leve. La Esencial genera una vista de 640 × 360; la Exploradora, 960 × 540. No se amplía el mapa regional para generar la imagen de cámara. Las capturas llevan el año del archivo y se indica su estado de envío. La galería final muestra el antes y después completos, compartidos con Observe; los contadores siguen indicando qué logró la misión. El archivo no está georreferenciado a la ubicación exacta del marcador, por lo que se retiró el rectángulo que antes representaba el encuadre sobre el mapa.

El desafío de visibilidad añade nubes generadas por el juego entre las observaciones. No corresponden a una medición meteorológica ni modifican la imagen original de NASA. Buscar un claro consume 6 unidades didácticas de energía para representar la orientación y estabilización de la cámara; no elimina nubes ni simula maniobras orbitales. El desplazamiento de encuadre y su duración son ilustrativos.

También se simulan cámara inestable y señal débil, resueltas con estabilización del sensor o alineación de antena. Sus efectos y el costo de 6 unidades son didácticos, sin modelar vibraciones ni propagación de radio. Cada intento sortea uno de los tres imprevistos excluyendo el anterior. Además del diseño se conserva localmente el identificador del último imprevisto para evitar repeticiones consecutivas al recargar.

## Fuentes de referencia

- Challenge elegido: https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/?tab=details
- Recursos: https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/?tab=resources
- CubeSat 101: https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf
- Design and Develop Science Missions: https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf
- Concept Maturity Levels: https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299
- Mission Design Lab: https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/
- GMAT: https://software.nasa.gov/software/GSC-19468-1
- Mission Visualization: https://nasa.github.io/mission-viz/
- Build It Yourself: https://science.nasa.gov/mission/webb/game-build-it-yourself/
- Digital Games and Activities, CSA: https://www.asc-csa.gc.ca/eng/youth-educators/digital-games-and-activities.asp
- Desafío de VR 2023, referencia complementaria: https://www.spaceappschallenge.org/2023/challenges/visualize-a-space-mission-using-virtual-reality/

Las pestañas oficiales de 2026 no pudieron leerse directamente durante la revisión. Se consultó su reproducción en el evento local https://hackathlone.com/challenges/space-mission-design-game y las fuentes primarias disponibles. La comprobación completa del enunciado oficial sigue pendiente.

## Aplicación y límites

Se aplica la relación entre objetivo, carga útil, alimentación eléctrica, masa, costo y comunicaciones. Las referencias de diseño guían el proceso; GMAT y Mission Visualization no se ejecutan dentro del juego. El recurso de VR no requiere implementar VR en esta versión.

Todos los valores del catálogo son elegidos para balancear el juego, no fichas de componentes comerciales. La masa usa kg didácticos; los créditos, bloques de datos y energía son unidades de juego. Generación solar y consumo corresponden a acciones o pasos abstractos; no se simula potencia instantánea. La batería comienza cargada. La estructura suma 10 créditos y 2 kg. Límites: 100 créditos y 12 kg. Cada cambio de etapa consume hasta 4 unidades para sistemas básicos; las etapas iluminadas recargan según el panel hasta la capacidad de la batería. En sombra no hay recarga. La escena de sombra representa un satélite en sombra que observa un área iluminada; geometría y fechas no están calculadas.

Hay una observación por etapa y una transmisión por contacto. Una imagen sólo se recibe al transmitir todos sus bloques. Se necesitan dos imágenes completas. La calidad detallada aporta más detalle, sin alterar el objetivo básico. La simulación ofrece tanto diseños exitosos como diseños inviables o insuficientes.

El arte del satélite se generó con IA. La Tierra 3D del taller y de resultados usa la textura real descrita en "Imagen real de la Tierra". El mapa, el video y los fotogramas del comparador usan los recursos reales identificados arriba. Observe compara fotogramas etiquetados 1985 y 2025 de la misma secuencia Landsat, extraídos sin recorte en 0.05 y 7.25 segundos del video local. Son una selección provisional; la revisión final de imágenes queda pendiente. Las áreas del ejercicio son anotaciones manuales para enseñar a comparar, no una clasificación científica ni detección automática. No se adquieren imágenes en vivo. El archivo conserva sus años históricos y no representa las dos fotos obtenidas por el jugador. Una causa de cambio no se infiere automáticamente de dos imágenes.

NOAH usa mensajes preparados y, opcionalmente, la síntesis de voz local del navegador. No utiliza un servicio de IA conversacional. No se solicitan cuentas ni datos personales; se conservan el diseño y el identificador del último imprevisto en el almacenamiento local del navegador. No se ha realizado todavía validación con usuarios de Super Kids.

## Imagen real de la Tierra (fondo 3D)

En Construir y en los resultados de Descubrir, la Tierra que gira detrás del satélite es un globo 3D con una textura real de la NASA. Durante Probar se muestra el mapa georreferenciado del Chaco y el visor de cámara:

- Textura: "Equirectangular Projected Earth for LARGEST", NASA/Goddard Space Flight Center Scientific Visualization Studio. https://svs.gsfc.nasa.gov/3615
- Datos Blue Marble Next Generation: cortesía de Reto Stöckli (NASA/GSFC) y NASA's Earth Observatory. Nubes: CPC (Climate Prediction Center) Cloud Composite.
- Se usa en 8192 × 4096 píxeles (o 4096 × 2048 si la tarjeta gráfica no admite más). La vista imita la de un satélite en órbita baja que avanza hacia el este, empezando sobre Sudamérica; la velocidad y el encuadre están elegidos para el juego, no calculados.

La galería de resultados y el ejercicio posterior Observe usan los dos fotogramas históricos completos del Chaco descritos arriba. El visor recrea el mismo par con un encuadre animado.
