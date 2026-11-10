// 3D build models for the Mechanical Engineering kit. Steps match data/kits.mjs.
// Scale: 1 unit is roughly 1 cm (slightly compressed for the bridge desks).
const WOOD = 0xd9b47a, CARD = 0xb98b5a, PAPER = 0xf4f0e6, TAPE = 0x4a90d9, STEEL = 0x9aa0a6;
const INK = 0x2b3a55, DESK = 0x5a4a3c, YELLOW = 0xe6c229, STRAW = 0xe8e2d6, SKEWER = 0xc9a66b;

// ----- local helpers -----

// Flat stick from a to c whose broad face points along normal n (n must not be parallel to a→c).
function plank(b, a, c, n, o = {}) {
  const d = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]);
  const mid = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2];
  const m = b.mk.box(o.w ?? 1, len, o.t ?? 0.2, o.color ?? WOOD, mid);
  m.up.set(d[0] / len, d[1] / len, d[2] / len);
  m.lookAt(mid[0] + n[0], mid[1] + n[1], mid[2] + n[2]);
  return m;
}

// Warren-truss bridge. M(u, v, w) maps bridge coordinates (u along the span, v up, w across)
// to world coordinates, so the same bridge can be drawn flat, on a desk, or across the gap.
// Returns mesh lists; the caller decides which step each belongs to.
function bridge(b, M, o = {}) {
  const panels = o.panels ?? 4, L = o.L ?? 7.5, W = o.W ?? 6, sw = o.sw ?? 1;
  const H = L * 0.866, e = 0.4 * sw, t = 0.2 * sw;
  const o0 = M(0, 0, 0);
  const dir = (p) => [p[0] - o0[0], p[1] - o0[1], p[2] - o0[2]];
  const nW = dir(M(0, 0, 1)), nV = dir(M(0, 1, 0));
  const st = { w: sw, t };
  const side = (w, skip) => {
    const out = [], lay = w + (w < 0 ? -t : t);
    for (let i = 0; i < panels; i++) if (i !== skip) out.push(plank(b, M(i * L - e, 0, w), M((i + 1) * L + e, 0, w), nW, st));
    for (let i = 0; i < panels - 1; i++) out.push(plank(b, M((i + 0.5) * L - e, H, w), M((i + 1.5) * L + e, H, w), nW, st));
    for (let i = 0; i < panels; i++) {
      out.push(plank(b, M(i * L, 0, lay), M((i + 0.5) * L, H, lay), nW, st));
      out.push(plank(b, M((i + 0.5) * L, H, lay), M((i + 1) * L, 0, lay), nW, st));
    }
    return out;
  };
  const cross = () => {
    const out = [];
    for (let i = 0; i <= panels; i++) out.push(plank(b, M(i * L, 0.6 * sw, -W / 2 - sw), M(i * L, 0.6 * sw, W / 2 + sw), nV, st));
    for (let i = 0; i < panels; i++) out.push(plank(b, M((i + 0.5) * L, H + 0.6 * sw, -W / 2 - sw), M((i + 0.5) * L, H + 0.6 * sw, W / 2 + sw), nV, st));
    return out;
  };
  const c = (panels * L) / 2, D = o.deck ?? L * 1.6;
  const deck = () => [plank(b, M(c - D / 2, 0.8 * sw, 0), M(c + D / 2, 0.8 * sw, 0), nV, { w: W - 0.8 * sw, t, color: CARD })];
  return { side, cross, deck, deckTop: 0.9 * sw, L, H, W };
}

// A bottom-chord stick that can swing down from its left joint (bridge must run along x).
function snapStick(b, pivot, len) {
  const g = b.part(plank(b, [-0.4, 0, 0], [len + 0.4, 0, 0], [0, 0, 1]));
  g.position.set(pivot[0], pivot[1], pivot[2]);
  g.userData.baseY = pivot[1];
  return g;
}

// Weight stacks appear one by one during step s0, then the stick snaps; afterwards it stays broken.
function loadTest(b, stacks, stick, s0, angle) {
  b.effect((s, t) => {
    const ph = t % 9;
    stacks.forEach((p, i) => { p.visible = s > s0 || (s === s0 && (i === 0 || ph > i * 1.6)); });
    const want = s > s0 || (s === s0 && ph > 6) ? -angle : 0;
    stick.rotation.z += (want - stick.rotation.z) * 0.2;
  });
}

// Digital scale standing at pos (centre of its base); top surface is 1.2 above pos.
const scale = (b, [x, y, z], facing = 'z') => {
  const w = facing === 'x' ? 14 : 9, d = facing === 'x' ? 9 : 12;
  return b.part(
    b.mk.box(w, 0.9, d, 0x3a3d42, [x, y + 0.45, z]),
    b.mk.box(w - 0.6, 0.3, d - 0.6, 0xc8ccd0, [x, y + 1.05, z], null, { metal: 0.6, rough: 0.35 }),
    facing === 'x' ? b.mk.box(0.2, 0.5, 3.6, 0x7fd6a4, [x + w / 2 + 0.05, y + 0.45, z], null, { emissive: 0x2f8f5f })
      : b.mk.box(3.6, 0.5, 0.2, 0x7fd6a4, [x, y + 0.45, z + d / 2 + 0.05], null, { emissive: 0x2f8f5f }),
  );
};

// Paper with ink lines. lines are [[x1,z1],[x2,z2]] in paper coordinates centred on the sheet.
function sketch(b, [x, y, z], w, d, lines) {
  return b.part(
    b.mk.box(w, 0.06, d, PAPER, [x, y + 0.03, z]),
    lines.map(([p, q]) => plank(b, [x + p[0], y + 0.08, z + p[1]], [x + q[0], y + 0.08, z + q[1]], [0, 1, 0], { w: 0.16, t: 0.03, color: INK })),
  );
}
// Side view of a Warren truss as sketch lines: n panels of length l, baseline at z0.
function trussLines(n, l, z0) {
  const h = l * 0.8, x0 = (-n * l) / 2, out = [[[x0, z0], [-x0, z0]], [[x0 + l / 2, z0 - h], [-x0 - l / 2, z0 - h]]];
  for (let i = 0; i < n; i++) {
    out.push([[x0 + i * l, z0], [x0 + (i + 0.5) * l, z0 - h]], [[x0 + (i + 0.5) * l, z0 - h], [x0 + (i + 1) * l, z0]]);
  }
  return out;
}

// Ruler from a to c (flat face along n) with tick marks every `every` units.
function ruler(b, a, c, n, every = 5) {
  const d = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], len = Math.hypot(d[0], d[1], d[2]);
  const at = (s, k) => [a[0] + (d[0] * s) / len + n[0] * k, a[1] + (d[1] * s) / len + n[1] * k, a[2] + (d[2] * s) / len + n[2] * k];
  // tick direction = across the ruler = n × d
  const x = [n[1] * d[2] - n[2] * d[1], n[2] * d[0] - n[0] * d[2], n[0] * d[1] - n[1] * d[0]].map((v) => (v / len) * 0.45);
  const ticks = [];
  for (let s = 0; s <= len + 0.01; s += every) {
    const p = at(s, 0.09);
    ticks.push(plank(b, [p[0] - x[0], p[1] - x[1], p[2] - x[2]], [p[0] + x[0], p[1] + x[1], p[2] + x[2]], n, { w: 0.18, t: 0.04, color: 0x222222 }));
  }
  return b.part(plank(b, a, c, n, { w: 1.4, t: 0.14, color: YELLOW }), ticks);
}

// Tapered square tower frame. hs = half-widths per level, ys = heights per level.
function towerMeshes(b, cx, cz, hs, ys, r = 0.32, rb = 0.14) {
  const corner = (k, i) => [cx + hs[k] * (i === 0 || i === 3 ? -1 : 1), ys[k], cz + hs[k] * (i < 2 ? -1 : 1)];
  const ring = (k) => [0, 1, 2, 3].map((i) => b.mk.rod(corner(k, i), corner(k, (i + 1) % 4), r, STRAW));
  const joints = (k) => [0, 1, 2, 3].map((i) => b.mk.sphere(r * 1.5, STEEL, corner(k, i), { metal: 0.5, rough: 0.4 }));
  const base = [...ring(0), ...joints(0), b.mk.rod(corner(0, 0), corner(0, 2), rb, SKEWER)];
  const levels = [], braces = [];
  for (let k = 1; k < hs.length; k++) {
    levels.push([...[0, 1, 2, 3].map((i) => b.mk.rod(corner(k - 1, i), corner(k, i), r, STRAW)), ...ring(k), ...joints(k)]);
    braces.push([0, 1, 2, 3].map((i) => ((i + k) % 2
      ? b.mk.rod(corner(k - 1, i), corner(k, (i + 1) % 4), rb, SKEWER)
      : b.mk.rod(corner(k - 1, (i + 1) % 4), corner(k, i), rb, SKEWER))));
  }
  return { base, levels, braces, top: ys[ys.length - 1] };
}

export default {
  bridge: (b) => {
    const TOP = 12; // desk height
    b.step(0);
    b.box(20, TOP, 34, DESK, [-22, TOP / 2, 0]);
    b.box(20, TOP, 34, DESK, [22, TOP / 2, 0]);

    b.step(1, { only: true });
    ruler(b, [-15, TOP + 0.08, 10], [15, TOP + 0.08, 10], [0, 1, 0]);
    b.label('30 cm gap between the desks', [0, TOP + 2, 10]);

    b.step(2);
    sketch(b, [27, TOP, 11], 8, 10, trussLines(4, 1.6, 1).map(([p, q]) => [[p[1], -p[0]], [q[1], -q[0]]]));
    b.label('Side view: a row of triangles (a truss)', [27, TOP + 3, 11]);

    // 3: two identical trusses flat on the desk
    b.step(3, { only: true });
    const flat = (x0) => bridge(b, (u, v, w) => [x0 + v, TOP + 0.1 + w, u - 15]).side(0);
    b.part(flat(-30.5)); b.part(flat(-21.5));
    b.label('Two identical side trusses, built flat', [-22, TOP + 4, 0]);

    // 4-5: stood up on the desk and joined
    const onDesk = bridge(b, (u, v, w) => [-22 + w, TOP + 0.5 + v, u - 15]);
    b.step(4, { until: 5 });
    b.part(onDesk.side(-3)); b.part(onDesk.side(3)); b.part(onDesk.cross());
    b.step(4, { only: true });
    b.label('Cross-pieces along the top', [-22, TOP + 10.5, -6]);
    b.label('…and along the bottom', [-22, TOP + 3, 16]);
    b.step(5, { only: true });
    b.part(onDesk.deck());
    b.label('Flat deck in the middle for the load', [-22, TOP + 4.5, 0]);

    // 6: on the scale
    b.step(6);
    scale(b, [22, TOP, -8]);
    b.step(6, { only: true });
    const onScale = bridge(b, (u, v, w) => [7 + u, TOP + 1.7 + v, -8 + w]);
    b.part(onScale.side(-3), onScale.side(3), onScale.cross(), onScale.deck());
    b.label('Glue set? Weigh it and record the mass', [22, TOP + 12, -8]);

    // 7: across the gap, loaded to failure
    b.step(7);
    const M = (u, v, w) => [u - 15, TOP + 0.5 + v, w];
    const fin = bridge(b, M);
    b.part(fin.side(-3), fin.side(3, 1), fin.cross(), fin.deck());
    const stick = snapStick(b, M(7.5, 0, 3), 7.5);
    const stacks = [0, -2.3, 2.3].map((x) => b.weights([x, TOP + 0.5 + fin.deckTop, 0], 9));
    loadTest(b, stacks, stick, 7, 1.2);
    b.label('Add weight at the centre, a little at a time', [0, TOP + 11, 0]);
    b.label('Which piece fails first?', [-5, TOP - 3, 3]);

    b.step(8);
    b.label('Score = load held ÷ bridge mass', [0, TOP + 11, 0]);
  },

  tower: (b) => {
    b.step(0); b.table(40, 1, 36);
    const Y = 1.32;
    const T = towerMeshes(b, 0, 0, [7, 5.5, 4, 2.5], [Y, Y + 12, Y + 24, Y + 36]);

    b.step(1, { until: 5 });
    b.weights([14, 1, 11], 8);
    b.step(1, { only: true });
    b.label('Every tower must hold this: 100 g', [14, 4.5, 11]);
    b.label('Agree the build time too', [0, 7, 0]);

    b.step(2); b.part(T.base);
    b.label('Wide square base with a diagonal brace', [0, 4, 0]);

    b.step(3); T.levels.forEach((l) => b.part(l));
    b.label('Each level a little narrower', [0, T.top + 3, 0]);

    b.step(4); T.braces.forEach((l) => b.part(l));
    b.label('A diagonal in every open rectangle', [6, Y + 19, 6]);

    b.step(5); b.card(8, 7, [0, T.top + 0.36, 0]);
    b.label('Index-card platform', [0, T.top + 2.5, 0]);

    b.step(6);
    b.weights([0, T.top + 0.4, 0], 8);
    b.step(6, { only: true });
    ruler(b, [11, 1, 9], [11, T.top + 0.4, 9], [0, 0, 1]);
    b.label('Measure the height', [11, 16, 9]);
    b.label('Weight on top: count 10 seconds', [0, T.top + 5, 0]);
  },

  crane: (b) => {
    const TOP = 18, TIP = 26;
    b.step(0); b.box(24, TOP, 22, DESK, [-12, TOP / 2, 0]);

    // 1: base taped to the desk edge
    b.step(1);
    b.part(b.mk.box(11, 0.3, 9, CARD, [-5.5, TOP + 0.15, 0]));
    b.part(
      b.mk.box(2, 0.08, 14, TAPE, [-8.5, TOP + 0.36, 0]), b.mk.box(2, 0.08, 14, TAPE, [-2, TOP + 0.36, 0]),
      b.mk.box(2, 0.3, 0.08, TAPE, [-8.5, TOP + 0.17, 4.54]), b.mk.box(2, 0.3, 0.08, TAPE, [-8.5, TOP + 0.17, -4.54]),
      b.mk.box(2, 0.3, 0.08, TAPE, [-2, TOP + 0.17, 4.54]), b.mk.box(2, 0.3, 0.08, TAPE, [-2, TOP + 0.17, -4.54]),
    );
    b.label('Tape or clamp the base to the desk edge', [-5.5, TOP + 3, 0]);
    b.label('Nothing may touch the floor', [8, 8, 0]);

    // 2: arm = long thin triangle, rails on edge, made of overlapping sticks
    b.step(2);
    const RY = TOP + 0.9, X0 = -10;
    const zAt = (x) => 3.4 - ((x - X0) / (TIP - X0)) * 3.1; // rail half-spacing: wide at desk, narrow at tip
    const rail = (sgn) => {
      const out = [], n = 4, seg = (TIP - X0) / n;
      for (let i = 0; i < n; i++) {
        const xa = X0 + i * seg - (i ? 0.7 : 0), xb = X0 + (i + 1) * seg + (i < n - 1 ? 0.7 : 0);
        const off = (i % 2) * 0.2 * sgn;
        out.push(plank(b, [xa, RY, sgn * zAt(xa) + off], [xb, RY, sgn * zAt(xb) + off], [0, 0, 1]));
      }
      return out;
    };
    b.part(rail(1)); b.part(rail(-1));
    const xs = [-9, -4, 1, 6, 11, 16, 21];
    b.part(xs.map((x) => plank(b, [x, RY + 0.6, -zAt(x) - 0.7], [x, RY + 0.6, zAt(x) + 0.7], [0, 1, 0])));
    b.part(xs.slice(0, -1).map((x, i) => {
      const s = i % 2 ? 1 : -1, x2 = xs[i + 1];
      return b.mk.rod([x, RY + 0.84, s * zAt(x)], [x2, RY + 0.84, -s * zAt(x2)], 0.14, SKEWER);
    }));
    b.label('Wide at the desk', [-6, RY + 3, 4]);
    b.label('Narrow at the tip', [TIP, RY + 3, 0]);

    // 3: mast at the desk end (A-frame with a back brace)
    b.step(3);
    const APEX = [-1, RY + 10, 0];
    b.part(
      plank(b, [-1, RY - 0.3, zAt(-1) + 0.3], [-1, APEX[1] + 0.4, -0.25], [1, 0, 0]),
      plank(b, [-1.2, RY - 0.3, -zAt(-1) - 0.3], [-1.2, APEX[1] + 0.4, 0.25], [1, 0, 0]),
      b.mk.rod([-1.1, APEX[1], 0], [-9, RY + 0.8, 0], 0.14, SKEWER),
    );
    b.label('Short mast at the desk end', [-1, APEX[1] + 2, 0]);

    // 4: cable
    b.step(4);
    const tip = [TIP - 0.4, RY + 0.5, 0];
    b.string([[-1.1, APEX[1] + 0.2, 0], [(tip[0] - 1.1) / 2, (APEX[1] + 0.2 + tip[1]) / 2, 0], tip]);
    b.part(b.mk.sphere(0.3, 0xf2ede4, [-1.1, APEX[1] + 0.2, 0]), b.mk.sphere(0.3, 0xf2ede4, tip));
    b.label('String: top of mast → tip (in tension)', [12, RY + 8, 0]);

    // 5: paper-clip hook
    b.step(5);
    const HX = TIP - 0.4, HY = RY - 0.5;
    b.tube([[HX, RY + 0.5, 0], [HX, HY - 0.6, 0], [HX, HY - 2.2, 0], [HX + 0.5, HY - 2.9, 0], [HX + 1, HY - 2.3, 0]], 0.14, 0xc8ccd0, { metal: 0.8, rough: 0.3 });
    b.label('Paper-clip hook on the tip', [HX, HY - 5, 0]);

    // 6: measure reach, add weight
    b.step(6);
    const load = b.part([-0.6, -0.3, 0, 0.3, 0.6].map((dz) =>
      b.mk.torus(1.1, 0.3, STEEL, [HX + 0.5, HY - 4.15, dz * 1.6], null, { metal: 0.7, rough: 0.35 })));
    b.step(6, { only: true });
    ruler(b, [0, RY + 1.06, 0], [TIP - 1, RY + 1.06, 0], [0, 1, 0]);
    b.label('Reach: desk edge to tip', [12, RY + 3, 0]);
    b.label('Add washers to the hook', [HX + 0.5, HY - 8, 0]);
    b.effect((s, t) => { load.position.z = s >= 6 ? Math.sin(t * 2) * 0.12 : 0; });
  },

  earthquake: (b) => {
    b.step(0); b.table(46, 1, 36);
    const TRAY = 3.3, H1 = 13.5, H2 = 27; // tray top, storey heights above the tray
    const moving = []; // parts that ride on the tray and shear with the building
    const ride = (p) => { p.matrixAutoUpdate = false; moving.push(p); return p; };

    // 1: shake table
    b.step(1);
    b.part(
      b.mk.box(34, 0.3, 26, CARD, [0, 1.15, 0]),
      b.mk.box(34, 2.6, 0.4, CARD, [0, 2.3, 12.8]), b.mk.box(34, 2.6, 0.4, CARD, [0, 2.3, -12.8]),
      b.mk.box(0.4, 2.6, 26, CARD, [16.8, 2.3, 0]), b.mk.box(0.4, 2.6, 26, CARD, [-16.8, 2.3, 0]),
    );
    const marbles = b.part([[-9, -6], [9, -6], [-9, 6], [9, 6]].map(([x, z]) =>
      b.mk.sphere(0.8, 0x4fb3d9, [x, 2.1, z], { rough: 0.15 })));
    marbles.matrixAutoUpdate = false;
    const tray = ride(b.part(b.mk.box(26, 0.4, 20, 0xd2a878, [0, TRAY - 0.2, 0], null, { opacity: 0.6 })));
    b.label('Box lid', [-15, 4.6, 13]);
    b.label('Cardboard tray rolling on 4 marbles', [0, 6, 0]);

    // 2: two-floor frame with feet taped down
    b.step(2);
    const cols = [[-6, -5], [6, -5], [6, 5], [-6, 5]];
    ride(b.part(
      cols.map(([x, z]) => b.mk.rod([x, TRAY, z], [x, TRAY + H2, z], 0.32, STRAW)),
      [H1, H2].map((h) => cols.map(([x, z], i) => {
        const [x2, z2] = cols[(i + 1) % 4];
        return b.mk.rod([x, TRAY + h - 0.35, z], [x2, TRAY + h - 0.35, z2], 0.32, STRAW);
      })).flat(),
      b.mk.box(14, 0.08, 12, PAPER, [0, TRAY + H1 + 0.02, 0]),
      b.mk.box(14, 0.08, 12, PAPER, [0, TRAY + H2 + 0.04, 0]),
    ));
    ride(b.part(cols.map(([x, z]) => b.mk.box(3, 0.1, 1.4, TAPE, [x, TRAY + 0.05, z]))));
    b.label('Two floors, at least 25 cm tall', [0, TRAY + H2 + 3, 0]);
    b.label('Feet taped to the tray', [6, TRAY + 2.5, 5]);

    // 3: washers taped to the top floor
    b.step(3);
    const WY = TRAY + H2 + 0.08;
    ride(b.weights([-2.2, WY, 0], 4)); ride(b.weights([2.2, WY, 0], 4));
    ride(b.part(b.mk.box(8.5, 0.06, 1.6, TAPE, [0, WY + 1.0, 0]), b.mk.box(0.06, 1, 1.6, TAPE, [-4.2, WY + 0.5, 0]), b.mk.box(0.06, 1, 1.6, TAPE, [4.2, WY + 0.5, 0])));
    b.label('Washers taped to the top floor', [0, WY + 3.5, 0]);

    b.step(4);
    b.label('Shake gently 10 s, then harder 10 s', [0, TRAY + H2 + 5, 0]);
    b.label('Same shaking for every team', [0, 6.5, 13]);

    b.step(5, { only: true });
    ride(b.torus(1.3, 0.14, 0xf7871f, [6, TRAY + H1 - 0.35, 5], [Math.PI / 2, 0, 0]));
    ride(b.torus(1.3, 0.14, 0xf7871f, [-6, TRAY + H1 - 0.35, 5], [Math.PI / 2, 0, 0]));
    b.label('Watch: where does it bend or twist first?', [0, TRAY + H1 + 3, 5]);

    // 6: cross-bracing
    b.step(6);
    const braces = [];
    [[0, H1], [H1, H2]].forEach(([lo, hi]) => cols.forEach(([x, z], i) => {
      const [x2, z2] = cols[(i + 1) % 4];
      const a = TRAY + lo + 0.3, c = TRAY + hi - 0.7;
      braces.push(b.mk.rod([x, a, z], [x2, c, z2], 0.14, SKEWER), b.mk.rod([x2, a, z2], [x, c, z], 0.14, SKEWER));
    }));
    ride(b.part(braces));
    b.label('Add cross-bracing where it bent', [0, TRAY + H1 + 3, 5]);
    b.label('Test again: less sway', [0, TRAY + H2 + 5, 0]);

    b.effect((s, t) => {
      let amp = 0, lean = 0;
      if (s === 4) { const hard = t % 8 > 4; amp = hard ? 2.6 : 1; lean = hard ? 0.09 : 0.035; }
      if (s === 5) { amp = 2.6; lean = 0.11; }
      if (s >= 6) { amp = 2.6; lean = 0.012; }
      const w = s === 4 && t % 8 <= 4 ? 5 : 9;
      const x = amp * Math.sin(t * w), sh = -lean * Math.sin(t * w - 0.5);
      moving.forEach((p) => {
        const k = p === tray ? 0 : sh;
        p.matrix.set(1, k, 0, x - k * TRAY, 0, 1, 0, p.position.y, 0, 0, 1, 0, 0, 0, 0, 1);
        p.matrixWorldNeedsUpdate = true;
      });
      marbles.matrix.set(1, 0, 0, x / 2, 0, 1, 0, marbles.position.y, 0, 0, 1, 0, 0, 0, 0, 1);
      marbles.matrixWorldNeedsUpdate = true;
    });
  },

  'meche-final': (b) => {
    b.step(0); b.table(62, 1, 40);
    const T = 1;

    // 1: three scenarios as miniatures
    b.step(1, { only: true });
    const mini = bridge(b, (u, v, w) => [-20 + u - 6, T + 2.2 + v, w], { panels: 3, L: 4, W: 3, sw: 0.5 });
    b.part(
      mini.side(-1.5), mini.side(1.5), mini.cross(), mini.deck(),
      b.mk.box(4, 2, 7, 0x6f8f4e, [-28, T + 1, 0]), b.mk.box(4, 2, 7, 0x6f8f4e, [-12, T + 1, 0]),
      b.mk.box(12, 0.1, 7, 0x3f8fd0, [-20, T + 0.05, 0]),
    );
    const mt = towerMeshes(b, 0, 0, [3.2, 2.4, 1.6], [T + 0.2, T + 6, T + 12], 0.18, 0.09);
    b.part(mt.base, mt.levels.flat(), mt.braces.flat(), b.mk.box(4.4, 0.2, 4.4, CARD, [0, T + 12.3, 0]));
    const sr = (a, c) => b.mk.rod(a, c, 0.18, STRAW);
    const SX = 20, sy = T + 0.2, ap = T + 6.5;
    b.part(
      [-4, 4].map((z) => [sr([SX - 4.5, sy, z], [SX, ap, z]), sr([SX + 4.5, sy, z], [SX, ap, z]), sr([SX - 4.5, sy, z], [SX + 4.5, sy, z])]).flat(),
      sr([SX, ap, -4], [SX, ap, 4]), sr([SX - 4.5, sy, -4], [SX - 4.5, sy, 4]), sr([SX + 4.5, sy, -4], [SX + 4.5, sy, 4]),
      b.mk.rod([SX - 4.5, sy, -4], [SX, ap, 4], 0.09, SKEWER), b.mk.rod([SX + 4.5, sy, 4], [SX, ap, -4], 0.09, SKEWER),
    );
    b.label('Footbridge over a creek', [-20, T + 8, 0]);
    b.label('Lookout tower', [0, T + 15, 0]);
    b.label('Emergency shelter frame', [20, T + 9, 0]);

    // 2: the scenario and its requirements (worked example: the footbridge)
    const BH = 8, BZ = -8; // bank height, creek centreline
    b.step(2);
    b.part(b.mk.box(12, BH, 14, 0x6f8f4e, [-15, T + BH / 2, BZ]), b.mk.box(12, BH, 14, 0x6f8f4e, [15, T + BH / 2, BZ]));
    b.part(b.mk.box(18, 0.12, 14, 0x3f8fd0, [0, T + 0.06, BZ], null, { rough: 0.25 }));
    b.step(2, { only: true });
    ruler(b, [-9, T + BH + 0.08, BZ + 5], [9, T + BH + 0.08, BZ + 5], [0, 1, 0], 3);
    b.label('Span: 18 cm creek', [0, T + 2, BZ + 9]);
    b.label('Must hold: 500 g', [-19, T + BH + 5, BZ]);
    b.label('Budget: $20 at most', [19, T + BH + 5, BZ]);

    // 3: two sketched designs with costs
    b.step(3);
    const CZ = 12;
    sketch(b, [-23, T, CZ], 12, 9, trussLines(3, 3, 2.2));
    sketch(b, [-9, T, CZ], 12, 9, [
      [[-4.5, 2.2], [4.5, 2.2]], [[-4.5, 1.6], [4.5, 1.6]], [[-4.5, 1.0], [4.5, 1.0]], [[-4.5, 0.4], [4.5, 0.4]],
      [[-4.5, 2.2], [-4.5, 0.4]], [[4.5, 2.2], [4.5, 0.4]], [[-1.5, 2.2], [-1.5, 0.4]], [[1.5, 2.2], [1.5, 0.4]],
    ]);
    b.step(3, { only: true });
    b.label('Design A: truss — $14', [-27, T + 7, CZ]);
    b.label('Design B: stacked beam — $26', [-5, T + 2, CZ + 4]);

    // 4: pick one
    b.step(4);
    const fr = (x1, z1, x2, z2) => b.mk.box(Math.abs(x2 - x1) + 0.4, 0.2, Math.abs(z2 - z1) + 0.4, 0x3aa655, [(x1 + x2) / 2 - 23, T + 0.1, (z1 + z2) / 2 + CZ]);
    b.part(fr(-6.4, -4.9, 6.4, -4.9), fr(-6.4, 4.9, 6.4, 4.9), fr(-6.4, -4.9, -6.4, 4.9), fr(6.4, -4.9, 6.4, 4.9));
    b.label('Pick A: holds the load, under budget', [-23, T + 3, CZ]);

    // 5: build and weigh
    const P = { panels: 3, L: 7.5, W: 6 };
    b.step(5);
    scale(b, [16, T, CZ]);
    b.step(5, { only: true });
    const s5 = bridge(b, (u, v, w) => [16 + u - 11.25, T + 1.7 + v, CZ + w], P);
    b.part(s5.side(-3), s5.side(3), s5.cross(), s5.deck());
    b.label('Build it, then weigh it', [16, T + 11, CZ]);

    // 6: test to the required load, then on to failure
    b.step(6);
    const M = (u, v, w) => [u - 11.25, T + BH + 0.5 + v, BZ + w];
    const fin = bridge(b, M, P);
    b.part(fin.side(-3), fin.side(3, 1), fin.cross(), fin.deck());
    const stick = snapStick(b, M(7.5, 0, 3), 7.5);
    const stacks = [0, -2.3, 2.3].map((x) => b.weights([x, T + BH + 0.5 + fin.deckTop, BZ], 9));
    loadTest(b, stacks, stick, 6, 0.85);
    b.label('First the required 500 g…', [0, T + BH + 10, BZ]);
    b.label('…then keep adding until it fails', [0, T + 3.5, BZ + 6]);

    b.step(7);
    b.label('Factor of safety = 1500 g ÷ 500 g = 3', [0, T + BH + 10, BZ]);

    b.step(8);
    b.label('Present: cost $14 of $20', [-23, T + 3, CZ]);
    b.label('Factor of safety: 3', [0, T + BH + 10, BZ]);
    b.label('One change: double the stick that broke', [4, T + 3.5, BZ + 6]);
  },
};
