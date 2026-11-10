// 3D step viewer. A model file describes a build as parts tagged with the step
// that adds them; the viewer shows everything up to the current step and
// highlights what is new.
//
// Model authoring API (see models/ece.js for worked examples):
//   export default { 'project-id': (b) => { ... } }
//   b.step(n)                 parts added after this appear at step n and stay
//   b.step(n, { only: true }) parts appear at step n only
//   b.step(n, { until: m })   parts appear from step n through step m
//   Step 0 is the starting stage (table, base board). Steps 1..N match the
//   project's written steps.
//   Units are arbitrary; Y is up; build around the origin on the y=0 floor.
//   Every b.xxx() shape call adds one part and returns it. b.part(...meshes)
//   groups several b.mk.xxx() meshes into a single part.
//   b.label(text, [x,y,z]) shows a caption on the current step only.
//   b.effect((step, time) => {}) runs every frame (glow, motion).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ACCENT = 0xf7871f;
const V = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2]));

function mat(color, o = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: o.rough ?? 0.75, metalness: o.metal ?? 0,
    transparent: o.opacity != null, opacity: o.opacity ?? 1,
    side: o.double ? THREE.DoubleSide : THREE.FrontSide,
    emissive: o.emissive ?? 0x000000, emissiveIntensity: o.emissive ? 1 : 0,
  });
}

// Mesh factories. They return meshes without adding them to the scene.
export const mk = {
  // box centred at pos; rot is [x,y,z] radians
  box(w, h, d, color, pos = [0, 0, 0], rot, o) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, o));
    m.position.copy(V(pos));
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    return m;
  },
  // upright cylinder centred at pos (r2 = top radius for cones/cups)
  cyl(r, h, color, pos = [0, 0, 0], o = {}) {
    const g = new THREE.CylinderGeometry(o.r2 ?? r, r, h, o.seg ?? 28, 1, Boolean(o.open));
    const m = new THREE.Mesh(g, mat(color, o.open ? { ...o, double: true } : o));
    m.position.copy(V(pos));
    if (o.rot) m.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
    return m;
  },
  // round rod from point a to point b
  rod(a, b, r, color, o) {
    a = V(a); b = V(b);
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat(color, o));
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return m;
  },
  // flat bar (craft stick, cardboard strip) from a to b; w wide, t thick
  bar(a, b, w, t, color, o = {}) {
    a = V(a); b = V(b);
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, t), mat(color, o));
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    if (o.twist) m.rotateY(o.twist);
    return m;
  },
  // smooth tube through points (wire, string, tubing)
  tube(points, r, color, o) {
    const curve = new THREE.CatmullRomCurve3(points.map(V), false, 'catmullrom', 0.4);
    return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(16, points.length * 10), r, 8), mat(color, o));
  },
  sphere(r, color, pos = [0, 0, 0], o = {}) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), mat(color, o));
    m.position.copy(V(pos));
    if (o.scale) m.scale.set(o.scale[0], o.scale[1], o.scale[2]);
    return m;
  },
  torus(r, tube, color, pos = [0, 0, 0], rot, o) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 28), mat(color, o));
    m.position.copy(V(pos));
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    return m;
  },
};

export class Builder {
  constructor() {
    this.root = new THREE.Group();
    this.parts = [];
    this.labels = [];
    this.effects = [];
    this.mk = mk;
    this._from = 0;
    this._to = Infinity;
  }

  step(n, o = {}) {
    this._from = n;
    this._to = o.only ? n : (o.until ?? Infinity);
    return this;
  }

  add(obj) {
    obj.userData.from = this._from;
    obj.userData.to = this._to;
    obj.userData.baseY = obj.position.y;
    obj.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    this.root.add(obj);
    this.parts.push(obj);
    return obj;
  }

  part(...meshes) {
    const g = new THREE.Group();
    meshes.flat().filter(Boolean).forEach((m) => g.add(m));
    return this.add(g);
  }

  label(text, pos) { this.labels.push({ text, pos: V(pos), step: this._from }); }
  effect(fn) { this.effects.push(fn); }

  // ----- basic shapes (each adds one part) -----
  box(...a) { return this.add(mk.box(...a)); }
  cyl(...a) { return this.add(mk.cyl(...a)); }
  rod(...a) { return this.add(mk.rod(...a)); }
  bar(...a) { return this.add(mk.bar(...a)); }
  tube(...a) { return this.add(mk.tube(...a)); }
  sphere(...a) { return this.add(mk.sphere(...a)); }
  torus(...a) { return this.add(mk.torus(...a)); }

  // ----- craft materials -----
  stick(a, b, o = {}) { return this.bar(a, b, o.w ?? 1, o.t ?? 0.2, o.color ?? 0xd9b47a, o); }
  skewer(a, b, color = 0xc9a66b) { return this.rod(a, b, 0.14, color); }
  straw(a, b, color = 0xe8e2d6) { return this.rod(a, b, 0.32, color); }
  string(points, color = 0xf2ede4) { return this.tube(points, 0.07, color); }
  card(w, d, pos, rot, color = 0xf4f0e6) { return this.box(w, 0.06, d, color, pos, rot); }
  table(w, h, d, pos = [0, 0, 0], color = 0x5a4a3c) {
    return this.box(w, h, d, color, [pos[0], pos[1] + h / 2, pos[2]]);
  }
  // open cup standing at pos (centre of its base)
  cup(pos, o = {}) {
    const h = o.h ?? 6, r = o.r ?? 2, r2 = o.r2 ?? 2.8, color = o.color ?? 0xdfe9f2;
    const p = V(pos);
    return this.part(
      mk.cyl(r, h, color, [p.x, p.y + h / 2, p.z], { r2, open: true, opacity: o.opacity ?? 0.45, rough: 0.2 }),
      mk.cyl(r, 0.15, color, [p.x, p.y + 0.08, p.z], { opacity: o.opacity ?? 0.45 }),
    );
  }
  balloon(pos, o = {}) {
    const r = o.r ?? 3, color = o.color ?? 0xe5484d, p = V(pos);
    const len = o.len ?? 1.35; // stretch along x
    return this.part(
      mk.sphere(r, color, p, { scale: [len, 1, 1], rough: 0.35 }),
      mk.cyl(0.25, 0.7, color, [p.x - r * len - 0.2, p.y, p.z], { r2: 0.5, rot: [0, 0, Math.PI / 2] }),
    );
  }
  weights(pos, n = 3, color = 0x9aa0a6) {
    const p = V(pos);
    return this.part(Array.from({ length: n }, (_, i) =>
      mk.cyl(0.9, 0.22, color, [p.x, p.y + 0.11 + i * 0.24, p.z], { metal: 0.7, rough: 0.35 })));
  }

  // ----- electronics (breadboard pitch = 1 unit) -----
  // Mini breadboard: columns 1-17, rows a-e (far side) and f-j (near side).
  // Holes in the same column and the same half are connected.
  breadboard() {
    const dots = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.06, 0.34), mat(0x2a2622), 170);
    const m4 = new THREE.Matrix4();
    let i = 0;
    for (let c = 1; c <= 17; c++) for (const r of 'abcdefghij') dots.setMatrixAt(i++, m4.setPosition(this.hole(r + c).setY(1.02)));
    return this.part(
      mk.box(19, 1, 13.4, 0xefe9dc, [0, 0.5, 0]),
      mk.box(19, 0.08, 1.1, 0xcfc8b8, [0, 1.0, 0]),
      dots,
    );
  }
  hole(id) {
    const row = 'abcdefghij'.indexOf(id[0]);
    const col = Number(id.slice(1));
    return new THREE.Vector3(col - 9, 1, row < 5 ? -5.5 + row : 1.5 + (row - 5));
  }
  _p(x) { return typeof x === 'string' ? this.hole(x) : V(x); }

  wire(a, b, color = 0xd23f3f, o = {}) {
    a = this._p(a); b = this._p(b);
    const lift = o.lift ?? Math.min(4, 1.5 + a.distanceTo(b) * 0.18);
    const top = Math.max(a.y, b.y) + lift;
    const mid = a.clone().add(b).multiplyScalar(0.5).setY(top + 0.4);
    const pts = [a, a.clone().setY(a.y + lift * 0.7), mid, b.clone().setY(b.y + lift * 0.7), b];
    return this.tube(pts, 0.17, color, { rough: 0.5 });
  }
  led(anode, cathode, color = 0xff3b30) {
    const a = this._p(anode), c = this._p(cathode);
    const mid = a.clone().add(c).multiplyScalar(0.5);
    const dome = mat(color, { opacity: 0.88, rough: 0.25 });
    dome.emissive = new THREE.Color(color);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.4, 24), dome);
    body.position.set(mid.x, a.y + 2.9, mid.z);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), dome);
    top.position.set(mid.x, a.y + 3.6, mid.z);
    const g = this.part(
      mk.rod(a, a.clone().setY(a.y + 2.3), 0.07, 0xc8ccd0, { metal: 0.8, rough: 0.3 }),
      mk.rod(c, c.clone().setY(c.y + 2.3), 0.07, 0xc8ccd0, { metal: 0.8, rough: 0.3 }),
      mk.cyl(1.05, 0.25, color, [mid.x, a.y + 2.3, mid.z], { opacity: 0.9 }),
      body, top,
    );
    g.userData.keepEmissive = dome;
    g.glow = (level) => { dome.emissiveIntensity = level; };
    g.top = new THREE.Vector3(mid.x, a.y + 4.6, mid.z);
    return g;
  }
  resistor(a, b, o = {}) {
    a = this._p(a); b = this._p(b);
    const up = o.h ?? 0.9;
    const a2 = a.clone().setY(a.y + up), b2 = b.clone().setY(b.y + up);
    const dir = b2.clone().sub(a2);
    const len = dir.length();
    const bodyLen = Math.min(3.2, len - 0.8);
    const mid = a2.clone().add(b2).multiplyScalar(0.5);
    const along = (t) => mid.clone().add(dir.clone().normalize().multiplyScalar(t));
    const lead = { metal: 0.8, rough: 0.3 };
    const bands = (o.bands ?? [0xc0392b, 0xc0392b, 0x6b3f1d]).map((col, i) =>
      mk.rod(along(-bodyLen * 0.3 + i * bodyLen * 0.22), along(-bodyLen * 0.3 + i * bodyLen * 0.22 + 0.22), 0.47, col));
    return this.part(
      mk.rod(a, a2, 0.07, 0xc8ccd0, lead), mk.rod(b, b2, 0.07, 0xc8ccd0, lead),
      mk.rod(a2, b2, 0.07, 0xc8ccd0, lead),
      mk.rod(along(-bodyLen / 2), along(bodyLen / 2), 0.43, 0xd8b98a),
      bands,
    );
  }
  // tactile button straddling the centre gap; pins at (col,e) (col+2,e) (col,f) (col+2,f)
  button(col) {
    const x = col + 1 - 9;
    const cap = mk.cyl(0.8, 0.6, 0x6b7078, [x, 2.55, 0]);
    const legs = [['e', col], ['e', col + 2], ['f', col], ['f', col + 2]].map(([r, c]) => {
      const h = this.hole(r + c);
      return mk.rod(h, [h.x, 1.6, h.z * 0.75], 0.08, 0xc8ccd0, { metal: 0.8, rough: 0.3 });
    });
    const g = this.part(mk.box(2.7, 1.1, 2.7, 0x1c1c1e, [x, 1.75, 0]), cap, legs);
    g.press = (down) => { cap.position.y = down ? 2.3 : 2.55; };
    g.top = new THREE.Vector3(x, 3.2, 0);
    return g;
  }
  buzzer(plus, minus) {
    const a = this._p(plus), c = this._p(minus);
    const mid = a.clone().add(c).multiplyScalar(0.5);
    const g = this.part(
      mk.rod(a, a.clone().setY(1.5), 0.08, 0xc8ccd0), mk.rod(c, c.clone().setY(1.5), 0.08, 0xc8ccd0),
      mk.cyl(1.9, 1.9, 0x18181a, [mid.x, 2.45, mid.z]),
      mk.cyl(0.35, 0.05, 0x000000, [mid.x, 3.42, mid.z]),
      mk.box(0.7, 0.04, 0.16, 0xffffff, [a.x, 3.42, a.z + 0.9]),
      mk.box(0.16, 0.04, 0.7, 0xffffff, [a.x, 3.42, a.z + 0.9]),
    );
    g.top = new THREE.Vector3(mid.x, 3.9, mid.z);
    return g;
  }
  photoresistor(a, b) {
    a = this._p(a); b = this._p(b);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const g = this.part(
      mk.rod(a, a.clone().setY(2.6), 0.07, 0xc8ccd0), mk.rod(b, b.clone().setY(2.6), 0.07, 0xc8ccd0),
      mk.cyl(1.0, 0.35, 0xd9a441, [mid.x, 2.75, mid.z]),
      mk.box(1.3, 0.05, 0.14, 0xb5371f, [mid.x, 2.95, mid.z - 0.3]),
      mk.box(1.3, 0.05, 0.14, 0xb5371f, [mid.x, 2.95, mid.z]),
      mk.box(1.3, 0.05, 0.14, 0xb5371f, [mid.x, 2.95, mid.z + 0.3]),
    );
    g.top = new THREE.Vector3(mid.x, 3.4, mid.z);
    return g;
  }
  // 2xAA holder to the left of the breadboard; returns the part with .plus/.minus lead points
  battery(pos = [-15.5, 0, 0]) {
    const [x, y, z] = pos;
    const cell = (dx) => [
      mk.cyl(1.1, 6.6, 0x2b6cb0, [x + dx, y + 1.7, z], { rot: [Math.PI / 2, 0, 0], rough: 0.4 }),
      mk.cyl(1.12, 1.2, 0xd9a441, [x + dx, y + 1.7, z - 2.7 * Math.sign(dx)], { rot: [Math.PI / 2, 0, 0], metal: 0.6, rough: 0.3 }),
    ];
    const g = this.part(mk.box(5.6, 1.1, 8, 0x1f1f22, [x, y + 0.55, z]), cell(-1.3), cell(1.3));
    g.plus = new THREE.Vector3(x + 2.8, y + 0.9, z - 2);
    g.minus = new THREE.Vector3(x + 2.8, y + 0.9, z + 2);
    g.top = new THREE.Vector3(x, y + 3.4, z);
    return g;
  }
  // Uno-style board behind the breadboard, USB on the left. .pin(name) gives a header point.
  // Far edge: digital 0-13 (+ GND3). Near edge: 3.3V, 5V, GND, GND2, VIN, A0-A5.
  arduino(pos = [0, 0, -21]) {
    const [x, y, z] = pos;
    const pins = {};
    ['SCL', 'SDA', 'AREF', 'GND3', '13', '12', '11', '10', '9', '8'].forEach((n, i) => { pins[n] = [x - 4 + i, z - 9]; });
    ['7', '6', '5', '4', '3', '2', '1', '0'].forEach((n, i) => { pins[n] = [x + 6.6 + i, z - 9]; });
    ['IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND2', 'VIN'].forEach((n, i) => { pins[n] = [x - 1 + i, z + 9]; });
    ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'].forEach((n, i) => { pins[n] = [x + 7.6 + i, z + 9]; });
    const g = this.part(
      mk.box(30, 0.5, 20, 0x0f7c80, [x, y + 0.25, z]),
      mk.box(10.4, 1.1, 0.9, 0x151515, [x + 0.5, y + 1.05, z - 9]), mk.box(8.4, 1.1, 0.9, 0x151515, [x + 10.1, y + 1.05, z - 9]),
      mk.box(7.4, 1.1, 0.9, 0x151515, [x + 2, y + 1.05, z + 9]), mk.box(6.4, 1.1, 0.9, 0x151515, [x + 10.1, y + 1.05, z + 9]),
      mk.box(4.6, 2.6, 4.2, 0xb9bec4, [x - 14.2, y + 1.8, z - 4.5], null, { metal: 0.8, rough: 0.3 }),
      mk.box(4, 2.6, 3.4, 0x151515, [x - 13.6, y + 1.8, z + 5.5]),
      mk.box(12, 0.9, 3, 0x1b1b1d, [x + 6, y + 0.95, z + 3.5]),
      mk.cyl(0.9, 0.5, 0xb9bec4, [x - 8.5, y + 0.75, z - 7.5], { metal: 0.8 }),
    );
    g.pin = (name) => { const p = pins[String(name)]; return new THREE.Vector3(p[0], y + 1.6, p[1]); };
    g.usb = new THREE.Vector3(x - 16.5, y + 1.8, z - 4.5);
    g.top = new THREE.Vector3(x, y + 3, z);
    return g;
  }
  usbCable(board) {
    const u = board.usb;
    return this.part(
      mk.box(2.4, 1.6, 2.6, 0x2a2a2d, [u.x - 1, u.y, u.z]),
      mk.tube([[u.x - 2, u.y, u.z], [u.x - 6, u.y - 0.8, u.z + 1], [u.x - 11, 0.4, u.z + 6], [u.x - 14, 0.4, u.z + 14]], 0.35, 0x2a2a2d),
    );
  }
  // SG90 servo standing at pos; .lead is where its three wires leave, .horn rotates
  servo(pos = [16, 0, 2]) {
    const [x, y, z] = pos;
    const horn = new THREE.Group();
    horn.position.set(x - 1.1, y + 5.35, z);
    horn.add(mk.cyl(0.55, 0.5, 0xf4f4f4), mk.box(4.6, 0.28, 0.9, 0xf4f4f4, [1.8, 0.15, 0]));
    const g = this.part(
      mk.box(4.6, 4.4, 2.4, 0x2d6cdf, [x, y + 2.2, z]),
      mk.box(6.6, 0.5, 2.4, 0x2d6cdf, [x, y + 3.4, z]),
      mk.cyl(1.15, 0.8, 0x2d6cdf, [x - 1.1, y + 4.8, z]),
      horn,
    );
    g.horn = horn;
    g.lead = new THREE.Vector3(x - 2.3, y + 0.6, z);
    g.top = new THREE.Vector3(x, y + 6.4, z);
    return g;
  }
  // HC-SR04 standing in row j, pins at columns col..col+3 (VCC, TRIG, ECHO, GND), facing the viewer
  ultrasonic(col) {
    const x = col + 1.5 - 9, z = 5.5;
    const eye = (dx) => mk.cyl(1.55, 1.3, 0xc3c7cc, [x + dx, 4.2, z + 0.85], { rot: [Math.PI / 2, 0, 0], metal: 0.7, rough: 0.3 });
    const pins = [0, 1, 2, 3].map((i) => mk.rod(this.hole('j' + (col + i)), [col + i - 9, 2, z], 0.08, 0xc8ccd0));
    const g = this.part(mk.box(9.4, 4.2, 0.35, 0x1d4fa8, [x, 4.1, z]), eye(-2.4), eye(2.4), pins);
    g.top = new THREE.Vector3(x, 6.8, z);
    return g;
  }
}

// ---------------------------------------------------------------------------

export function mountViewer(el, build, opts = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: Boolean(opts.capture) });
  } catch {
    el.innerHTML = '<p class="viewer-fallback">3D view is not available in this browser. Follow the written steps instead.</p>';
    return null;
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BG = 0x1a1714;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.textContent = '';
  el.appendChild(renderer.domElement);
  const labelLayer = document.createElement('div');
  labelLayer.className = 'viewer-labels';
  el.appendChild(labelLayer);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  const b = new Builder();
  build(b);
  scene.add(b.root);

  const box = new THREE.Box3().setFromObject(b.root);
  const center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 1);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(radius * 6, 64), new THREE.MeshStandardMaterial({ color: 0x241f1a, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = Math.min(0, box.min.y) - 0.02;
  ground.receiveShadow = true;
  scene.add(ground);
  scene.fog = new THREE.Fog(BG, radius * 4, radius * 11);

  scene.add(new THREE.HemisphereLight(0xfff3e4, 0x3a2a1c, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.copy(center).add(new THREE.Vector3(radius * 0.8, radius * 2.2, radius * 1.2));
  sun.target.position.copy(center);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -radius * 1.4, right: radius * 1.4, top: radius * 1.4, bottom: -radius * 1.4, near: 0.1, far: radius * 6 });
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, radius * 40);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(center);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.autoRotate = !reduced && opts.autoRotate !== false;
  controls.autoRotateSpeed = 0.7;
  renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; goal.until = 0; });
  renderer.domElement.addEventListener('wheel', () => { controls.autoRotate = false; }, { once: true, passive: true });

  const viewDir = new THREE.Vector3(...(opts.view ?? [0.55, 0.62, 1])).normalize();
  let placed = false;
  let fit = (r) => r * 3;
  const goal = { target: center.clone(), dist: 0, until: 0 };
  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    const vf = THREE.MathUtils.degToRad(camera.fov) / 2;
    const hf = Math.atan(Math.tan(vf) * camera.aspect);
    fit = (r) => (r / Math.sin(Math.min(vf, hf))) * 0.8;
    const dist = fit(radius);
    controls.minDistance = dist * 0.12;
    controls.maxDistance = dist * 2;
    if (!placed) { camera.position.copy(center).addScaledVector(viewDir, dist); placed = true; }
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  const labelEls = b.labels.map((l) => {
    const d = document.createElement('div');
    d.className = 'viewer-label';
    d.textContent = l.text;
    labelLayer.appendChild(d);
    return d;
  });

  const tmp = new THREE.Vector3();
  const maxStep = Math.max(...b.parts.map((p) => p.userData.from), ...b.labels.map((l) => l.step), 0);
  let step = 0;
  let stepAt = 0;
  const meshesOf = (part) => { const out = []; part.traverse((m) => { if (m.isMesh) out.push(m); }); return out; };
  const highlightable = b.parts.map((p) => meshesOf(p).filter((m) => m.material !== p.userData.keepEmissive));

  function setStep(n, animate = true) {
    step = n;
    stepAt = animate && !reduced ? performance.now() : -1e9;
    b.parts.forEach((p) => { p.visible = n >= p.userData.from && n <= p.userData.to; });
    labelEls.forEach((d, i) => { d.hidden = b.labels[i].step !== n; });
    // Aim the camera at what this step adds, without zooming in too far.
    const fb = new THREE.Box3();
    b.parts.forEach((p) => { if (p.userData.from === n && n > 0) fb.expandByObject(p); });
    b.labels.forEach((l) => { if (l.step === n) fb.expandByPoint(l.pos); });
    if (fb.isEmpty()) { goal.target.copy(center); goal.dist = fit(radius); }
    else {
      const fr = Math.max(fb.getSize(tmp).length() * 0.9, radius * 0.55);
      goal.target.copy(center).lerp(fb.getCenter(tmp), Math.min(0.85, 1 - fr / radius + 0.25));
      goal.dist = fit(Math.min(fr, radius));
    }
    goal.until = performance.now() + 1100;
    if (!animate || reduced) { applyGoal(1); goal.until = 0; }
  }
  function applyGoal(k) {
    controls.target.lerp(goal.target, k);
    const off = camera.position.clone().sub(controls.target);
    off.setLength(off.length() + (goal.dist - off.length()) * k);
    camera.position.copy(controls.target).add(off);
  }

  let raf = 0, running = false, visible = true;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = now / 1000;
    const k = Math.min(1, (now - stepAt) / 450);
    const drop = (1 - (1 - (1 - k) ** 3)) * radius * 0.25;
    const pulse = 0.14 + 0.08 * Math.sin(t * 4);
    if (now < goal.until) applyGoal(0.09);
    b.parts.forEach((p, i) => {
      const fresh = p.userData.from === step && step > 0;
      p.position.y = p.userData.baseY + (fresh ? drop : 0);
      highlightable[i].forEach((m) => {
        m.material.emissive.setHex(fresh ? ACCENT : 0x000000);
        m.material.emissiveIntensity = fresh ? pulse : 0;
      });
    });
    b.effects.forEach((fn) => fn(step, t));
    controls.update();
    renderer.render(scene, camera);
    const w = el.clientWidth, h = el.clientHeight;
    b.labels.forEach((l, i) => {
      if (labelEls[i].hidden) return;
      tmp.copy(l.pos).project(camera);
      labelEls[i].style.transform = `translate(-50%, -100%) translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h - 6}px)`;
      labelEls[i].style.opacity = tmp.z < 1 ? 1 : 0;
    });
  }
  const sync = () => {
    const want = visible && !document.hidden;
    if (want && !running) { running = true; raf = requestAnimationFrame(frame); }
    if (!want && running) { running = false; cancelAnimationFrame(raf); }
  };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); });
  io.observe(el);
  document.addEventListener('visibilitychange', sync);

  setStep(opts.step ?? 1, false);
  sync();

  return {
    maxStep,
    setStep,
    get step() { return step; },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      document.removeEventListener('visibilitychange', sync);
      controls.dispose();
      scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
      renderer.dispose();
      el.textContent = '';
    },
  };
}
