/* The front page's atomizer in 3D: a cut, engraved flacon of antique brass with a jewel on its front, a brass collar
   and pump with its nozzle, a braided silk cord to a rubber bulb in a brass net, and a silk tassel, drawn with three.js
   (loaded from jsDelivr through the import map in index.html).
   landing.js owns the page: it shows a still picture of this same atomizer (img/atomizer-ltr.webp and -rtl.webp, made
   by tools/render_atomizer.py from this file) and handles every press. This module, when WebGL is there, puts the live
   atomizer in place of that picture and tells landing.js where the nozzle and the bulb are (window.PP_ATOMIZER3D). The
   jewel takes the colour of each perfume sprayed. It draws on demand: once when the atomizer appears, while it turns
   toward the pointer and while the bulb springs back after a press, never in a running loop; without motion it draws
   still frames only. */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/* the atomizer box's proportions, the same as the still pictures and .lp-atomizer in landing.css */
export const WIDTH = 420, HEIGHT = 330;
const V2 = (r, y) => new THREE.Vector2(r, y), V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------- shapes (one unit is about a centimetre; the flacon stands on y = 0, centred on x = 0) ---------- */
/* the flacon's outline from the middle of its base to its neck, turned with twelve flat sides; each band of the
   outline carries its own engraving (see engrave) */
const BODY = [[0, 0], [1.25, 0], [1.62, 0.18], [1.76, 1.05], [1.62, 2.3], [1.0, 3.0], [0.46, 3.3], [0.42, 3.42]];
const SIDES = 12, TURN = Math.PI / SIDES;       /* a flat side faces the viewer */
const COLLAR = [[0.40, 3.28], [0.56, 3.3], [0.60, 3.36], [0.60, 3.46], [0.56, 3.5], [0.60, 3.54], [0.60, 3.64], [0.56, 3.68], [0.60, 3.72], [0.60, 3.82], [0.52, 3.88], [0.40, 3.9]];
const DOME = [[0.50, 3.88], [0.49, 4.02], [0.44, 4.2], [0.34, 4.34], [0.20, 4.43], [0.08, 4.47], [0, 4.48]];
/* the bulb lies on the table to the left, its neck turned toward the flacon */
const BULB_AT = V3(-3.55, 0.97, 0.35), BULB_TURN = -1.22, BULB_R = V3(0.93, 1.18, 0.93);
const JEWEL = "#E48A3C";   /* topaz until a perfume is sprayed */

const lathe = (pts, segs, phi = 0) => new THREE.LatheGeometry(pts.map(([r, y]) => V2(r, y)), segs, phi);
function rod(a, b, r, material, segs = 20) {
  const dir = b.clone().sub(a), len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, segs, 1), material);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.normalize());
  return m;
}
function canvasTexture(w, h, draw, colour) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
/* a fixed sequence of random numbers, so every drawing of the patina is the same */
const seeded = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* ---------- the engraving: one motif per flat side, band by band ----------
   The texture is 12 sides wide and 7 bands high, one band per stretch of BODY (band 0, the base, at the bottom of the
   picture). Bands 1 to 5 carry, from the foot up: a row of beads, a ruled band of chevrons, a pointed arch with an
   inner arch and an eight-pointed star, a pair of scallops, and flutes. The same lines make the relief, the dark
   patina in the cuts and the dull finish inside them. */
function engrave(x, W, H) {
  x.save(); x.scale(W / 1536, H / 896); W = 1536; H = 896;
  const cw = W / SIDES, zh = H / 7, top = z => H - (z + 1) * zh;
  const line = (x1, y1, x2, y2) => { x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); };
  const arch = (cx, t, b, r) => {
    const spring = t + (b - t) * 0.38;
    x.beginPath(); x.moveTo(cx - r, b); x.lineTo(cx - r, spring);
    x.bezierCurveTo(cx - r, spring - (spring - t) * 0.55, cx - r * 0.3, t + (spring - t) * 0.15, cx, t);
    x.bezierCurveTo(cx + r * 0.3, t + (spring - t) * 0.15, cx + r, spring - (spring - t) * 0.55, cx + r, spring);
    x.lineTo(cx + r, b); x.stroke();
  };
  const star = (cx, cy, r, squash) => {
    for (const a0 of [0, Math.PI / 4]) {
      x.beginPath();
      for (let i = 0; i <= 4; i++) { const a = a0 + i * Math.PI / 2, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * squash; i ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.stroke();
    }
  };
  for (let k = 0; k < SIDES; k++) {
    const x0 = k * cw, cx = x0 + cw / 2;
    let y0 = top(1);
    for (let b = 0; b < 3; b++) { x.beginPath(); x.ellipse(x0 + cw * (b + 0.5) / 3, y0 + zh / 2, 8, 20, 0, 0, Math.PI * 2); x.stroke(); }
    y0 = top(2);
    line(x0, y0 + 16, x0 + cw, y0 + 16); line(x0, y0 + zh - 16, x0 + cw, y0 + zh - 16);
    x.beginPath();
    for (let i = 0; i <= 4; i++) { const px = x0 + i * cw / 4, py = y0 + (i % 2 ? zh - 36 : 36); i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
    y0 = top(3);
    line(x0, y0 + 8, x0 + cw, y0 + 8); line(x0, y0 + zh - 8, x0 + cw, y0 + zh - 8);
    arch(cx, y0 + 18, y0 + zh - 14, cw * 0.38); arch(cx, y0 + 36, y0 + zh - 28, cw * 0.24);
    star(cx, y0 + zh * 0.62, 13, 0.72);
    y0 = top(4);
    for (let s = 0; s < 2; s++) { x.beginPath(); x.ellipse(x0 + cw * (s + 0.5) / 2, y0 + zh - 12, cw / 4 - 5, zh * 0.6, 0, Math.PI, 2 * Math.PI); x.stroke(); }
    y0 = top(5);
    for (let s = 1; s < 3; s++) line(x0 + cw * s / 3, y0 + 10, x0 + cw * s / 3, y0 + zh - 10);
  }
  x.restore();
}
function brassTextures() {
  const W = 1024, H = 640, rnd = seeded(11);
  const mottle = (x, w, h, dark, light, n) => {
    for (let i = 0; i < n; i++) {
      x.fillStyle = rnd() < 0.55 ? dark : light;
      x.beginPath(); x.arc(rnd() * w, rnd() * h, 3 + rnd() * 14, 0, Math.PI * 2); x.fill();
    }
  };
  /* colour: warm brass, darker toward the foot, with patina in every cut */
  const map = canvasTexture(W, H, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#D2B272"); g.addColorStop(0.55, "#C8A666"); g.addColorStop(1, "#AD8C52");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    mottle(x, w, h, "rgba(74,52,24,0.06)", "rgba(255,236,190,0.05)", 1400);
    x.strokeStyle = "rgba(62,42,18,0.72)"; x.lineWidth = 4.5; x.lineCap = "round"; x.lineJoin = "round"; engrave(x, w, h);
  }, true);
  /* relief: the cuts sit below the surface */
  const bump = canvasTexture(W, H, (x, w, h) => {
    x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, w, h);
    x.strokeStyle = "#202020"; x.lineWidth = 3.5; x.lineCap = "round"; x.lineJoin = "round"; engrave(x, w, h);
  }, false);
  /* finish: polished on the surface, worn in patches, dull in the cuts */
  const rough = canvasTexture(W, H, (x, w, h) => {
    x.fillStyle = "rgb(84,84,84)"; x.fillRect(0, 0, w, h);
    mottle(x, w, h, "rgba(0,0,0,0.12)", "rgba(255,255,255,0.1)", 500);
    x.strokeStyle = "rgb(214,214,214)"; x.lineWidth = 5; x.lineCap = "round"; engrave(x, w, h);
  }, false);
  /* the plain brass of the collar, pump and fittings: the same mottled finish, repeated */
  const plain = canvasTexture(256, 256, (x, w, h) => { x.fillStyle = "rgb(78,78,78)"; x.fillRect(0, 0, w, h); mottle(x, w, h, "rgba(0,0,0,0.14)", "rgba(255,255,255,0.12)", 90); }, false);
  plain.repeat.set(2, 2);
  return { map, bump, rough, plain };
}

function materials() {
  const t = brassTextures();
  /* the cord's braid: cream and old-gold silk wound at an angle */
  const braid = canvasTexture(64, 64, (x, w, h) => {
    x.fillStyle = "#A9853F"; x.fillRect(0, 0, w, h);
    x.strokeStyle = "#EBD6A6"; x.lineWidth = 8;
    for (let i = -w; i <= 2 * w; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); }
  }, true);
  braid.repeat.set(90, 2);
  /* the net over the bulb: brass thread crossing in diamonds */
  const net = canvasTexture(512, 512, (x, w, h) => {
    x.fillStyle = "#000"; x.fillRect(0, 0, w, h); x.strokeStyle = "#fff"; x.lineWidth = 7;
    const s = w / 8;
    for (let i = -8; i <= 16; i++) {
      x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s + h, h); x.stroke();
      x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s - h, h); x.stroke();
    }
  }, false);
  net.repeat.set(2, 1);
  /* a soft shadow on the table */
  const blob = canvasTexture(128, 128, (x, w, h) => {
    const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(58,34,22,0.62)"); g.addColorStop(0.45, "rgba(58,34,22,0.26)"); g.addColorStop(1, "rgba(58,34,22,0)");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  }, true);
  return {
    body: new THREE.MeshStandardMaterial({ color: "#FFFFFF", map: t.map, metalness: 1, roughness: 1, roughnessMap: t.rough, bumpMap: t.bump, bumpScale: 3, envMapIntensity: 1.55, flatShading: true }),
    brass: new THREE.MeshStandardMaterial({ color: "#C3A063", metalness: 1, roughness: 1, roughnessMap: t.plain, envMapIntensity: 1.55 }),
    hole: new THREE.MeshStandardMaterial({ color: "#2A1B11", roughness: 0.7 }),
    jewel: new THREE.MeshPhysicalMaterial({ color: JEWEL, metalness: 0.1, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, emissive: JEWEL, emissiveIntensity: 0.22,
      envMapIntensity: 1.4, flatShading: true }),
    cord: new THREE.MeshPhysicalMaterial({ map: braid, roughness: 0.55, metalness: 0.05, sheen: 1, sheenColor: new THREE.Color("#F2DDB0"), sheenRoughness: 0.45 }),
    bulb: new THREE.MeshPhysicalMaterial({ color: "#6E1E3E", roughness: 0.46, sheen: 1, sheenColor: new THREE.Color("#E9A7C4"), sheenRoughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35 }),
    net: new THREE.MeshStandardMaterial({ color: "#C9A86A", metalness: 0.9, roughness: 0.34, alphaMap: net, alphaTest: 0.5, side: THREE.DoubleSide }),
    tassel: new THREE.MeshPhysicalMaterial({ color: "#8E2A55", roughness: 0.62, sheen: 1, sheenColor: new THREE.Color("#F5C3D8"), sheenRoughness: 0.4 }),
    shadow: new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false })
  };
}

/* a cabochon in a brass bezel, set in the middle of a flat side at height y, on the side facing +z */
function jewel(m, y) {
  const r = y2 => { for (let i = 1; i < BODY.length; i++) { const [r0, a] = BODY[i - 1], [r1, b] = BODY[i]; if (y2 <= b) return r0 + (r1 - r0) * (y2 - a) / (b - a); } return BODY[BODY.length - 1][0]; };
  const d = r(y) * Math.cos(TURN), slope = (r(y + 0.05) - r(y - 0.05)) / 0.1;
  const g = new THREE.Group();
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.045, 14, 56), m.brass); bezel.scale.set(1, 1.32, 1);
  const stone = new THREE.Mesh(new THREE.SphereGeometry(0.31, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), m.jewel);
  stone.rotation.x = Math.PI / 2; stone.scale.set(1, 0.5, 1.3);
  g.add(bezel, stone);
  g.position.set(0, y, d + 0.01); g.rotation.x = Math.atan(slope * Math.cos(TURN));
  return g;
}

function buildModel(m) {
  const model = new THREE.Group();
  model.add(new THREE.Mesh(lathe(BODY, SIDES, TURN), m.body));
  const front = jewel(m, 1.62), back = jewel(m, 1.62);
  const holder = new THREE.Group(); holder.rotation.y = Math.PI; holder.add(back);
  model.add(front, holder);
  model.add(new THREE.Mesh(lathe(COLLAR, 64), m.brass), new THREE.Mesh(lathe(DOME, 64), m.brass));
  /* the nozzle: an arm from the pump head, a wider tip and its dark opening */
  const a = V3(0.24, 4.26, 0), b = V3(0.98, 4.56, 0), dir = b.clone().sub(a).normalize(), tip = b.clone().addScaledVector(dir, 0.12);
  model.add(rod(a, b, 0.055, m.brass), rod(b, tip, 0.085, m.brass), rod(tip, tip.clone().addScaledVector(dir, 0.004), 0.05, m.hole));
  const nozzle = new THREE.Object3D(); nozzle.position.copy(tip).addScaledVector(dir, 0.02); model.add(nozzle);
  /* the barb the cord is tied to */
  model.add(rod(V3(-0.3, 4.18, 0), V3(-0.66, 4.26, 0), 0.075, m.brass));

  /* the bulb, its net, the fitting at its neck and the cap at its foot */
  const bulbG = new THREE.Group(); bulbG.position.copy(BULB_AT); bulbG.rotation.z = BULB_TURN; model.add(bulbG);
  const squeezer = new THREE.Group(); bulbG.add(squeezer);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 48), m.bulb); bulb.scale.copy(BULB_R);
  const net = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 48), m.net); net.scale.copy(BULB_R).multiplyScalar(1.028);
  squeezer.add(bulb, net);
  bulbG.add(new THREE.Mesh(lathe([[0.27, 1.06], [0.21, 1.2], [0.15, 1.32], [0.15, 1.44], [0.19, 1.48], [0.12, 1.53], [0, 1.54]], 40), m.brass));
  bulbG.add(new THREE.Mesh(lathe([[0, -1.47], [0.13, -1.43], [0.18, -1.33], [0.21, -1.22], [0.25, -1.1]], 40), m.brass));
  bulbG.updateMatrix();
  const neck = V3(0, 1.54, 0).applyMatrix4(bulbG.matrix), foot = V3(0, -1.47, 0).applyMatrix4(bulbG.matrix);

  /* the cord: from the barb up over the shoulder and down to the bulb's neck */
  const cordPath = new THREE.CatmullRomCurve3([V3(-0.64, 4.26, 0), V3(-1.15, 4.55, 0.05), V3(-1.9, 4.5, 0.15), V3(-2.6, 3.8, 0.3), V3(-2.78, 2.8, 0.4), V3(-2.5, 1.98, 0.4), neck.clone().add(V3(-0.04, 0.02, 0))]);
  model.add(new THREE.Mesh(new THREE.TubeGeometry(cordPath, 160, 0.07, 12, false), m.cord));

  /* the tassel: a brass head, then a round bundle of silk threads that drops to the table and loosens toward its end */
  const axis = new THREE.CatmullRomCurve3([foot.clone(), V3(foot.x - 0.24, foot.y - 0.2, foot.z + 0.16), V3(foot.x - 0.5, 0.13, foot.z + 0.42), V3(foot.x - 0.78, 0.1, foot.z + 0.72)]);
  const up = V3(0, 1, 0), threads = [];
  for (let i = 0; i < 46; i++) {
    const ang = i * 2.39996, rad = Math.sqrt((i + 0.5) / 46), pts = [];
    for (let k = 0; k <= 10; k++) {
      const t = Math.min(1, 0.08 + 0.92 * k / 10), p = axis.getPointAt(t), tan = axis.getTangentAt(t);
      const side = V3(0, 0, 0).crossVectors(tan, up).normalize(), nrm = V3(0, 0, 0).crossVectors(side, tan).normalize();
      const rr = (0.08 + 0.2 * t * t) * rad, q = p.clone().addScaledVector(side, Math.cos(ang) * rr).addScaledVector(nrm, Math.sin(ang) * rr * (1 - 0.55 * t));
      q.y = Math.max(q.y, 0.026); pts.push(q);
    }
    threads.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.021, 5, false));
  }
  model.add(new THREE.Mesh(mergeGeometries(threads), m.tassel));
  const head = new THREE.Mesh(lathe([[0, 0], [0.1, 0.01], [0.15, 0.08], [0.14, 0.17], [0.1, 0.23], [0.05, 0.26], [0, 0.27]], 32), m.brass);
  head.position.copy(foot); head.quaternion.setFromUnitVectors(up, axis.getTangentAt(0)); model.add(head);

  /* soft shadows under the flacon, the bulb and the tassel */
  const shade = (x, z, sx, sz, turn, opacity) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m.shadow.clone());
    s.material.opacity = opacity; s.rotation.set(-Math.PI / 2, 0, turn); s.position.set(x, 0.004, z); s.scale.set(sx, sz, 1);
    model.add(s);
  };
  shade(0, 0, 4.6, 3.4, 0, 0.95);
  shade(BULB_AT.x, BULB_AT.z, 3.4, 2.1, 0.33, 0.75);
  shade(foot.x - 0.55, foot.z + 0.5, 1.6, 1.2, 0, 0.45);

  return { model, squeezer, nozzle, bulbCentre: bulbG };
}

/* the reflections' surroundings: a warm, dim room with a soft box above left, two tall strips at the sides and a low
   warm fill in front, as in a photograph of metalwork */
function studio() {
  const env = new THREE.Scene();
  const wall = canvasTexture(8, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#E4D7C4"); g.addColorStop(0.45, "#9C8672"); g.addColorStop(0.62, "#4A382B"); g.addColorStop(1, "#231912"); x.fillStyle = g; x.fillRect(0, 0, w, h); }, true);
  env.add(new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.MeshBasicMaterial({ map: wall, side: THREE.BackSide })));
  const box = (w, h, x, y, z, colour, power) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(colour).multiplyScalar(power), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 1.5, 0); env.add(m);
  };
  box(4, 2.6, -7, 11, 8, "#FFFFFF", 6);
  box(1.2, 11, 12, 3, 4, "#FFF4E6", 5);
  box(0.9, 9, -12, 3, -4, "#FFFFFF", 4);
  box(10, 1.4, 0, -0.5, 14, "#FFD9A8", 1.4);
  box(3, 1.5, 5, 9, -10, "#FFFFFF", 3);
  return env;
}

/* ---------- the atomizer: scene, camera, lights and what the page may ask of it ---------- */
export function createAtomizer(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!opts.still });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio(), 0.02).texture;
  pmrem.dispose();
  const key = new THREE.DirectionalLight("#FFE8C8", 2.4); key.position.set(-5, 9, 7);
  const rim = new THREE.DirectionalLight("#FFFFFF", 1.6); rim.position.set(6, 5, -7);
  scene.add(key, rim);

  const mats = materials(), parts = buildModel(mats);
  scene.add(parts.model);
  const camera = new THREE.PerspectiveCamera(24, WIDTH / HEIGHT, 0.5, 60);
  let rtl = !!opts.rtl, turn = 0, turnTo = 0, tiltX = 0, tiltXTo = 0, intro = 0;
  let squeeze = 0, squeezeV = 0, squeezeTo = 0, raf = 0, last = 0;

  function place() {
    const tx = rtl ? 2.05 : -2.05, ty = 2.25;
    camera.position.set(tx, ty + 1.8, 15.4); camera.lookAt(tx, ty, 0.2);
    parts.model.scale.x = rtl ? -1 : 1;   /* in Arabic the atomizer is its own mirror image, the nozzle facing left */
    parts.model.rotation.set(tiltX, turn + intro, 0);
    const s = squeeze;   /* a squeezed bulb flattens across the grip and grows a little along its length */
    parts.squeezer.scale.set(1 - 0.2 * s, 1 + 0.06 * s, 1 + 0.05 * s);
  }
  function draw() { place(); renderer.render(scene, camera); }
  /* one frame; asks for another only while something is still moving */
  function frame(t) {
    raf = 0;
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
    turn += (turnTo - turn) * Math.min(1, dt * 7); tiltX += (tiltXTo - tiltX) * Math.min(1, dt * 7);
    intro *= Math.max(0, 1 - dt * 2.4);
    const force = -360 * (squeeze - squeezeTo) - 22 * squeezeV;   /* a stiff spring: quick to press, a small bounce back */
    squeezeV += force * dt; squeeze += squeezeV * dt;
    draw();
    const moving = Math.abs(turnTo - turn) > 1e-4 || Math.abs(tiltXTo - tiltX) > 1e-4 || Math.abs(intro) > 1e-4 || Math.abs(squeeze - squeezeTo) > 1e-3 || Math.abs(squeezeV) > 1e-3;
    if (moving) raf = requestAnimationFrame(frame); else last = 0;
  }
  const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };

  return {
    renderer, draw,
    size(w, h, dpr) { renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); draw(); },
    setRTL(v) { rtl = !!v; draw(); },
    /* on = pressed; a still atomizer jumps, a moving one springs */
    squeeze(on, still) { squeezeTo = on ? 1 : 0; if (still) { squeeze = squeezeTo; squeezeV = 0; draw(); } else wake(); },
    /* the jewel takes a perfume's colour, kept as its hue but made as clear and deep as a stone */
    tint(colour) {
      const c = new THREE.Color(colour), hsl = {}; c.getHSL(hsl);
      c.setHSL(hsl.h, Math.max(0.55, hsl.s), Math.min(0.5, Math.max(0.38, hsl.l)));
      mats.jewel.color.copy(c); mats.jewel.emissive.copy(c); draw();
    },
    /* the atomizer turns a little toward the pointer: nx and ny from -1 to 1 */
    lean(nx, ny) { turnTo = nx * 0.32; tiltXTo = ny * 0.06; wake(); },
    introduce() { intro = -0.5; wake(); },
    /* where a point of the model falls on the canvas, in CSS pixels */
    project(obj) {
      place(); parts.model.updateMatrixWorld(true);
      const v = obj.getWorldPosition(V3(0, 0, 0)).project(camera), el = renderer.domElement;
      const w = el.clientWidth || el.width, h = el.clientHeight || el.height;
      return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, w, h };
    },
    nozzle() { return this.project(parts.nozzle); },
    bulb() { return this.project(parts.bulbCentre); }
  };
}

/* ---------- the page: landing.js calls mount() after every render ---------- */
function wire() {
  if (!document.getElementById("lp") || window.PP_ATOMIZER3D) return;
  const canvas = document.createElement("canvas");
  canvas.className = "lp-gl"; canvas.setAttribute("aria-hidden", "true");
  let atom;
  try { atom = createAtomizer(canvas); } catch (e) { return; }   /* no WebGL: the still picture stays */
  const reduce = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const fine = () => !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  let stage = null, button = null, ro = null, seen = false, io = null;
  const fit = () => { if (!button) return; const w = button.clientWidth, h = Math.round(w * HEIGHT / WIDTH); if (w) atom.size(w, h, Math.min(2, window.devicePixelRatio || 1)); };
  const onMove = e => { if (!stage || reduce() || !fine()) return; const r = stage.getBoundingClientRect(); atom.lean((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1); };
  const onLeave = () => atom.lean(0, 0);
  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); if (stage) stage.classList.remove("gl"); });
  window.PP_ATOMIZER3D = {
    mount(btn, stg, rtl) {
      if (stage && stage !== stg) { stage.removeEventListener("pointermove", onMove); stage.removeEventListener("pointerleave", onLeave); }
      button = btn; stage = stg;
      if (canvas.parentNode !== btn) btn.insertBefore(canvas, btn.firstChild);
      atom.setRTL(rtl);
      if (ro) ro.disconnect();
      if ("ResizeObserver" in window) { ro = new ResizeObserver(fit); ro.observe(btn); }
      fit();
      stg.addEventListener("pointermove", onMove); stg.addEventListener("pointerleave", onLeave);
      stg.classList.add("gl");
      /* the first time the atomizer comes into view it turns to face the visitor */
      if (!seen && !reduce() && "IntersectionObserver" in window) {
        if (io) io.disconnect();
        io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { seen = true; io.disconnect(); atom.introduce(); } }, { threshold: 0.4 });
        io.observe(stg);
      }
    },
    squeeze(on) { atom.squeeze(on, reduce()); },
    tint(colour) { atom.tint(colour); },
    /* the nozzle in the stage's own pixels, for the mist; the bulb as a share of the atomizer box, for the hint */
    nozzle() { if (!stage || !button) return null; const p = atom.nozzle(), s = stage.getBoundingClientRect(), c = canvas.getBoundingClientRect(); return { x: c.left - s.left + p.x, y: c.top - s.top + p.y }; },
    bulb() { if (!button) return null; const p = atom.bulb(); return { fx: p.x / p.w, fy: p.y / p.h }; }
  };
  document.dispatchEvent(new CustomEvent("pp:atomizer3d"));
}
if (typeof document !== "undefined") wire();
