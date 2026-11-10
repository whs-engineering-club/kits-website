// 3D build models for the Biomedical kit. Steps match data/kits.mjs.
import * as THREE from 'three';

const CARD = 0xc79a63, CARD_D = 0x8a6238, PAPER = 0xf4f0e6, INK = 0x3a3a40, STRAW = 0x58b8c9, TAPE = 0xcfeaf7;
const BLUE = 0x2d6cdf, RED = 0xe5484d, YELLOW = 0xf2c230, GREEN = 0x3aa655, PURPLE = 0x9b59b6;
const DIRTY = 0x7a5a36, CLEAN = 0xa9d8ee, CUP = 0xdfe9f2;

// ----- generic helpers -----
// A positioned (and optionally rotated) group; children are placed relative to it.
const grp = (pos, rot, ...meshes) => {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  if (rot) g.rotation.set(...rot);
  meshes.flat(Infinity).filter(Boolean).forEach((m) => g.add(m));
  return g;
};
// Add meshes as one step-tagged part, parented to a hinge/group instead of the scene root.
const put = (b, parent, ...meshes) => { const p = b.part(meshes.flat(Infinity)); parent.add(p); return p; };
// n points spread over a disc of radius R
const scatter = (n, R, fn) => Array.from({ length: n }, (_, i) => {
  const a = i * 2.4, r = R * Math.sqrt((i + 0.5) / n);
  return fn(Math.cos(a) * r, Math.sin(a) * r, i);
});
// A small card face with text drawn on it.
function textPlane(text, w, h, pos, rot, o = {}) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = Math.max(32, Math.round((256 * h) / w));
  const g = c.getContext('2d');
  g.fillStyle = o.bg ?? '#fffdf5'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = o.fg ?? '#1b1b1b';
  g.font = `700 ${Math.round(c.height * (o.size ?? 0.7))}px sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, c.width / 2, c.height / 2 + c.height * 0.04, c.width * 0.94);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(...rot);
  return m;
}
// Index card lying on the table with n written lines.
const noteCard = (b, pos, w, d, n) => b.part(
  b.mk.box(w, 0.08, d, PAPER, [pos[0], pos[1] + 0.04, pos[2]]),
  Array.from({ length: n }, (_, i) => b.mk.box(w * (i % 2 ? 0.6 : 0.75), 0.04, 0.22, INK,
    [pos[0] - (i % 2 ? w * 0.07 : 0), pos[1] + 0.1, pos[2] - d / 2 + ((i + 1) * d) / (n + 1)])),
);

// ----- water filter pieces -----
const FC = { r: 4, r2: 5.5, h: 12 };   // filter cup
const CC = { r: 3.2, r2: 4.3, h: 10 }; // collection cup
const SEAT = 7.6;                      // filter cup base height above the collection cup base
const fr = (y) => FC.r + ((FC.r2 - FC.r) * y) / FC.h;
const HOLES = [[0, 0], [1.9, 0], [-1.9, 0], [0.95, 1.65], [-0.95, 1.65], [0.95, -1.65], [-0.95, -1.65]];
const slab = (b, p, y0, y1, color) => b.mk.cyl(fr(y0) - 0.12, y1 - y0, color, [p[0], p[1] + (y0 + y1) / 2, p[2]], { r2: fr(y1) - 0.12 });
const LAYER = {
  paper: (b, p) => b.part(slab(b, p, 0.15, 0.6, 0xdcc9a0)),
  cotton: (b, p) => b.part(slab(b, p, 0.6, 2.0, 0xffffff),
    scatter(9, 3.0, (x, z) => b.mk.sphere(1, 0xffffff, [p[0] + x, p[1] + 1.8, p[2] + z], { scale: [1, 0.6, 1] }))),
  carbon: (b, p) => b.part(slab(b, p, 2.4, 4.2, 0x1b1b1d),
    scatter(16, 3.9, (x, z) => b.mk.sphere(0.3, 0x2c2c30, [p[0] + x, p[1] + 4.2, p[2] + z]))),
  sand: (b, p) => b.part(slab(b, p, 4.2, 6.4, 0xdcbf7c)),
  gravel: (b, p) => b.part(slab(b, p, 6.4, 8.2, 0x8d9197),
    scatter(18, 4.2, (x, z, i) => b.mk.sphere(0.6, [0x9aa0a6, 0x74787d, 0xb3b7bb][i % 3], [p[0] + x, p[1] + 8.2, p[2] + z], { scale: [1, 0.7, 1] }))),
};
const filterCup = (b, p, holes) => {
  b.cup(p, { ...FC, opacity: 0.28 });
  if (holes) b.part(HOLES.map(([x, z]) => b.mk.cyl(0.32, 0.08, 0x15120f, [p[0] + x, p[1] + 0.2, p[2] + z])));
};
// measuring cup built around its own base centre
const measuringCup = (b, pos, rot, fill) => grp(pos, rot,
  b.mk.cyl(2.6, 8, CUP, [0, 4, 0], { r2: 3.2, open: true, opacity: 0.4, rough: 0.2 }),
  b.mk.cyl(2.6, 0.15, CUP, [0, 0.08, 0], { opacity: 0.5 }),
  b.mk.torus(1.5, 0.22, CUP, [-3.6, 4.2, 0], null, { opacity: 0.6 }),
  [2, 3.5, 5, 6.5].map((y) => b.mk.box(1.1, 0.08, 0.08, INK, [0, y, 2.6 + y * 0.075])),
  fill ? b.mk.cyl(2.45, fill, DIRTY, [0, 0.15 + fill / 2, 0], { r2: 2.45 + fill * 0.075, opacity: 0.85 }) : null,
);
const stopwatch = (b, pos) => {
  const hand = grp([0, 0.75, 0], null, b.mk.box(0.16, 0.08, 1.7, RED, [0, 0, -0.85]));
  const g = grp(pos, null,
    b.mk.cyl(2.4, 0.6, 0x2a2a2d, [0, 0.3, 0]), b.mk.cyl(2.0, 0.1, 0xffffff, [0, 0.63, 0]),
    b.mk.box(0.8, 0.5, 0.9, 0x9aa0a6, [0, 0.3, -2.7], null, { metal: 0.7, rough: 0.3 }),
    b.mk.cyl(0.2, 0.2, 0x2a2a2d, [0, 0.72, 0]), hand);
  g.hand = hand;
  return g;
};
const turbidityChart = (b, pos) => grp(pos, null,
  b.mk.box(12.4, 0.1, 5.6, PAPER, [0, 0.05, 0]),
  [0xe9f4f9, 0xd6d9c4, 0xbfae86, 0x9a7d50, 0x6b4a2a].map((c, i) => [
    b.mk.box(1.9, 0.06, 2.6, c, [(i - 2) * 2.3, 0.13, 0.9]),
    textPlane(String(i + 1), 1.3, 1.3, [(i - 2) * 2.3, 0.12, -1.5], [-Math.PI / 2, 0, 0]),
  ]),
);
// Water that rises in the collection cup, the dirty water sinking in the filter cup, and drips.
// p = collection cup base. Call with the builder at the "test" step; returns an effect body.
function filterTest(b, p, testStep) {
  const level = 4.4, top = p[1] + SEAT;
  const clean = b.mk.cyl(3.05, 1, CLEAN, [p[0], p[1] + 0.7, p[2]], { r2: 3.5, opacity: 0.75, rough: 0.15 });
  b.step(testStep); b.part(clean);
  b.step(testStep, { only: true });
  const dirty = b.mk.cyl(fr(8.5) - 0.2, 1, DIRTY, [p[0], top + 9, p[2]], { r2: fr(11) - 0.2, opacity: 0.85 });
  b.part(dirty);
  const drips = [[-1.4, 0.6], [0.3, -1.1], [1.5, 0.9]].map(([x, z]) => b.mk.sphere(0.32, CLEAN, [p[0] + x, top - 1, p[2] + z], { scale: [1, 1.5, 1], rough: 0.15 }));
  b.part(drips);
  return (s, t) => {
    const f = s === testStep ? (t % 7) / 7 : 1;
    const h = Math.max(0.05, f * level);
    clean.scale.y = h; clean.position.y = p[1] + 0.2 + h / 2;
    const d = Math.max(0.05, (1 - f) * 2.5);
    dirty.scale.y = d; dirty.position.y = top + 8.45 + d / 2;
    drips.forEach((m, i) => { const u = (t * 0.8 + i / 3) % 1; m.position.y = top - 0.3 - u * (top - 0.3 - (p[1] + 0.2 + h)); });
  };
}

// ----- hinged cardboard fingers -----
// Chain of hinge groups; h[i] bends about its own x axis toward +z (the palm side).
function chain(parent, pos, lens, tilt = 0) {
  const mount = grp(pos, [0, 0, tilt]);
  parent.add(mount);
  const h = [];
  lens.forEach((L, i) => {
    const g = new THREE.Group();
    if (i) g.position.y = lens[i - 1];
    (i ? h[i - 1] : mount).add(g);
    h.push(g);
  });
  return h;
}
// String / rubber band that follows moving anchors. anchors = [[group, Vector3 local point], ...]
function tendon(b, root, anchors, color, r = 0.12) {
  const mesh = b.mk.tube([[0, 0, 0], [0, 1, 0]], r, color, { rough: 0.6 });
  const part = put(b, root, mesh);
  const pts = anchors.map(() => new THREE.Vector3());
  let key = '';
  const update = () => {
    root.updateWorldMatrix(true, true);
    anchors.forEach(([g, v], i) => root.worldToLocal(g.localToWorld(pts[i].copy(v))));
    const k = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`).join(';');
    if (k === key) return;
    key = k;
    mesh.geometry.dispose();
    mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => p.clone()), false, 'centripetal'), pts.length * 8, r, 6);
  };
  update();
  return { part, mesh, update };
}
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
// frame-rate independent easing factor
const easer = () => { let last = 0; return (t, rate = 7) => { const dt = Math.min(1, Math.max(0, t - last)); last = t; return 1 - Math.exp(-dt * rate); }; };

const FACE = 0.5; // yaw that turns the palm side toward the default camera
const face = (x, y, z) => [x * Math.cos(FACE) + z * Math.sin(FACE), y, -x * Math.sin(FACE) + z * Math.cos(FACE)];

// thick mitten used for the glove test, built around the centre of the palm
const mitten = (b, pos) => grp(pos, null,
  b.mk.sphere(2.5, 0x3b6fb5, [0, 0, 0], { scale: [1.15, 0.7, 1.05] }),
  b.mk.sphere(1.1, 0x3b6fb5, [-1.6, -0.5, 2.2], { scale: [0.8, 1.2, 0.8] }),
  b.mk.cyl(1.9, 2.6, 0x274f85, [0, 0.6, -3.2], { r2: 2.1, rot: [Math.PI / 2 - 0.35, 0, 0] }),
);
// pen with an optional thick grip, lying along x, built around the pen centre
const pen = (b, grip) => [
  b.mk.rod([-6, 0, 0], [5.2, 0, 0], 0.35, 0x2b4c9b),
  b.mk.cyl(0.35, 1.1, 0xd9d9de, [5.75, 0, 0], { r2: 0.05, rot: [0, 0, -Math.PI / 2] }),
  b.mk.cyl(0.37, 0.8, 0x1b1b1d, [-6.2, 0, 0], { rot: [0, 0, Math.PI / 2] }),
  grip ? [
    b.mk.cyl(1.25, 6.4, CARD_D, [0.8, 0, 0], { rot: [0, 0, Math.PI / 2] }),
    b.mk.cyl(1.45, 5.6, CARD, [0.8, 0, 0], { rot: [0, 0, Math.PI / 2] }),
    [-1.2, 0.8, 2.8].map((x, i) => b.mk.torus(1.5, 0.17, [RED, GREEN, BLUE][i], [x, 0, 0], [0, Math.PI / 2, 0])),
  ] : null,
];

export default {
  'water-filter': (b) => {
    const T = 1, A = [-10, T, 0], B = [7, T, 0], S = [7, T + SEAT, 0];
    b.step(0); b.table(46, T, 26); b.cup(B, { ...CC, opacity: 0.3 });
    b.step(0, { until: 0 }); filterCup(b, A);

    // 1: the cup tipped on its side so the holes in the bottom show
    b.step(1, { only: true });
    b.add(grp([A[0], T + 4.8, A[2]], [-Math.PI / 2 + 0.13, 0.5, 0, 'YXZ'],
      b.mk.cyl(FC.r, FC.h, CUP, [0, 0, 0], { r2: FC.r2, open: true, opacity: 0.3, rough: 0.2 }),
      b.mk.cyl(FC.r, 0.15, CUP, [0, -5.92, 0], { opacity: 0.55 }),
      HOLES.map(([x, z]) => b.mk.cyl(0.4, 0.1, 0x15120f, [x, -6.02, z])),
      b.mk.rod([1.9, -5.4, 0], [1.9, -8.6, 0], 0.09, 0xc8ccd0, { metal: 0.8, rough: 0.3 }),
      b.mk.cyl(0.55, 1, RED, [1.9, -9.1, 0], { r2: 0.35 }),
    ));
    b.label('Poke small holes in the bottom', [A[0], T + 11.5, 0]);

    b.step(2, { until: 3 }); filterCup(b, A, true); LAYER.paper(b, A); LAYER.cotton(b, A);
    b.label('Cotton balls on top of it', [A[0] + 10, T + 4.5, 0]);
    b.label('Coffee filter first', [A[0] - 7.5, T + 0.6, 2]);
    b.step(3, { until: 3 }); LAYER.carbon(b, A); LAYER.sand(b, A); LAYER.gravel(b, A);
    b.label('3. Gravel on top', [A[0] + 8.5, T + 9, 0]);
    b.label('2. Sand', [A[0] - 7.5, T + 3.6, 0]);
    b.label('1. Activated carbon', [A[0] + 9.5, T + 1.4, 0]);

    b.step(4); filterCup(b, S, true); ['paper', 'cotton', 'carbon', 'sand', 'gravel'].forEach((k) => LAYER[k](b, S));
    b.label('Filter cup sits in the second cup', [S[0], S[1] + 13.5, 0]);

    b.step(5, { only: true }); b.add(measuringCup(b, A, null, 5));
    b.label('100 mL of dirty water', [A[0], T + 9.5, 0]);
    b.label('Note its colour and cloudiness', [A[0], T + 0.2, 6]);

    b.step(6, { only: true });
    b.add(measuringCup(b, [S[0] - 10.1, S[1] + 14.2, 0], [0, 0, -1.2], 0));
    b.tube([[S[0] - 1.5, S[1] + 13.9, 0], [S[0] - 0.7, S[1] + 12.6, 0], [S[0] - 0.4, S[1] + 11, 0], [S[0] - 0.35, S[1] + 9, 0]], 0.3, DIRTY, { opacity: 0.9 });
    b.label('Pour slowly', [S[0] - 6, S[1] + 18.5, 0]);
    b.label('Start the stopwatch', [0, T + 2.5, 8]);
    b.step(6); const watch = b.add(stopwatch(b, [0, T, 8]));
    const water = filterTest(b, B, 6);

    b.step(7); b.add(measuringCup(b, A, null, 0));
    b.label('Dripping stops: stop the timer', [0, T + 2.5, 8]);
    b.label('Measure how much came through', [B[0] + 10, T + 8, 0]);

    b.step(8);
    b.add(turbidityChart(b, [-9, T, 8.5]));
    b.part(b.mk.box(0.9, 0.08, 5.5, 0xf0e3a0, [5, T + 0.04, 8.5]), b.mk.box(0.9, 0.1, 1.3, GREEN, [5, T + 0.05, 6.4]));
    b.label('Compare with the turbidity chart', [-9, T + 2, 8.5]);
    b.label('Test the pH', [6, T + 1.2, 9.5]);

    b.effect((s, t) => {
      water(s, t);
      watch.hand.rotation.y = s === 6 ? -t * 1.5 : -2.2;
    });
  },

  'prosthetic-finger': (b) => {
    const W = 5, TH = 0.4, L = [8, 6.5, 5.5], BY = 3.5, SZ = TH / 2 + 0.5;
    const root = new THREE.Group(); root.rotation.y = FACE;
    b.step(0); b.add(root);
    put(b, root, b.mk.box(11, BY, 6, 0x4f5b66, [0, BY / 2, 0]));
    const h = chain(root, [0, BY, 0], L);
    b.step(0, { until: 0 }); put(b, root, b.mk.box(W, L[0] + L[1] + L[2], TH, CARD, [0, BY + (L[0] + L[1] + L[2]) / 2, 0]));
    b.step(0, { until: 1 }); b.straw([-11, 0.35, 7], [-9, 0.35, -7], STRAW);
    b.step(0, { until: 4 }); b.torus(1.7, 0.16, RED, [10, 0.17, 6], [Math.PI / 2, 0, 0]);

    b.step(1);
    L.forEach((len, i) => put(b, h[i], b.mk.box(W, len - 0.14, TH, CARD, [0, len / 2, 0]),
      i ? b.mk.box(W, 0.16, 0.06, CARD_D, [0, 0, TH / 2 + 0.02]) : null));
    b.label('Score two lines: three segments', [-10, 19, 0]);
    b.label('Fold along the lines', [9, 11, 0]);

    b.step(2);
    L.forEach((len, i) => put(b, h[i],
      b.mk.rod([0, len * 0.22, SZ], [0, len * 0.78, SZ], 0.5, STRAW),
      b.mk.box(W * 0.8, 1.5, 1.1, TAPE, [0, len / 2, TH / 2 + 0.55], null, { opacity: 0.8 })));
    b.label('Straw piece taped to each segment', [-10, 19, 0]);
    b.label('Palm side', [8, 8, 0]);

    b.step(3);
    const end = v3(0, 0.2, 10);
    const str = tendon(b, root, [
      [root, end], [root, v3(0, 0.2, 4.6)], [root, v3(0, 3.9, 3.2)],
      [h[0], v3(0, L[0] * 0.22, SZ)], [h[0], v3(0, L[0] * 0.78, SZ)],
      [h[1], v3(0, L[1] * 0.22, SZ)], [h[1], v3(0, L[1] * 0.78, SZ)],
      [h[2], v3(0, L[2] * 0.22, SZ)], [h[2], v3(0, L[2] * 0.78, SZ)], [h[2], v3(0, L[2] - 0.7, TH / 2 + 0.12)],
    ], BLUE, 0.14);
    b.label('Thread string through all 3 straws', [-10, 19, 0]);

    b.step(4);
    put(b, h[2], b.mk.box(W * 0.6, 1.3, 0.3, 0xffffff, [0, L[2] - 0.8, TH / 2 + 0.15]));
    const loop = b.mk.torus(1, 0.14, BLUE, [0, 0.2, 11], [Math.PI / 2, 0, 0]);
    put(b, root, loop);
    b.label('Tape or tie the string at the fingertip', [-11, 21, 0]);

    b.step(5);
    const BZ = -TH / 2 - 0.3;
    const band = tendon(b, root, [
      [h[0], v3(0, 3, BZ)], [h[0], v3(0, L[0] - 0.4, BZ)], [h[1], v3(0, 0.4, BZ)],
      [h[1], v3(0, L[1] - 0.4, BZ)], [h[2], v3(0, 0.4, BZ)], [h[2], v3(0, 3.2, BZ)],
    ], RED, 0.24);
    put(b, h[0], b.mk.box(W * 0.7, 1.4, 0.3, 0xffffff, [0, 2.6, BZ - 0.1]));
    put(b, h[2], b.mk.box(W * 0.7, 1.4, 0.3, 0xffffff, [0, 3.6, BZ - 0.1]));
    b.label('Rubber band taped along the back', [-10, 19, 0]);

    b.step(6, { only: true });
    put(b, root, b.mk.rod([3, 0.5, 7.5], [3, 0.5, 12], 0.22, YELLOW), b.mk.cyl(0.8, 1.8, YELLOW, [3, 0.5, 12.8], { r2: 0.02, rot: [Math.PI / 2, 0, 0] }));
    b.label('Pull the string: the finger curls', [-9, 17, 0]);
    b.label('Let go: the band straightens it', [-10, 6, 0]);

    const ease = easer();
    b.effect((s, t) => {
      const k = ease(t);
      const yaw = s === 5 ? FACE + Math.PI * 0.82 : s === 6 ? FACE + 0.95 : FACE;
      root.rotation.y += (yaw - root.rotation.y) * k;
      const pull = s === 6 ? Math.min(1, Math.max(0, 0.5 - 0.75 * Math.cos(t * 1.5))) : 0;
      const a = (s >= 1 && s < 5 ? 0.16 : 0.03) + pull * 1.15;
      h[1].rotation.x = a; h[2].rotation.x = a;
      end.z = 10 + pull * 3;
      loop.position.z = end.z + 1;
      str.update(); band.update();
    });
  },

  'hand-model': (b) => {
    const TH = 0.3, Z = TH / 2 + 0.32, BLOCK = 1.8;
    const root = new THREE.Group(); root.rotation.y = FACE;
    b.step(0); b.add(root);
    b.step(0, { until: 0 });
    b.box(18, 0.3, 28, CARD, [0, 0.15, 0], [0, FACE, 0]);
    b.part(b.mk.rod([-4, 0.55, 8], [5, 0.55, 3], 0.25, YELLOW), b.mk.cyl(0.25, 0.9, 0x2a2a2d, [5.4, 0.55, 2.78], { r2: 0.02, rot: [0, 0.507, -Math.PI / 2] }));

    const F = [
      { x: -4.05, lens: [3.0, 2.2, 1.9], w: 2.1, color: PURPLE },
      { x: -1.35, lens: [3.9, 2.8, 2.3], w: 2.3, color: GREEN },
      { x: 1.35, lens: [4.2, 3.0, 2.5], w: 2.3, color: YELLOW },
      { x: 4.05, lens: [3.8, 2.7, 2.3], w: 2.3, color: RED },
      { thumb: true, lens: [3.6, 3.0], w: 2.4, color: BLUE },
    ];
    const TB = [5.3, 10.3], TT = -0.8; // thumb base and lean
    F.forEach((f, i) => {
      f.h = f.thumb ? chain(root, [TB[0], TB[1], 0], f.lens, TT) : chain(root, [f.x, 17, 0], f.lens);
      f.palm = f.thumb
        ? [v3(TB[0] + Math.sin(TT) * 0.6, TB[1] - Math.cos(TT) * 0.6, Z), v3(TB[0] + Math.sin(TT) * 2.6, TB[1] - Math.cos(TT) * 2.6, Z)]
        : [v3(f.x * 0.92, 16.2, Z), v3(f.x * 0.5, 10.6, Z)];
      f.xw = (i - 2) * 1.15;
      f.rest = 5.4 - (i % 2);
      f.end = v3(f.xw, f.rest, Z);
      f.curl = f.thumb ? 0.8 : 1.0;
    });

    b.step(1);
    const shape = new THREE.Shape([[-3, 0.2], [3, 0.2], [3.4, 7], [5.5, 9], [5.5, 17], [-5.5, 17], [-5.5, 9], [-3.4, 7]].map(([x, y]) => new THREE.Vector2(x, y)));
    const palm = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: TH, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: CARD, roughness: 0.8 }));
    palm.position.z = -TH / 2;
    put(b, root, palm, b.mk.box(10, BLOCK, 4, 0x4f5b66, [0, BLOCK / 2, 0]));
    F.forEach((f) => f.lens.forEach((len, i) => put(b, f.h[i], b.mk.box(f.w, len - 0.08, TH, CARD, [0, len / 2, 0]))));
    b.label('Cut out your traced hand and forearm', [0, 28.5, 0]);

    b.step(2);
    F.forEach((f) => f.h.forEach((g) => put(b, g, b.mk.box(f.w, 0.14, 0.05, CARD_D, [0, 0, TH / 2 + 0.02]))));
    b.label('Mark each knuckle and fold there', [0, 28.5, 0]);

    b.step(3);
    F.forEach((f) => {
      f.lens.forEach((len, i) => put(b, f.h[i],
        b.mk.rod([0, len * 0.2, Z], [0, len * 0.8, Z], 0.3, STRAW),
        b.mk.box(f.w * 0.85, 0.55, 0.7, TAPE, [0, len / 2, TH / 2 + 0.35], null, { opacity: 0.8 })));
      const mid = f.palm[0].clone().lerp(f.palm[1], 0.5);
      put(b, root, b.mk.rod(f.palm[0], f.palm[1], 0.3, STRAW), b.mk.box(1.8, 0.6, 0.7, TAPE, [mid.x, mid.y, TH / 2 + 0.35], null, { opacity: 0.8 }));
    });
    b.label('Short straws between the joints', face(-10, 23, 1));
    b.label('One longer straw per finger on the palm', face(-9, 11.5, 1));

    b.step(4);
    F.forEach((f) => {
      const last = f.lens.length - 1;
      f.str = tendon(b, root, [
        [f.h[last], v3(0, f.lens[last] - 0.45, Z - 0.15)],
        ...f.lens.map((len, i) => [[f.h[i], v3(0, len * 0.8, Z)], [f.h[i], v3(0, len * 0.2, Z)]]).reverse().flat(),
        [root, f.palm[0]], [root, f.palm[1]], [root, v3(f.xw, 7.3, Z)], [root, f.end],
      ], f.color, 0.1);
    });
    b.label('One string per finger, down its palm straw', [0, 28.5, 0]);

    b.step(5);
    F.forEach((f) => { const last = f.lens.length - 1; put(b, f.h[last], b.mk.box(f.w * 0.8, 0.75, 0.2, 0xffffff, [0, f.lens[last] - 0.5, Z - 0.05])); });
    b.label('Tape each string at its fingertip', [0, 28.5, 0]);

    b.step(6);
    F.forEach((f) => { f.loop = b.mk.torus(0.45, 0.1, f.color, [f.xw, f.rest - 0.45, Z]); put(b, root, f.loop); });
    b.label('Tie a loop in each string at the wrist', face(-9, 4.5, 1));

    b.step(7, { only: true });
    b.label('Pull the loops together: the hand grips', [0, 28.5, 0]);
    b.label('Pull one loop: one finger curls', face(9, 6, 2));

    const ease = easer();
    b.effect((s, t) => {
      const k = ease(t);
      root.rotation.y += ((s === 7 ? FACE + 0.5 : FACE) - root.rotation.y) * k;
      const u = t % 11;
      F.forEach((f, i) => {
        let c = 0;
        if (s === 7) {
          const one = u - i * 1.2;
          if (one > 0 && one < 1.2) c = Math.sin((one / 1.2) * Math.PI) ** 2;
          if (u > 6.4) c = Math.min(1, (u - 6.4) / 0.8, (11 - u) / 0.8);
        }
        const a = (s >= 2 ? 0.08 : 0) + c * f.curl;
        f.h.forEach((g) => { g.rotation.x = a; });
        f.end.y = f.rest - c * 1.1;
        if (f.loop) f.loop.position.y = f.end.y - 0.45;
        f.str.update();
      });
    });
  },

  'assistive': (b) => {
    const T = 1, OZ = -6, PX = 13, PZ = 7;
    b.step(0); b.table(52, T, 28);
    b.card(12, 9, [-15, T + 0.03, 7]);

    // 1: who is it for? stand-in pills and a thin pen that is hard to hold
    b.step(1, { until: 3 });
    b.part(scatter(7, 1.8, (x, z, i) => b.mk.sphere(0.5, [RED, YELLOW, GREEN, BLUE][i % 4], [1 + x, T + 0.5, 6 + z])));
    b.step(1, { until: 4 }); b.add(grp([PX, T + 0.36, PZ], null, pen(b, false)));
    b.step(1, { only: true });
    b.label('Choose a user', [0, T + 9, -4]);
    b.label('Pills morning and night?', [1, T + 2.2, 6]);
    b.label('Weak grip on a thin pen?', [PX, T + 2.2, PZ]);

    b.step(2); noteCard(b, [-3, T, 9.5], 8, 5.5, 3);
    b.label('3 needs: one hand, big labels, no spills', [-3, T + 2.5, 9.5]);

    b.step(3);
    b.part(
      [-3, -1, 1, 3].map((i) => b.mk.torus(0.75, 0.09, INK, [-18 + i * 0.85, T + 0.1, 5.2], [Math.PI / 2, 0, 0])),
      b.mk.box(4.4, 0.04, 0.14, INK, [-18, T + 0.1, 7]), b.mk.box(4.4, 0.04, 0.14, INK, [-18, T + 0.1, 7.6]),
      b.mk.box(4.2, 0.04, 0.18, INK, [-12, T + 0.1, 5.2], [0, 0.5, 0]), b.mk.box(1.9, 0.04, 0.95, INK, [-12, T + 0.1, 5.2], [0, 0.5, 0]),
      b.mk.box(3.6, 0.04, 0.14, INK, [-12, T + 0.1, 7.6]),
      b.mk.torus(3.3, 0.12, RED, [-18, T + 0.12, 6.1], [Math.PI / 2, 0, 0]),
    );
    b.label('Sketch two ideas, circle one', [-15, T + 2.5, 7]);

    // 4: pill organizer
    b.step(4);
    const DAYS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
    const cupAt = (i) => [(i - 3) * 5.7, T + 0.3, OZ];
    b.part(b.mk.box(40.5, 0.3, 6.6, CARD, [0, T + 0.15, OZ]),
      [0, 1, 2, 3, 4, 5].map((i) => b.mk.box(1.6, 0.9, 0.12, TAPE, [(i - 2.5) * 5.7, T + 3.4, OZ], null, { opacity: 0.6 })));
    const lids = DAYS.map((d, i) => {
      const p = cupAt(i);
      b.cup(p, { r: 1.9, r2: 2.5, h: 4.2, opacity: 0.4 });
      b.part(scatter(i % 3 + 1, 0.9, (x, z, j) => b.mk.sphere(0.45, [RED, YELLOW, BLUE][(i + j) % 3], [p[0] + x, p[1] + 0.6, p[2] + z])));
      b.add(grp([p[0], p[1] + 2.2, p[2] + 2.3], [0.14, 0, 0], b.mk.box(3.2, 2.5, 0.08, PAPER, [0, 0, 0]), textPlane(d, 3, 2.3, [0, 0, 0.06])));
      const hinge = grp([p[0], p[1] + 4.2, p[2] - 2.5], [i === 1 || i === 4 ? -1.25 : -0.04, 0, 0]);
      hinge.add(b.mk.cyl(2.65, 0.16, CARD, [0, 0.1, 2.55]), b.mk.box(2.2, 0.18, 0.7, TAPE, [0, 0.1, 0], null, { opacity: 0.7 }));
      return b.add(hinge);
    });
    b.label('7 cups in a row, a lid flap on each', [-7, T + 9.5, OZ]);
    b.label('Day labels in large letters', [15, T + 7.5, OZ]);

    // 5: assistive grip
    b.step(5);
    const grip = grp([0, 0, 0], null, pen(b, true));
    b.add(grp([PX, T + 1.47, PZ], null, grip));
    b.label('Cardboard + rubber bands: thick, soft grip', [PX - 1, T + 4.5, PZ]);

    b.step(6);
    const glove = mitten(b, [0.8, 2.3, 0]);
    b.add(grp([PX, T + 1.47, PZ], null, glove));
    b.step(6, { only: true });
    b.label('Glove test: can a classmate use it?', [PX + 6, T + 9.5, PZ]);
    b.label('No hints from you', [PX - 12, T + 1.5, PZ + 3]);

    b.step(7);
    lids.forEach((hinge) => put(b, hinge, b.mk.box(1.9, 0.2, 1.7, YELLOW, [0, 0.1, 5.7])));
    b.label('Change one thing: bigger lid tabs', [0, T + 9.5, OZ]);

    b.effect((s, t) => {
      const lift = s === 6 ? 2.2 * (0.5 - 0.5 * Math.cos(t * 1.6)) : 0;
      grip.position.y = lift; glove.position.y = 2.3 + lift;
      grip.rotation.z = lift * 0.08; glove.rotation.z = lift * 0.08;
    });
  },

  'bme-final': (b) => {
    const T = 1, P = [14, T, -3], S = [14, T + SEAT, -3];
    b.step(0); b.table(52, T, 28);
    b.step(0, { until: 4 });
    b.cup([-19, T, -7], { r: 2.2, r2: 3, h: 6 }); b.cup([-13, T, -8], { r: 2.2, r2: 3, h: 6 });
    b.box(9, 0.3, 6, CARD, [-5, T + 0.15, -8], [0, 0.2, 0]);
    b.part([0, 1, 2].map((i) => b.mk.rod([-20 + i, T + 0.33, -1.5 - i * 0.2], [-10 + i, T + 0.33, -3 - i * 0.2], 0.32, [STRAW, 0xe8e2d6, RED][i])));
    b.part(b.mk.torus(1.3, 0.14, RED, [3, T + 0.15, -8], [Math.PI / 2, 0, 0]), b.mk.torus(1.3, 0.14, GREEN, [4.6, T + 0.15, -6.8], [Math.PI / 2, 0, 0]));

    b.step(1, { only: true });
    b.add(grp([-9, T + 1.47, 5], null, pen(b, true)));
    b.cup([9, T, 5], { r: 2.6, r2: 3.2, h: 7 });
    b.cyl(2.5, 4.5, DIRTY, [9, T + 2.45, 5], { r2: 2.85, opacity: 0.85 });
    b.label('Pick a direction', [0, T + 10, 0]);
    b.label('Help a person...', [-9, T + 4.5, 5]);
    b.label('...or fix a problem like dirty water', [9, T + 8.5, 5]);

    b.step(2); noteCard(b, [-19, T, 8.5], 9, 6, 2);
    b.label('Describe the user or problem: 2 sentences', [-17, T + 2.5, 8.5]);
    b.step(3); noteCard(b, [-8, T, 9], 9, 7, 4);
    b.label('Requirements: cost, safety, size, ease of use', [-8, T + 2.5, 9]);

    b.step(4);
    const watch = b.add(stopwatch(b, [17, T, 9]));
    b.add(turbidityChart(b, [6, T, 9.5]));
    b.label('Decide how you will measure success', [10, T + 3, 9.5]);

    b.step(5);
    b.cup(P, { ...CC, opacity: 0.3 });
    filterCup(b, S, true); ['paper', 'cotton', 'carbon', 'sand', 'gravel'].forEach((k) => LAYER[k](b, S));
    b.label('Build a first prototype', [S[0], S[1] + 13.5, S[2]]);

    const water = filterTest(b, P, 6);
    b.step(6);
    b.part(b.mk.box(8, 0.08, 6, PAPER, [1, T + 0.04, 0]),
      [0, 1, 2].map((i) => b.mk.box(6.4, 0.04, 0.12, INK, [1, T + 0.1, -1.6 + i * 1.5])),
      [0, 1].map((i) => b.mk.box(0.12, 0.04, 4.6, INK, [-0.6 + i * 2.4, T + 0.1, 0])),
      b.mk.rod([4.2, T + 0.3, 3.4], [7.5, T + 0.3, 1.6], 0.22, YELLOW));
    b.label('Test it and record the results', [1, T + 2.5, 0]);
    b.label('Improve it at least once', [S[0], S[1] + 13.5, S[2]]);

    b.step(7);
    const BX = -11, panel = (x, y, title, extra) => [
      b.mk.box(10.6, 5.6, 0.08, PAPER, [x, y, 0.2]),
      textPlane(title, 9, 1.5, [x, y + 1.8, 0.26], null, { size: 0.8 }),
      extra ?? [0, 1].map((i) => b.mk.box(8 - i * 2, 0.22, 0.04, INK, [x - i, y + 0.2 - i * 1.1, 0.26])),
    ];
    b.add(grp([BX, T, -11.5], [-0.12, 0, 0],
      b.mk.box(24, 14.4, 0.3, 0x3d5a80, [0, 7.2, 0]),
      panel(-5.7, 10.6, 'NEED'), panel(5.7, 10.6, 'DESIGN'),
      panel(-5.7, 4, 'TEST DATA', [[1.2, 2.6, 1.9].map((hgt, i) => b.mk.box(1.3, hgt, 0.06, [RED, GREEN, BLUE][i], [-7.7 + i * 2, 1.5 + hgt / 2, 0.27]))]),
      panel(5.7, 4, 'TRADE-OFFS'),
    ));
    b.label('Present need, design, data, trade-offs', [BX, T + 16.5, -11.5]);

    b.effect((s, t) => {
      water(s, t);
      watch.hand.rotation.y = s === 6 ? -t * 1.5 : 0;
    });
  },
};
