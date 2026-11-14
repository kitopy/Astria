# Fundamentos del borrador Astria

## Guardianes del Chaco

La operación se desarrolla sobre cartografía real de Paraguay. El punto de observación del Chaco y la estación terrestre ficticia de Asunción son elementos del juego. El recorrido y los tiempos son ilustrativos: no se calcula una órbita, cobertura de sensor, posición solar ni una ventana real de comunicaciones. La sombra del HUD es pedagógica. Los consumos se aplican por acción o etapa, no por segundo de vuelo.

Recursos geográficos y científicos incorporados localmente:

- Límites regionales: Natural Earth, 1:50m, selección de Paraguay, Bolivia, Brasil, Argentina, Uruguay y Chile. Dominio público. Fuente y condiciones: https://www.naturalearthdata.com/about/terms-of-use/ . Geometría original: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson .
- Imagen base: NASA Global Imagery Browse Services (GIBS), capa BlueMarble_ShadedRelief_Bathymetry. Mosaico de archivo servido por WMS en EPSG:3857, descargado para el encuadre oeste -75, sur -35, este -43, norte -12. No es una imagen en vivo ni un mapa de pérdida de bosque. Información: https://nasa-gibs.github.io/gibs-api-docs/ . Créditos: NASA GIBS, parte de ESDIS.
- Caso histórico: “Deforestation in Paraguay’s Gran Chaco”, NASA SVS, ID 15026, publicado el 6 de mayo de 2026. Serie natural-color Landsat de 1985 a 2025. Créditos: NASA’s Goddard Space Flight Center; Ross K. Walter (SSAI). Fuente: https://svs.gsfc.nasa.gov/15026/ . El video se conserva localmente y se muestra con reproductor y créditos.
- Motor cartográfico: MapLibre GL JS 6.18.0, licencia BSD-3-Clause. https://maplibre.org/projects/gl-js/ .

`data/sources.json` registra las URL exactas y hashes de los recursos NASA descargados. La región de observación del juego no identifica la huella exacta de la secuencia Landsat. El video histórico se presenta como un caso externo real; las imágenes obtenidas durante la misión y el comparador Observe son simulaciones y no se presentan como adquisiciones reales del dispositivo del jugador.

Guardianes de la Tierra es una simulación educativa para participantes de Super Kids de 9 a 13 años. Objetivo: obtener y transmitir dos observaciones de un bosque simulado. No predice el rendimiento de hardware ni de órbitas reales.

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

El arte del satélite y la ilustración de Tierra utilizada en el taller y el comparador Observe se generaron con IA. El mapa de la operación y el video de archivo usan los recursos reales identificados arriba. El hallazgo del comparador es narrativo y simulado: no se realiza detección automática de deforestación ni se adquieren imágenes en vivo. El video Landsat conserva sus años históricos y no representa las dos fotos obtenidas por el jugador. Una causa de cambio no se infiere automáticamente de dos imágenes.

NOAH usa mensajes preparados y, opcionalmente, la síntesis de voz local del navegador. No utiliza un servicio de IA conversacional. No se solicitan cuentas ni datos personales; sólo se conserva el diseño en el almacenamiento local del navegador. No se ha realizado todavía validación con usuarios de Super Kids.
