// 3D build models for the Aerospace kit. Steps match data/kits.mjs.
import * as THREE from 'three';

const PAPER = 0xf4f0e6, FOLD = 0xd9d3c4, RED = 0xd23f3f, BLUE = 0x3b82c4, GREEN = 0x3aa655, YELLOW = 0xe6c229;
const STEEL = 0x9aa0a6, WOOD = 0xb98b5a, CARD = 0xb98b5a, SKIN = 0xe0b48c, DARK = 0x26262a, ORANGE = 0xf08a24;
const PI = Math.PI;

const material = (color, o = {}) => new THREE.MeshStandardMaterial({
  color, roughness: 0.8, side: THREE.DoubleSide, transparent: o.opacity != null, opacity: o.opacity ?? 1,
});

// Flat polygon through 3D points (triangle fan), for folded paper.
function poly(pts, color, o) {
  const v = [];
  for (let i = 1; i < pts.length - 1; i++) v.push(...pts[0], ...pts[i], ...pts[i + 1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, material(color, o));
}

// A group with its own pivot, so it can move and rotate in effects.
function pivot(b, pos, meshes) {
  const g = new THREE.Group();
  meshes.flat().filter(Boolean).forEach((m) => g.add(m));
  g.position.set(pos[0], pos[1], pos[2]);
  return b.add(g);
}

// Folded dart, nose toward +x, origin on the top fold; the keel hangs 1.3 below.
function dart(mk, o = {}) {
  const L = o.L ?? 10, h = L / 2, hw = (o.wide ? 0.5 : 0.3) * L;
  const out = [
    poly([[h, 0, 0], [-h, 0, 0], [-h, -1.3, 0]], FOLD),
    poly([[h, 0, 0], [-h, 0, 0.12], [-h, 0.3, hw]], PAPER),
    poly([[h, 0, 0], [-h, 0, -0.12], [-h, 0.3, -hw]], PAPER),
  ];
  if (o.clip) out.push(mk.box(1.7, 0.6, 0.3, STEEL, [h - 1.6, -0.3, 0], null, { metal: 0.7, rough: 0.35 }));
  if (o.elevators) {
    for (const s of [1, -1]) {
      out.push(poly([[-h + 1.3, 0.12, s * 0.3 * hw], [-h + 1.3, 0.24, s * 0.72 * hw],
        [-h - 0.1, 1.25, s * 0.8 * hw], [-h - 0.1, 1.1, s * 0.3 * hw]], YELLOW));
    }
  }
  return out;
}

// Straw-and-card glider, nose toward +x, origin at the middle of the straw.
function glider(mk, o = {}) {
  const out = [
    mk.rod([-6, 0, 0], [6, 0, 0], 0.3, 0x4aa3df),
    mk.box(3, 0.06, 11, PAPER, [2, 0.34, 0]),
    mk.box(1.8, 0.06, 4.5, PAPER, [-5, 0.34, 0]),
    mk.box(1.8, 2, 0.06, PAPER, [-5, 1.36, 0]),
    mk.box(3.2, 0.05, 0.9, BLUE, [2, 0.39, 0]),
    mk.box(1.5, 0.14, 0.75, STEEL, [5.4, 0.3, 0], null, { metal: 0.7, rough: 0.35 }),
  ];
  if (o.payload) {
    for (let i = 0; i < 3; i++) out.push(mk.cyl(0.8, 0.2, STEEL, [4.2, 0.42 + i * 0.22, 0], { metal: 0.7, rough: 0.35 }));
    out.push(mk.box(0.7, 0.05, 2, BLUE, [4.2, 1.08, 0]));
  }
  return out;
}

// Open parachute. Origin at the canopy rim; the payload hangs 7 below.
function chute(mk, o = {}) {
  const R = 5, a0 = o.vent ? 0.22 : 0;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 10, 0, PI * 2, a0, 1.2 - a0), material(o.color ?? 0xf2efe6));
  dome.scale.y = 0.6;
  dome.position.y = -R * Math.cos(1.2) * 0.6;
  const rr = R * Math.sin(1.2) * 0.707;
  const out = [dome];
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) out.push(mk.rod([sx * rr, 0, sz * rr], [0, -7, 0], 0.06, 0xf2ede4));
  for (let i = 0; i < 3; i++) out.push(mk.cyl(0.8, 0.2, STEEL, [0, -7.2 - i * 0.22, 0], { metal: 0.7, rough: 0.35 }));
  return out;
}

// Measuring tape lying on the floor from x1 to x2.
function tapeMeasure(b, x1, x2, z) {
  const ticks = [];
  for (let x = x1; x <= x2 + 0.01; x += 3) ticks.push(b.mk.box(0.14, 0.03, 0.9, DARK, [x, 0.12, z]));
  return b.part(b.mk.box(x2 - x1, 0.1, 1.2, YELLOW, [(x1 + x2) / 2, 0.05, z]), ticks);
}
const cone = (b, x, z, color, y = 0) => b.cyl(0.55, 1.7, color, [x, y + 0.85, z], { r2: 0.02 });
const flag = (b, x, z, color) => b.part(
  b.mk.rod([x, 0, z], [x, 4.4, z], 0.1, 0xdddddd),
  b.mk.box(2, 1.2, 0.08, color, [x + 1, 3.8, z]),
);

// Chair with its back on the side given by dir (+1 = +x).
function chair(b, x, dir) {
  const legs = [[-3, -3], [-3, 3], [3, -3], [3, 3]].map(([dx, dz]) => b.mk.rod([x + dx, 0, dz], [x + dx, 7, dz], 0.3, 0x6b5a48));
  return b.part(
    b.mk.box(7, 0.6, 7, 0x8a7358, [x, 7, 0]), legs,
    b.mk.box(0.6, 7.3, 7, 0x8a7358, [x + dir * 3.2, 10.65, 0]),
  );
}

// Shift a part sideways from where it was built (mesh parts carry their own position).
function shiftX(p, dx) {
  p.userData.x0 ??= p.position.x;
  p.position.x = p.userData.x0 + dx;
}

// A glide from (x0, y0) down to (x1, y1); holds the landing at the end of each loop.
function glide(g, t, period, x0, y0, x1, y1, pitch) {
  const u = Math.min(1, (t % period) / (period * 0.7));
  g.position.x = x0 + (x1 - x0) * u;
  g.position.y = y1 + (y0 - y1) * (1 - u * u);
  g.rotation.z = u < 1 ? -pitch * (0.4 + u) : 0;
}

export default {
  'paper-airplane': (b) => {
    const TX = -22, TH = 7, LINE = -12, REST = 1.32;
    b.step(0); b.table(14, TH, 22, [TX, 0, 0]);
    b.step(0, { only: true }); b.card(6, 8, [TX, TH + 0.03, 0]);

    b.step(1, { only: true });
    pivot(b, [TX, TH + REST, 0], dart(b.mk));
    b.label('Fold a dart: this is your baseline', [TX, TH + 3.6, 0]);

    b.step(2);
    b.box(0.6, 0.08, 12, RED, [LINE, 0.04, 0]);
    tapeMeasure(b, LINE, 24, 6);
    cone(b, 6, -2.5, BLUE); cone(b, 9, 0.5, BLUE); cone(b, 7.5, 3, BLUE);
    b.label('Throwing line', [LINE, 2.2, 0]);
    b.label('3 throws: record each distance', [7.5, 3.6, 0]);
    b.step(2, { until: 3 });
    const planeA = pivot(b, [9, REST, 0.5], dart(b.mk));

    b.step(3); flag(b, 7.5, 6, BLUE);
    b.label('Average of the 3 = baseline', [7.5, 5.8, 6]);

    b.step(4, { only: true });
    pivot(b, [TX, TH + REST, -7], dart(b.mk, { L: 8, clip: true }));
    pivot(b, [TX, TH + REST, 0], dart(b.mk, { L: 8, elevators: true }));
    pivot(b, [TX, TH + REST, 7], dart(b.mk, { L: 8, wide: true }));
    b.label('Paper clip on the nose', [TX + 2, TH + 5, -7]);
    b.label('or back edges bent up', [TX + 9, TH + 1.2, 0]);
    b.label('or wider wings', [TX - 3, TH + 0.5, 11]);

    b.step(5);
    const planeB = pivot(b, [19, REST, 0.5], dart(b.mk, { clip: true }));
    cone(b, 15, -2.5, GREEN); cone(b, 19, 0.5, GREEN); cone(b, 17, 3, GREEN);
    flag(b, 17, 6, GREEN);
    b.label('3 more throws, then average again', [17, 6, 6]);

    b.step(6, { only: true });
    b.label('Further than baseline? Keep it', [17, 6, 6]);
    b.label('Baseline', [7.5, 5.8, 6]);

    b.step(7, { only: true });
    pivot(b, [TX, TH + REST, -5], dart(b.mk, { L: 8, elevators: true }));
    pivot(b, [TX, TH + REST, 5], dart(b.mk, { L: 8, wide: true }));
    b.label('Next change: bend the back edges up', [TX, TH + 3.6, -5]);
    b.label('Then: wider wings', [TX, TH + 2.8, 5.5]);
    b.label('One change at a time', [8, 7, 0]);

    b.effect((s, t) => {
      if (s === 2) glide(planeA, t, 3.4, LINE, 9, 9, REST, 0.14);
      else { planeA.position.set(9, REST, 0.5); planeA.rotation.z = 0; }
      if (s === 5 || s === 7) glide(planeB, t, 3.8, LINE, 9, 19, REST, 0.1);
      else { planeB.position.set(19, REST, 0.5); planeB.rotation.z = 0; }
    });
  },

  'balloon-rocket': (b) => {
    const SY = 13.6, X0 = -13, END = 26.5;
    b.step(0); chair(b, -23, -1); chair(b, 23, 1);

    b.step(1, { only: true });
    b.string([[-13, 0.1, 4], [-7, 0.1, 1.5], [-2.5, 0.34, 2], [2.5, 0.34, 2], [7, 0.1, 3.5], [13, 0.1, 1]]);
    b.straw([-2.5, 0.34, 2], [2.5, 0.34, 2], 0x4aa3df);
    b.label('Thread the string through the straw', [0, 2.2, 2]);

    b.step(2);
    b.part(
      b.mk.rod([-END, SY, 0], [END, SY, 0], 0.07, 0xf2ede4),
      b.mk.torus(0.55, 0.09, 0xf2ede4, [-END + 0.3, SY, 0], [0, PI / 2, 0]),
      b.mk.torus(0.55, 0.09, 0xf2ede4, [END - 0.3, SY, 0], [0, PI / 2, 0]),
    );
    const straw = b.straw([X0 - 2.5, SY, 0], [X0 + 2.5, SY, 0], 0x4aa3df);
    b.label('Tie it tight between two chairs', [0, SY + 2.4, 0]);
    b.label('About 5 m apart', [0, 2, 0]);

    b.step(3);
    // Pivot at the top of the balloon so it shrinks toward the straw.
    const bal = pivot(b, [X0, SY - 0.4, 0], [
      b.mk.sphere(3, 0xe5484d, [0, -3, 0], { scale: [1.35, 1, 1], rough: 0.35 }),
      b.mk.cyl(0.25, 0.9, 0xe5484d, [-4.3, -3, 0], { r2: 0.5, rot: [0, 0, PI / 2] }),
    ]);
    b.step(3, { until: 4 });
    b.part(b.mk.box(0.5, 1.5, 1, DARK, [X0 - 4.6, SY - 3.4, 0]), b.mk.box(0.9, 0.5, 1, DARK, [X0 - 4.6, SY - 4.3, 0]));
    b.label('Pinch the neck with the clip. Do not tie', [X0 - 3, SY - 7.4, 0]);

    b.step(4);
    const strip = (x) => [
      b.mk.box(0.9, 0.1, 1.1, BLUE, [x, SY + 0.37, 0]),
      b.mk.bar([x, SY + 0.37, 0.5], [x, SY - 1.1, 2], 0.9, 0.1, BLUE), b.mk.bar([x, SY + 0.37, -0.5], [x, SY - 1.1, -2], 0.9, 0.1, BLUE),
    ];
    const tape = b.part(strip(X0 - 1.4), strip(X0 + 1.4));
    b.label('Tape the balloon to the straw', [X0, SY + 2.2, 0]);
    b.step(4, { only: true });
    b.label('Nozzle points back along the string', [X0 - 5, SY - 7.4, 0]);

    b.step(5);
    b.part(b.mk.box(1.5, 0.5, 1, DARK, [X0 - 6, 0.25, 2]));
    const puffs = pivot(b, [X0 - 5.4, SY - 3.4, 0], [0, 1, 2].map((i) =>
      b.mk.sphere(0.45 + i * 0.25, 0xffffff, [-1 - i * 1.5, 0, 0], { opacity: 0.5 - i * 0.12 })));
    b.label('Start the stopwatch, release the clip', [X0, SY + 3, 0]);
    b.label('It races along the string', [10, SY + 3, 0]);

    b.step(6); tapeMeasure(b, X0, X0 + 27, 4);
    b.label('Record distance and time', [0.5, 2.2, 4]);

    b.step(7, { only: true });
    b.label('Half-full balloon: slower, not as far', [X0 + 6, SY + 3, 0]);
    b.label('Compare the two speeds', [6, 2.2, 4]);

    b.effect((s, t) => {
      let dx = 0, sc = 1, moving = false;
      const run = (dist, from, period) => {
        const u = Math.min(1, (t % period) / (period * 0.6));
        const p = 1 - (1 - u) ** 2;
        dx = dist * p; sc = from - (from - 0.4) * p; moving = u < 0.9;
      };
      if (s === 5) run(26, 1, 4.2);
      else if (s === 6) { dx = 26; sc = 0.4; }
      else if (s === 7) run(13, 0.7, 4.6);
      shiftX(straw, dx); shiftX(tape, dx);
      bal.position.x = X0 + dx; bal.scale.setScalar(sc);
      puffs.visible = moving;
      puffs.position.set(X0 + dx - 5.4 * sc, SY - 0.4 - 3 * sc, 0);
    });
  },

  parachute: (b) => {
    const TX = -16, TH = 7, C = 0xf2efe6, MARK = 23, top = TH + 0.12;
    const edge = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz]) => [TX + sx * 2.9, sz * 2.9]);
    b.step(0); b.table(24, TH, 18, [TX, 0, 0]);
    b.step(0, { only: true }); b.card(11, 11, [TX, TH + 0.03, 0], null, C);

    b.step(1, { until: 3 }); b.cyl(4.2, 0.08, C, [TX, TH + 0.05, 0]);
    b.step(1, { only: true }); b.label('Canopy about 20 cm across', [TX, TH + 2.6, 0]);

    b.step(2, { until: 3 });
    b.part(edge.map(([x, z]) => b.mk.box(1, 0.06, 1, BLUE, [x, TH + 0.12, z], [0, PI / 4, 0])));
    b.step(2, { only: true });
    b.part(edge.map(([x, z]) => b.mk.rod([x, top, z], [TX + (x - TX) * 2.6, top, z * 2.6], 0.07, 0xf2ede4)));
    b.label('Four strings of equal length', [TX, TH + 3.4, 0]);
    b.label('Taped to the edge', [TX + 3.4, TH + 1.4, 3.6]);

    b.step(3, { only: true });
    b.part(
      edge.map(([x, z]) => b.mk.rod([x, top, z], [TX + 9.4, top, 0], 0.07, 0xf2ede4)),
      b.mk.sphere(0.25, 0xf2ede4, [TX + 9.4, top, 0]),
      b.mk.torus(0.5, 0.07, STEEL, [TX + 9.9, top, 0], [PI / 2, 0, 0]),
      [0, 1, 2].map((i) => b.mk.cyl(0.8, 0.2, STEEL, [TX + 10.6, TH + 0.1 + i * 0.22, 0], { metal: 0.7, rough: 0.35 })),
    );
    b.label('Tie the free ends together', [TX + 5, TH + 3.2, 0]);
    b.label('Hook on the payload', [TX + 10.6, TH + 1.6, 3]);

    b.step(4);
    b.part(
      b.mk.box(4, 0.4, 4, 0x6b5a48, [6, 0.2, -3]), b.mk.rod([6, 0, -3], [6, 27, -3], 0.28, WOOD),
      b.mk.box(3.2, 0.5, 0.5, ORANGE, [7.3, MARK, -3]),
    );
    const c1 = pivot(b, [14, MARK + 7, 0], chute(b.mk));
    b.label('Marked spot 2 m up', [6, MARK + 1.6, -3]);
    b.label('Drop it and time the fall', [14, 12, 0]);

    b.step(5, { only: true });
    b.label('Drop 3 times, average the times', [14, 12, 0]);

    b.step(6);
    const c2 = pivot(b, [27, MARK + 9.8, 0], chute(b.mk, { vent: true, color: 0xf7d046 }));
    c2.scale.setScalar(1.4);
    b.label('Change one thing: bigger canopy,', [27, 16, 0]);
    b.label('longer strings or a centre hole', [27, 13.6, 0]);

    b.effect((s, t) => {
      const fall = (g, period, y0, y1, sway) => {
        const u = Math.min(1, (t % period) / (period * 0.8));
        g.position.y = y0 - (y0 - y1) * u;
        g.rotation.z = u < 1 ? sway * Math.sin(t * 3) : 0;
      };
      fall(c1, 3.6, MARK + 7, 7.95, 0.1);
      fall(c2, 6, MARK + 9.8, 11.1, 0.03);
    });
  },

  'glider-wing': (b) => {
    const TX = -16, TH = 5, SY = TH + 0.32, NOSE = -7, TAIL = -25, WX = NOSE - 6, WY = SY + 0.36;
    const G = [];
    const g = (p) => { G.push(p); return p; };
    b.step(0); b.table(28, TH, 22, [TX, 0, 0]);
    g(b.straw([TAIL, SY, 0], [NOSE, SY, 0], 0x4aa3df));
    b.step(0, { only: true }); b.card(8, 5, [TX, TH + 0.03, 6.5]);

    b.step(1, { until: 2 }); b.card(14, 3.5, [TX, TH + 0.03, 6.5]);
    b.step(1, { only: true }); b.label('Main wing: about 20 cm × 5 cm', [TX, TH + 2.2, 6.5]);

    b.step(2, { only: true });
    b.card(6, 2.2, [-21, TH + 0.03, -6]); b.card(2.4, 2.2, [-12, TH + 0.03, -6]);
    b.label('Horizontal tail', [-21, TH + 1.8, -6]);
    b.label('Vertical fin', [-12, TH + 1.8, -6]);

    b.step(3);
    g(b.card(3.5, 14, [WX, WY, 0]));
    g(b.part(
      b.mk.box(2.2, 0.06, 6, PAPER, [TAIL + 1.2, WY, 0]),
      b.mk.box(2.2, 2.4, 0.06, PAPER, [TAIL + 1.2, WY + 1.22, 0]),
    ));
    g(b.part(b.mk.box(3.8, 0.05, 1, BLUE, [WX, WY + 0.05, 0]), b.mk.box(2.5, 0.05, 0.9, BLUE, [TAIL + 1.2, WY + 0.05, 0.5])));
    b.label('Wing one third back from the nose', [WX, WY + 2.6, 0]);
    b.label('Tail and fin at the rear', [TAIL + 1.2, WY + 4.4, 0]);

    b.step(4);
    g(b.part(
      b.mk.box(1.9, 0.14, 0.8, STEEL, [NOSE - 0.8, SY + 0.36, 0], null, { metal: 0.7, rough: 0.35 }),
      b.mk.box(0.14, 0.6, 0.8, STEEL, [NOSE + 0.1, SY + 0.1, 0], null, { metal: 0.7, rough: 0.35 }),
    ));
    b.label('Paper clip on the nose', [NOSE - 0.8, SY + 2.4, 0]);

    const LIFT = 7, BX = WX + 0.9;
    b.step(5, { only: true });
    b.part(
      b.mk.box(3.4, 2.4, 3.6, SKIN, [BX + 0.6, TH + 1.2, 0.6]),
      b.mk.cyl(0.5, LIFT - 2, SKIN, [BX, TH + 1 + LIFT / 2, 0]),
      b.mk.sphere(0.5, SKIN, [BX, TH + LIFT - 0.5, 0]),
    );
    b.label('Balances just ahead of mid-wing', [BX, SY + LIFT + 3.2, 0]);
    b.label('Add or remove nose weight', [NOSE + 1, SY + LIFT - 2.4, 0]);

    b.step(6); tapeMeasure(b, -2, 28, 9);
    b.label('Launch gently and level', [0, 17, 0]);
    b.label('Record the distance', [14, 2.2, 9]);

    b.step(7);
    b.part([1, -1].map((s) => b.mk.box(3.5, 0.06, 3.4, ORANGE, [WX, WY, s * 8.7], null, { opacity: 0.6 })));
    b.label('Try a longer wingspan', [WX, WY + 2.2, 8.7]);
    b.label('or move the wing forward or back', [WX, WY + 4, -3]);

    b.effect((s, t) => {
      let dx = 0, dy = 0;
      if (s === 5) dy = LIFT;
      if (s === 6) {
        const u = Math.min(1, (t % 4.2) / 3);
        dx = 6 + 28 * u; dy = 9 - (9 + TH - 0.04) * u;
      }
      G.forEach((p) => { shiftX(p, dx); p.position.y += dy; });
    });
  },

  propeller: (b) => {
    const CX = -16, BY = 2.62, SY = BY + 1.1, AY = 2.16, F = CX + 10, R = CX - 10;
    const car = [];
    const c = (p) => { car.push(p); return p; };
    const wire = { metal: 0.7, rough: 0.35 };
    b.step(0, { until: 4 });
    b.box(2, 2.3, 5, WOOD, [CX - 6, 1.15, 0]); b.box(2, 2.3, 5, WOOD, [CX + 6, 1.15, 0]);

    b.step(1); c(b.rod([R, BY, 0], [F, BY, 0], 0.3, 0xc9a66b));
    b.label('Light body, about 25 cm long', [CX, BY + 2.4, 0]);

    b.step(2);
    c(b.part(
      b.mk.box(1.3, 0.8, 0.8, BLUE, [F - 0.7, BY, 0]),
      b.mk.rod([F - 0.7, BY, 0], [F - 0.7, SY - 0.25, 0], 0.08, STEEL, wire),
      b.mk.torus(0.25, 0.08, STEEL, [F - 0.7, SY, 0], [0, PI / 2, 0], wire),
    ));
    const prop = pivot(b, [F + 0.7, SY, 0], [
      b.mk.cyl(0.4, 0.9, 0x333338, [0, 0, 0], { rot: [0, 0, PI / 2] }),
      b.mk.box(0.16, 2.8, 1.5, 0xe5484d, [0, 1.6, 0], [0, 0.65, 0]),
      b.mk.box(0.16, 2.8, 1.5, 0xe5484d, [0, -1.6, 0], [0, -0.65, 0]),
      b.mk.rod([0, 0, 0], [-2.3, 0, 0], 0.08, STEEL, wire),
      b.mk.torus(0.22, 0.07, STEEL, [-2.5, 0, 0], null, wire),
    ]);
    b.label('Propeller on a paper-clip hook', [F, SY + 4, 0]);
    b.label('It must spin freely', [F - 3, SY - 3, 3]);

    b.step(3);
    c(b.part(
      b.mk.box(1.3, 0.8, 0.8, BLUE, [R + 0.7, BY, 0]),
      b.mk.rod([R + 0.7, BY, 0], [R + 0.7, SY, 0], 0.08, STEEL, wire),
      b.mk.torus(0.22, 0.07, STEEL, [R + 0.9, SY, 0], null, wire),
    ));
    b.label('Second hook fixed at the back', [R + 0.7, SY + 2.2, 0]);

    b.step(4);
    c(b.part([0.13, -0.13].map((z) => b.mk.rod([R + 0.9, SY, z], [F - 1.8, SY, z], 0.09, 0xc98d4b))));
    b.label('Rubber band between the two hooks', [CX, SY + 2.4, 0]);

    b.step(5);
    for (const x of [CX - 6, CX + 6]) {
      c(b.part(
        b.mk.rod([x, AY, -4.2], [x, AY, 4.2], 0.14, 0xc9a66b),
        b.mk.cyl(AY, 0.4, CARD, [x, AY, 3.7], { rot: [PI / 2, 0, 0] }),
        b.mk.cyl(AY, 0.4, CARD, [x, AY, -3.7], { rot: [PI / 2, 0, 0] }),
        b.mk.box(0.9, 0.5, 1, BLUE, [x, BY - 0.2, 0]),
      ));
    }
    b.label('Cardboard wheels on skewer axles', [CX, AY + 5, 3.7]);

    b.step(6);
    const twist = [];
    for (let i = 0; i <= 96; i++) {
      const a = i * PI / 4;
      twist.push([R + 1.2 + (i / 96) * 16.6, SY + 0.22 * Math.sin(a), 0.22 * Math.cos(a)]);
    }
    c(b.tube(twist, 0.08, 0xa86e33));
    b.label('Wind 50 turns, set it down, let go', [CX + 4, SY + 5, 0]);
    b.label('The propeller pulls it forward', [F + 16, 7.5, 0]);

    b.step(7);
    tapeMeasure(b, F + 1, F + 31, 9.5);
    cone(b, F + 19, 7.5, BLUE); cone(b, F + 31, 7.5, GREEN);
    b.label('50 turns', [F + 19, 2.6, 7.5]);
    b.label('100 turns: twice as far?', [F + 31, 2.6, 7.5]);
    b.label('Record the distance each time', [CX, 9, 0]);

    b.effect((s, t) => {
      let dx = 0, spin = 0;
      if (s >= 6) {
        const dist = s === 6 ? 18 : 30;
        const u = Math.min(1, (t % 4.6) / 3.2);
        const p = 1 - (1 - u) ** 2;
        dx = dist * p; spin = p * (s === 6 ? 50 : 90);
      }
      car.forEach((p) => shiftX(p, dx));
      prop.position.x = F + 0.7 + dx;
      prop.rotation.x = spin;
    });
  },

  'aero-final': (b) => {
    const TX = -22, TH = 8, GY = TH + 0.32, TGT = 16, LINE = -10;
    b.step(0); b.table(20, TH, 18, [TX, 0, 0]);
    b.part(
      b.mk.cyl(6, 0.06, RED, [TGT, 0.03, 0]), b.mk.cyl(4, 0.1, 0xf4f0e6, [TGT, 0.05, 0]),
      b.mk.cyl(2, 0.14, RED, [TGT, 0.07, 0]),
    );

    b.step(1, { only: true });
    pivot(b, [TX, GY, -3.5], glider(b.mk, { payload: true }));
    const demo = pivot(b, [TGT, 17, 0], chute(b.mk));
    b.label('A: glider carries the payload', [TX, TH + 4, -3.5]);
    b.label('B: drop system over the target', [TGT - 3, 21.5, 0]);

    b.step(2);
    b.box(0.6, 0.08, 12, RED, [LINE, 0.04, 0]);
    tapeMeasure(b, LINE, TGT - 6, 0);
    b.label('Distance to the target', [0, 2.2, 0]);
    b.label('What counts as a safe landing?', [TGT, 3.4, 0]);
    b.step(2, { until: 3 }); b.weights([TX + 6, TH, 5], 3);
    b.step(2, { only: true }); b.label('Payload mass', [TX + 6, TH + 2.2, 5]);

    b.step(3);
    const ink = 0x3a3a40, SX = TX - 4, SZ = 5, y = TH + 0.08;
    b.part(
      b.mk.box(8, 0.06, 6.5, 0xffffff, [SX, TH + 0.03, SZ]),
      b.mk.box(5.4, 0.03, 0.22, ink, [SX, y, SZ]), b.mk.box(1.1, 0.03, 4.6, ink, [SX + 0.9, y, SZ]),
      b.mk.box(0.8, 0.03, 2, ink, [SX - 2.3, y, SZ]),
      b.mk.cyl(0.38, 0.05, ORANGE, [SX + 1.4, y + 0.02, SZ]),
    );
    b.label('Sketch the design', [SX, TH + 3.4, SZ]);
    b.label('Mark the center of mass', [SX + 1.4, TH + 1.4, SZ + 3]);

    b.step(4);
    const fly = pivot(b, [TX, GY, -3.5], glider(b.mk, { payload: true }));
    b.label('Version 1: build it fast, then test', [TX, TH + 4, -3.5]);

    b.step(5); cone(b, 3, 3, RED); cone(b, 6.5, -4.5, RED);
    b.label('Record every flight', [4.5, 4.4, 0]);
    b.label('Distance from target, landing condition', [TGT, 7.5, 0]);

    b.step(6); cone(b, 10.6, 2.5, YELLOW, 0.05); cone(b, 12, -3.4, YELLOW, 0.08);
    b.label('One change per test', [11, 4.6, 0]);
    b.label('Getting closer', [TGT, 7.5, 0]);

    b.step(7); cone(b, 15, 2.2, GREEN, 0.12); cone(b, 17.6, -0.8, GREEN, 0.12); cone(b, 14.2, -2.6, GREEN, 0.1);
    b.label('3 scored attempts', [TGT, 5, 0]);
    b.label('Present your data', [0, 9, 0]);

    b.effect((s, t) => {
      demo.position.y = 17 + Math.sin(t * 1.2) * 1.2;
      demo.rotation.z = 0.06 * Math.sin(t * 2.4);
      if (s >= 5) {
        fly.position.z = 0;
        glide(fly, t, 4.2, LINE, 15, s === 5 ? 5 : s === 6 ? 11 : 15.5, s === 7 ? 0.5 : 0.35, 0.12);
      } else { fly.position.set(TX, GY, -3.5); fly.rotation.z = 0; }
    });
  },
};
