// Home-page hero animations. heroBuild() wraps a model builder so the hero plays a short story for that build:
//   Truss bridge - weights stack up, a chord snaps, the bridge breaks into pieces, then rebuilds itself
//   Light sensor - a lamp flashes and the LED answers it
//   Glider       - launches off the table, climbs, glides down to the tape measure, then fades back to the start
//   Water filter - dirty water is poured in and the stopwatch runs while clean water drips through
// The model files stay untouched. Parts are found by what they are (a LED has .glow, the stopwatch has .hand,
// the bridge is the biggest group added at step 7), so this only depends on those models keeping that shape.
import * as THREE from 'three';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - ((-2 * x + 2) ** 3) / 2); // ease-in-out cubic
const easeOut = (x) => 1 - (1 - x) ** 3;
const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
// A clock that starts at 0 when the model is built, so every loop begins with the model whole.
const clock = () => { let base = null; return (t) => { base ??= t; return t - base; }; };

// ---------------------------------------------------------------------------------------------------------------
// Truss bridge: 9 s loop. 0-6 s weights stack up and the bottom chord bends (the site's own load test),
// 6.05 s the bridge lets go and falls apart, 8-9 s the pieces fly back and it is whole again.
function bridgeBreak(b) {
  const loc = clock();
  const grp = b.parts.filter((p) => p.userData.from === 7 && p.userData.to === Infinity);
  const deck = grp.reduce((a, p) => (p.children.length > a.children.length ? p : a), grp[0]);
  const stacks = grp.filter((p) => p !== deck && p.children.length === 9);
  if (!deck || deck.children.length < 20) return;

  // the site's own load test, kept running at its step (7) so the weights and the snapping chord still play
  b.effects = b.effects.map((fn) => (s, t) => fn(7, loc(t)));

  const G = 55, FALL = 1.9, BREAK = 6.05, REBUILD = 1.95;
  const pieces = [...deck.children.map((o) => [o, -1]), ...stacks.flatMap((s, si) => s.children.map((o) => [o, si]))].map(([o, stack], i) => {
    const p0 = o.position.clone();
    const axis = new THREE.Vector3(hash(i, 1) - 0.5, hash(i, 2) - 0.5, hash(i, 3) - 0.5).normalize();
    const overGap = Math.abs(p0.x) < 12;
    return {
      o, stack, p0, q0: o.quaternion.clone(), axis, overGap,
      vx: (hash(i, 4) - 0.5) * (overGap ? 9 : 4), vz: (hash(i, 5) - 0.5) * 9, vy: hash(i, 6) * 6 + (overGap ? 1 : 3),
      w: (hash(i, 7) - 0.5) * 12, hop: 0.5 + hash(i, 8) * 1.4, delay: clamp01((p0.x + 16) / 32) * 0.25,
      floor: overGap ? 0.35 : 12.7,
      pos: new THREE.Vector3(), quat: new THREE.Quaternion(), rp: new THREE.Vector3(), rq: new THREE.Quaternion(),
    };
  });

  function pose(pc, tau, outP, outQ) {
    const { p0, vx, vy, vz, axis, w, floor } = pc;
    const tL = (vy + Math.sqrt(vy * vy + 2 * G * Math.max(0, p0.y - floor))) / G;
    const k = Math.min(tau, tL);
    outP.set(p0.x + vx * k, p0.y + vy * k - 0.5 * G * k * k, p0.z + vz * k);
    if (tau > tL) {
      const since = tau - tL;
      outP.y = floor + pc.hop * Math.max(0, Math.sin(Math.min(1, since / 0.34) * Math.PI)) * 0.5;
      outP.x += vx * 0.25 * (1 - Math.exp(-6 * since));
    }
    if (pc.overGap) outP.x = Math.max(-11.3, Math.min(11.3, outP.x)); // stays between the desks
    outQ.setFromAxisAngle(axis, w * Math.min(tau, tL + 0.3)).multiply(pc.q0);
  }

  b.effect((s, t) => {
    const ph = loc(t) % 9;
    for (const pc of pieces) {
      const o = pc.o;
      if (ph < BREAK) { o.position.copy(pc.p0); o.quaternion.copy(pc.q0); o.scale.setScalar(1); continue; }
      const tau = ph - BREAK;
      if (tau < REBUILD) { pose(pc, Math.min(tau, FALL), o.position, o.quaternion); continue; }
      pose(pc, FALL, pc.rp, pc.rq);
      const e = ease(clamp01((tau - REBUILD - pc.delay) / 0.7));
      o.position.lerpVectors(pc.rp, pc.p0, e);
      o.position.y += Math.sin(Math.PI * e) * 5;
      o.quaternion.slerpQuaternions(pc.rq, pc.q0, e);
      o.scale.setScalar(pc.stack > 0 ? 1 - e : 1); // the two spare weight stacks shrink away; the first one comes home
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Light sensor: 4 s loop. The lamp flashes twice quickly, then once long and bright; the LED answers every flash.
function lightFlash(b) {
  const loc = clock();
  const led = b.parts.find((p) => typeof p.glow === 'function');
  const lamp = b.parts.find((p) => p.userData.from === 4 && p.userData.to === 4);
  const hand = b.parts.find((p) => p.userData.from === 5 && p.userData.to === 6);
  if (!led || !lamp) return;
  const lens = lamp.children[1];

  const halo = (color, r) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    b.root.add(m);
    return m;
  };
  const lampHalo = halo(0xfff0a8, 1);
  const ledHalo = halo(0xff4d3d, 1);
  lampHalo.position.copy(lens.position);
  ledHalo.position.copy(led.top).add(new THREE.Vector3(0, -1.9, 0));

  const pulse = (x, at, rise, fall) => (x < at ? 0 : x < at + rise ? (x - at) / rise : Math.exp(-((x - at - rise) / fall) * 3));
  b.effect((s, t) => {
    const x = loc(t) % 4;
    const f = Math.min(1, pulse(x, 0.2, 0.05, 0.35) + pulse(x, 0.75, 0.05, 0.35) + pulse(x, 2.0, 0.08, 1.1));
    lamp.visible = true;
    if (hand) hand.visible = false;
    led.glow(0.25 + 2.8 * f);
    lens.material.emissiveIntensity = 0.2 + 1.8 * f;
    lampHalo.material.opacity = 0.55 * f; lampHalo.scale.setScalar(2.2 + 4.2 * f);
    ledHalo.material.opacity = 0.5 * f; ledHalo.scale.setScalar(0.9 + 1.5 * f);
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Glider: 9 s loop. Rests on the table, launches, climbs, glides down to the tape measure, fades out, fades in at the start.
function gliderFly(b) {
  const loc = clock();
  const probe = b.effects[0];
  if (!probe) return;
  probe(6, 0); // the site's own glide shifts the glider parts; that marks which ones they are
  const G = b.parts.filter((p) => p.userData.x0 !== undefined);
  if (!G.length) return;
  G.forEach((p) => { p.position.x = p.userData.x0; p.position.y = p.userData.baseY; });

  // give the glider its own pivot at its middle so it can pitch and bank
  const box = new THREE.Box3();
  G.forEach((p) => box.expandByObject(p));
  const c = box.getCenter(new THREE.Vector3());
  const gl = new THREE.Group();
  gl.position.copy(c);
  b.root.add(gl);
  G.forEach((p) => { p.position.sub(c); p.userData.baseY = p.position.y; gl.add(p); });
  const mats = [];
  gl.traverse((m) => { if (m.isMesh) [].concat(m.material).forEach((mm) => { mm.transparent = true; mats.push(mm); }); });
  b.effects.length = 0; // replace the site's glide with this one
  const ghosts = b.parts.filter((p) => p.userData.from === 7); // the "try a longer wing" outlines would sit there as stray orange squares

  const X1 = 38;
  const path = (u) => ({ x: X1 * u, y: 8.4 * Math.sin(Math.PI * u) * (1 - 0.18 * u) - 4.9 * u * u });
  b.effect((s, t) => {
    const lt = loc(t) % 9;
    ghosts.forEach((p) => { p.visible = false; });
    let u = 0, alpha = 1, nose = 0;
    if (lt < 1) nose = 0.1 * easeOut(lt); // a little nose-up before the throw
    else if (lt < 6) { const k = (lt - 1) / 5; u = 0.5 * easeOut(k) + 0.5 * k; } // thrown fast, then settles into a steady glide
    else u = 1;
    if (lt >= 7.2 && lt < 8) alpha = 1 - (lt - 7.2) / 0.8;
    if (lt >= 8) { u = 0; alpha = clamp01((lt - 8) / 0.8); }
    u = clamp01(u);
    const a = path(Math.max(0, u - 0.01)), z = path(Math.min(1, u + 0.01));
    const pitch = u >= 1 || u <= 0 ? nose : Math.max(-0.45, Math.min(0.5, Math.atan2(z.y - a.y, z.x - a.x) * 0.7));
    const p = path(u);
    const bank = u > 0 && u < 1 ? 0.2 * Math.sin(u * Math.PI * 2.4) : 0;
    gl.position.set(c.x + p.x, c.y + p.y, c.z);
    gl.rotation.set(bank, 0, pitch);
    mats.forEach((m) => { m.opacity = alpha; });
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Water filter: shows the pour-and-time step on the finished build: stopwatch hand runs, dirty water drains,
// clean water rises and drips (the site's own 7 s loop for that step).
function waterTest(b) {
  const loc = clock();
  const six = b.parts.filter((p) => p.userData.from === 6 && p.userData.to === 6);
  if (!six.length) return;
  b.effects = b.effects.map((fn) => (s, t) => fn(6, loc(t)));
  b.effect((s, t) => { six.forEach((p) => { p.visible = true; }); });
}

// ---------------------------------------------------------------------------------------------------------------
const JOBS = { 'meche/bridge': bridgeBreak, 'ece/light-sensor': lightFlash, 'aero/glider-wing': gliderFly, 'bme/water-filter': waterTest };

// The hero's builder for a model: the site's own builder plus its animation. Thumbnails and the kit scenes use the plain builder.
export function heroBuild(kit, proj, build) {
  const anim = JOBS[`${kit}/${proj}`];
  if (!anim || reduced()) return build;
  return (b) => {
    build(b);
    try { anim(b); } catch (e) { console.warn('hero animation skipped for', kit, proj, e); }
  };
}
