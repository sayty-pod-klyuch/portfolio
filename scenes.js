import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('hero3d');
if (canvas) {
  try { init(); } catch (e) { console.warn('3D недоступно', e); canvas.style.display = 'none'; }
}

function init() {
  const kind = canvas.dataset.scene;
  const acc = new THREE.Color(canvas.dataset.acc || '#ffb000');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 12);
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(4, 6, 8);
  scene.add(key);
  const rim = new THREE.PointLight(acc, 80, 40);
  rim.position.set(-6, -2, 5);
  scene.add(rim);

  const builders = {wheel, barber, ceiling, tiles, hammer};
  const update = builders[kind](scene, acc);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  let visible = true, last = performance.now(), t = 0;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) { update(1.2, 0); renderer.render(scene, camera); return; }
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible) return;
    t += dt;
    update(t, dt);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
}

/* ---------- Шиномонтаж: крутящееся колесо ---------- */
function wheel(scene, acc) {
  const tilt = new THREE.Group(), g = new THREE.Group();
  tilt.add(g); tilt.scale.setScalar(0.88); scene.add(tilt);
  const rubber = new THREE.MeshStandardMaterial({color: 0x151515, roughness: 0.85, metalness: 0});
  const steel = new THREE.MeshStandardMaterial({color: 0xf2f4f7, roughness: 0.18, metalness: 1, envMapIntensity: 1.6});
  const dark = new THREE.MeshStandardMaterial({color: 0x1a1c1f, roughness: 0.45, metalness: 0.8});
  const accM = new THREE.MeshStandardMaterial({color: acc, roughness: 0.35, metalness: 0.6});

  g.add(new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.85, 28, 72), rubber));
  const blockGeo = new THREE.BoxGeometry(0.26, 0.5, 1.2);
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * Math.PI * 2;
    const b = new THREE.Mesh(blockGeo, rubber);
    b.position.set(Math.cos(a) * 3.42, Math.sin(a) * 3.42, 0);
    b.rotation.z = a;
    g.add(b);
  }
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.78, 1.2, 64), steel);
  rim.rotation.x = Math.PI / 2; g.add(rim);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.12, 48), dark);
  dish.rotation.x = Math.PI / 2; dish.position.z = 0.58; g.add(dish);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.06, 12, 64), accM);
  lip.position.z = 0.62; g.add(lip);
  for (let i = 0; i < 5; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = i / 5 * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.35, 0.16), steel);
    spoke.position.set(0, 0.85, 0.68);
    arm.add(spoke);
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 12), dark);
    bolt.rotation.x = Math.PI / 2; bolt.position.set(0, 0.42, 0.82);
    arm.add(bolt);
    g.add(arm);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 32), steel);
  hub.rotation.x = Math.PI / 2; hub.position.z = 0.74; g.add(hub);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 24), accM);
  cap.rotation.x = Math.PI / 2; cap.position.z = 0.78; g.add(cap);

  return (t, dt) => {
    g.rotation.z -= dt * 1.7;
    tilt.rotation.y = -0.6 + Math.sin(t * 0.4) * 0.2;
    tilt.rotation.x = 0.14;
  };
}

/* ---------- Барбершоп: ножницы и расчёска ---------- */
function barber(scene, acc) {
  const root = new THREE.Group(); scene.add(root);
  const steel = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.14, metalness: 1, envMapIntensity: 1.8});
  const gold = new THREE.MeshStandardMaterial({color: acc, roughness: 0.28, metalness: 1});
  const black = new THREE.MeshStandardMaterial({color: 0xe9d9b4, roughness: 0.3, metalness: 0.05});

  function half(side) {
    const grp = new THREE.Group();
    const sh = new THREE.Shape();
    sh.moveTo(-0.22, -0.2); sh.lineTo(0.27, -0.2); sh.lineTo(0.07, 4.5); sh.lineTo(-0.05, 4.55); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2});
    geo.translate(0, 0, -0.04);
    grp.add(new THREE.Mesh(geo, steel));
    const shank = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.9, 0.12), steel);
    shank.position.set(side * 0.12, -1.1, 0); grp.add(shank);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.1, 18, 48), gold);
    ring.position.set(side * 0.4, -2.45, 0); grp.add(ring);
    grp.position.z = side * 0.06;
    return grp;
  }
  const A = half(1), B = half(-1);
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.34, 20), gold);
  pivot.rotation.x = Math.PI / 2;
  const sc = new THREE.Group();
  sc.add(A, B, pivot);
  sc.scale.setScalar(0.62);
  sc.position.set(0.8, 0.2, 0);
  root.add(sc);

  const comb = new THREE.Group();
  const spine = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 0.18), black);
  comb.add(spine);
  const tooth = new THREE.BoxGeometry(0.1, 1.0, 0.12);
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(tooth, black);
    m.position.set(-1.55 + i * 0.1825, -0.74, 0);
    comb.add(m);
  }
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.06, 0.2), gold);
  stripe.position.y = 0.15; comb.add(stripe);
  comb.scale.setScalar(0.5);
  comb.position.set(-2.4, -1.9, 1.2);
  comb.rotation.z = 0.55;
  root.add(comb);

  return (t) => {
    const ang = 0.2 + 0.19 * Math.sin(t * 2.4);
    A.rotation.z = ang; B.rotation.z = -ang;
    sc.rotation.z = -0.38;
    root.rotation.y = Math.sin(t * 0.5) * 0.55;
    comb.rotation.y = Math.sin(t * 0.8) * 0.5;
    comb.position.y = -1.9 + Math.sin(t * 1.1) * 0.12;
  };
}

/* ---------- Натяжные потолки: панель со светильниками ---------- */
function ceiling(scene, acc) {
  const root = new THREE.Group(); scene.add(root);
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(7, 4.6, 0.2),
    new THREE.MeshPhysicalMaterial({color: 0xe8f0ff, roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06})
  );
  root.add(panel);
  const glowFrame = new THREE.Mesh(new THREE.BoxGeometry(7.5, 5.1, 0.1), new THREE.MeshBasicMaterial({color: acc}));
  glowFrame.position.z = -0.16; root.add(glowFrame);
  const silver = new THREE.MeshStandardMaterial({color: 0xd8dde4, metalness: 1, roughness: 0.25});
  const glows = [];
  for (const x of [-2.2, 0, 2.2]) for (const y of [-1.1, 1.1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 12, 40), silver);
    ring.position.set(x, y, 0.12); root.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.19, 32), new THREE.MeshBasicMaterial({color: 0xffffff}));
    disc.position.set(x, y, 0.13); root.add(disc);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), new THREE.MeshBasicMaterial({color: acc, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false}));
    glow.position.set(x, y, 0.14); root.add(glow); glows.push(glow);
  }
  root.scale.setScalar(0.92);
  return (t) => {
    root.rotation.x = -0.5;
    root.rotation.y = Math.sin(t * 0.45) * 0.55;
    glows.forEach((g, i) => { g.material.opacity = 0.26 + 0.1 * Math.sin(t * 1.6 + i); });
  };
}

/* ---------- Плитка: волна из плиток ---------- */
function tiles() {
  const scene = arguments[0];
  const root = new THREE.Group(); scene.add(root);
  const cols = [0xc8643c, 0x2a7f82, 0xefe6d8, 0x153b3f];
  const geo = new THREE.BoxGeometry(1.05, 1.05, 0.16);
  const items = [];
  const N = 5, M = 4;
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const mat = new THREE.MeshPhysicalMaterial({color: cols[(i + j * 2) % 4], roughness: 0.22, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.1});
    const m = new THREE.Mesh(geo, mat);
    m.position.set((i - (N - 1) / 2) * 1.2, (j - (M - 1) / 2) * 1.2, 0);
    root.add(m);
    items.push({m, ph: i * 0.6 + j * 0.8});
  }
  root.scale.setScalar(0.98);
  return (t) => {
    root.rotation.x = -0.42;
    root.rotation.y = Math.sin(t * 0.3) * 0.35;
    items.forEach(({m, ph}) => {
      const s = Math.sin(t * 1.5 + ph);
      m.rotation.y = s * 0.55;
      m.position.z = s * 0.25;
    });
  };
}

/* ---------- Ремонт: молоток ---------- */
function hammer(scene, acc) {
  const pivot = new THREE.Group(), body = new THREE.Group();
  pivot.add(body); scene.add(pivot);
  const wood = new THREE.MeshStandardMaterial({color: 0xb07a40, roughness: 0.6, metalness: 0});
  const steel = new THREE.MeshStandardMaterial({color: 0xf2f4f7, roughness: 0.2, metalness: 1, envMapIntensity: 1.6});
  const grip = new THREE.MeshStandardMaterial({color: acc, roughness: 0.5, metalness: 0.1});
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 4.4, 24), wood);
  handle.position.y = 2.2; body.add(handle);
  const gripM = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 24), grip);
  gripM.position.y = 0.85; body.add(gripM);
  const head = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.9), steel);
  head.position.set(0, 4.7, 0); body.add(head);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.22, 32), steel);
  face.rotation.z = Math.PI / 2; face.position.set(1.28, 4.7, 0); body.add(face);
  const claw = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.7, 20), steel);
  claw.rotation.z = Math.PI / 2; claw.position.set(-1.9, 4.75, 0); body.add(claw);
  body.position.y = -2.9;
  return (t) => {
    pivot.rotation.z = -0.22 + Math.sin(t * 2.2) * 0.3;
    pivot.rotation.y = Math.sin(t * 0.6) * 0.85;
  };
}
