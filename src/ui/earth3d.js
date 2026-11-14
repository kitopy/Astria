// Real Earth rotating behind the mission screens, like NASA footage from orbit.
//
// It's drawn with Three.js (a 3D library) in its own <canvas id="earth-bg">, placed BEHIND
// the Phaser canvas (see index.html). Phaser's canvas is transparent, so wherever a scene
// doesn't draw anything, this Earth shows through.
//
// Texture: NASA/Goddard Space Flight Center Scientific Visualization Studio (SVS 3615),
// Blue Marble Next Generation data courtesy of Reto Stöckli (NASA/GSFC) and NASA's Earth Observatory.
// An "equirectangular" image: the world map stretched so it can be wrapped around a sphere.

const BASE = import.meta.env.BASE_URL;
const ROTATION_SPEED = 0.012; // radians per second (one full turn ≈ 9 minutes; the Earth is big on screen)
// A huge sphere far below and behind the camera: only its top arc shows, as a wide horizon.
const EARTH_RADIUS = 10;
const EARTH_POSITION = { y: -10.75, z: -4 };
const HEADING = 0.45; // radians: direction the ground moves under the satellite
// Which part of the world is below at the start: -1.3 puts South America (Paraguay, Bolivia,
// southern Amazon) in view. Computed from how Three.js wraps the texture plus the rotations above.
const START_LONGITUDE = -1.3;

let ready = null; // Promise of the 3D world, created once
let wanted = false; // should the Earth be visible right now?

// Builds the 3D world. Three.js is loaded only now (dynamic import), so the menu loads faster.
async function build() {
  const THREE = await import('three');
  const canvas = document.getElementById('earth-bg');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0618);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  camera.position.set(0, 0, 6);

  // --- Earth ---
  // Sharpest texture the graphics card can handle: 8192px (most computers) or 4096px.
  const hiRes = renderer.capabilities.maxTextureSize >= 8192;
  const texture = await new THREE.TextureLoader().loadAsync(
    `${BASE}assets/nasa/earth-clouds-${hiRes ? 8192 : 4096}.jpg`,
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // sharper near the horizon

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS, 192, 192),
    // Phong material: gives the shiny Sun reflection (specular highlight) seen on oceans.
    new THREE.MeshPhongMaterial({ map: texture, specular: 0x334466, shininess: 14 }),
  );
  earth.rotation.y = START_LONGITUDE;

  // Orientation like the view from the International Space Station:
  // the poles point sideways, so the top of the sphere (the part we see) is the EQUATOR,
  // where the continents are. Spinning around that axis makes the ground pass below the
  // satellite, coming from the horizon. HEADING turns that path a bit, like a real orbit.
  const orbit = new THREE.Group();
  orbit.position.set(0, EARTH_POSITION.y, EARTH_POSITION.z);
  orbit.rotation.set(0, HEADING, -Math.PI / 2);
  orbit.add(earth);
  scene.add(orbit);

  const fresnel = (power, strength, color, side) =>
    new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float facing = abs(dot(vNormal, vec3(0.0, 0.0, 1.0))); // 1 = facing the camera, 0 = edge
          float glow = pow(1.0 - facing, ${power.toFixed(1)}) * ${strength.toFixed(2)};
          gl_FragColor = vec4(${color}, 1.0) * glow;
        }`,
      side,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

  // --- Atmosphere, two layers ("fresnel" effect: stronger where we look at it sideways) ---
  // 1) Haze over the surface near the horizon, like the blue fog in ISS photos.
  const haze = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.003, 128, 128),
    fresnel(4, 0.45, '0.35, 0.55, 1.0', THREE.FrontSide),
  );
  // 2) Glowing band above the horizon.
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.012, 128, 128),
    fresnel(5, 1.8, '0.4, 0.6, 1.0', THREE.BackSide),
  );
  for (const layer of [haze, glow]) {
    layer.position.copy(orbit.position);
    scene.add(layer);
  }

  // --- Stars far behind ---
  const starPositions = [];
  for (let i = 0; i < 1500; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(80);
    if (v.z < 0) starPositions.push(v.x, v.y, v.z); // only behind the Earth, facing the camera
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xe6d8ff, size: 0.18 })));

  // --- Light: soft fill + "Sun" in front, a bit to the left, so the oceans catch its reflection ---
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.position.set(-3, 2.5, 8);
  scene.add(ambient, sun);

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  // Animation loop: runs only while the Earth is visible.
  // `running` guarantees a single loop, even if hide/show happen in a quick sequence
  // (e.g. going from Build to Test hides it and shows it again right away).
  let running = false;
  let last = 0;
  const frame = (now) => {
    if (!wanted) {
      running = false;
      return;
    }
    // Minus: the view moves EAST, as seen from a satellite in orbit (it travels east faster
    // than the Earth turns): South America → Atlantic → Africa → ...
    earth.rotation.y -= ROTATION_SPEED * ((now - last) / 1000);
    last = now;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  };

  return { canvas, sun, ambient, start };
}

// Starts loading in the background (call early, e.g. in the Boot scene) so it's ready later.
export function prepareEarth() {
  ready ??= build();
  return ready;
}

export async function showEarth() {
  wanted = true;
  const world = await prepareEarth();
  if (!wanted) return; // hidden again while it was loading
  world.canvas.style.visibility = 'visible';
  world.start();
}

export function hideEarth() {
  wanted = false;
  const canvas = document.getElementById('earth-bg');
  if (canvas) canvas.style.visibility = 'hidden';
}

// Daylight (true) or the satellite in Earth's shadow (false): dims the Sun.
export async function setEarthDaylight(isDay) {
  const world = await prepareEarth();
  world.sun.intensity = isDay ? 3 : 0.25;
  world.ambient.intensity = isDay ? 0.5 : 0.12;
}
