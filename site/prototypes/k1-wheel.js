// 1. Wheel. The heading and a kit index sit on the left; on the right one kit shows at a time on a big vertical drum.
// Scroll (wheel/trackpad) over it, drag it, press up/down, or pick a name: it turns forever in either direction.
// Purpose: spatial consistency + state indication. Only one kit is on screen, and the turn shows which way you went.
import { whenRendered } from './shared.js';

export const css = `
.kits-sec .kw-left .h2 { margin-bottom: 28px; }
.kw-index { list-style: none; margin: 0; padding: 0; }
.kw-index button { display: block; width: 100%; text-align: left; background: none; border: 0; padding: 8px 0; cursor: pointer; font: 600 clamp(24px, 2.6vw, 36px)/1.1 var(--sans); letter-spacing: -0.03em; color: var(--ink-3); opacity: 0.55; transform-origin: left center;
  transition: color 250ms ease, opacity 250ms ease, transform 420ms var(--ease-out); }
.kw-index button small { display: block; margin-top: 2px; font: 400 14px/1.4 var(--sans); letter-spacing: 0; }
.kw-index button[data-active] { color: var(--ki); opacity: 1; transform: translateX(14px); }
@media (hover: hover) and (pointer: fine) { .kw-index button:not([data-active]):hover { opacity: 0.9; } }
.kw-index button:active { transform: scale(0.98); }
.kw-index button[data-active]:active { transform: translateX(14px) scale(0.98); }
.kw-count { margin-top: 24px; font: 600 14px var(--sans); color: var(--ink-3); font-variant-numeric: tabular-nums; }
.kw-hint { margin-top: 6px; font-size: 14px; color: var(--ink-3); }

.wheel { position: relative; perspective: 1700px; overflow: clip; border-radius: var(--r); touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: grab; height: min(560px, 74vh); display: block; }
.wheel:active { cursor: grabbing; }
.wheel .kblock { position: absolute; inset: 0; grid-template-rows: minmax(0, 1fr) auto; backface-visibility: hidden; will-change: transform, opacity; -webkit-user-drag: none;
  transition: transform 640ms var(--ease-out), opacity 420ms var(--ease-out); }
.wheel .kblock .tile { aspect-ratio: auto; height: 100%; min-height: 0; }
.wheel .kblock img { -webkit-user-drag: none; }
.wheel .kb-txt h3 { font-size: clamp(30px, 3.2vw, 46px); }
.wheel .kblock[data-o="0"] { transform: none; opacity: 1; }
.wheel .kblock[data-o="-1"] { transform: translateY(-58%) rotateX(64deg) scale(0.84); opacity: 0; pointer-events: none; }
.wheel .kblock[data-o="1"], .wheel .kblock[data-o="2"] { transform: translateY(58%) rotateX(-64deg) scale(0.84); opacity: 0; pointer-events: none; }

@media (min-width: 961px) {
  .kits-sec { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: 56px; align-items: center; min-height: 86vh; padding-bottom: 72px; }
  .kits-sec .kw-left .h2 { font-size: clamp(36px, 4.2vw, 60px); }
}
@media (max-width: 960px) {
  .kits-sec .kw-left { margin-bottom: 24px; }
  .kw-index { display: flex; flex-wrap: wrap; gap: 4px 18px; }
  .kw-index button { width: auto; font-size: 20px; }
  .kw-index button small, .kw-hint { display: none; }
  .wheel { height: 500px; }
}
@media (prefers-reduced-motion: reduce) {
  .wheel .kblock, .kw-index button { transition: opacity 200ms ease; }
  .wheel .kblock[data-o] { transform: none !important; }
  .kw-index button[data-active] { transform: none; }
}
`;

export function setup(win, doc) {
  return whenRendered(doc, (main) => {
    const grid = main.querySelector('.stage-hero ~ section .kit-blocks');
    if (!grid || grid.dataset.wheel) return;
    grid.dataset.wheel = '1';
    const sec = grid.closest('section');
    sec.classList.add('kits-sec');
    const h2 = sec.querySelector('.h2');
    const cards = [...grid.children];
    const n = cards.length;

    const left = doc.createElement('div');
    left.className = 'kw-left';
    const list = doc.createElement('ol'); list.className = 'kw-index';
    cards.forEach((c, i) => {
      const li = doc.createElement('li'); const b = doc.createElement('button');
      b.type = 'button'; b.setAttribute('style', c.getAttribute('style'));
      b.innerHTML = `${c.querySelector('h3').getAttribute('aria-label') || c.querySelector('h3').textContent}<small>${c.querySelector('.kb-txt p').textContent}</small>`;
      b.addEventListener('click', () => goTo(i));
      li.append(b); list.append(li);
    });
    const count = doc.createElement('p'); count.className = 'kw-count';
    const hint = doc.createElement('p'); hint.className = 'kw-hint'; hint.textContent = 'Scroll over the wheel, drag it, or press ↑ ↓. It never runs out.';
    left.append(h2, list, count, hint);
    sec.prepend(left);

    grid.classList.add('wheel');
    grid.setAttribute('role', 'group'); grid.setAttribute('aria-roledescription', 'carousel'); grid.setAttribute('aria-label', 'Kits');
    cards.forEach((c) => { c.draggable = false; });

    let cur = 0;
    let timers = [];
    const idx = [...list.querySelectorAll('button')];

    function layout(animate = true) {
      cards.forEach((c, j) => {
        const o = ((j - cur + n + 1) % n) - 1; // -1 (above) … n-2 (below, hidden)
        const prev = Number(c.dataset.o);
        // a card that wraps from the top to the bottom (or back) jumps while invisible, never animates across the drum
        const jump = !animate || (Number.isFinite(prev) && Math.abs(o - prev) > 1);
        if (jump) c.style.transition = 'none';
        c.dataset.o = Math.min(o, 2);
        if (jump) { void c.offsetHeight; c.style.transition = ''; }
        c.inert = o !== 0;
        c.setAttribute('aria-hidden', String(o !== 0));
      });
      idx.forEach((b, j) => b.toggleAttribute('data-active', j === cur));
      count.textContent = `0${cur + 1} / 0${n}`;
    }
    const step = (dir) => { cur = (cur + dir + n) % n; layout(); };
    function goTo(i) {
      timers.forEach(clearTimeout); timers = [];
      const d = (i - cur + n) % n;
      if (!d) return;
      const dir = d <= n / 2 ? 1 : -1;
      const steps = dir > 0 ? d : n - d;
      for (let s = 0; s < steps; s++) timers.push(setTimeout(() => step(dir), s * 230));
    }

    // wheel / trackpad: one notch turns one kit; a short lock stops trackpad inertia from skipping ahead
    let acc = 0; let last = 0; let lock = 0;
    grid.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.timeStamp - last > 200) acc = 0;
      last = e.timeStamp;
      if (e.timeStamp < lock) return;
      acc += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(acc) > 50) { step(acc > 0 ? 1 : -1); acc = 0; lock = e.timeStamp + 650; }
    }, { passive: false });

    // drag: mouse in any direction, touch sideways (vertical touch still scrolls the page)
    let drag = null; let dragged = false;
    grid.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; drag = { x: e.clientX, y: e.clientY }; dragged = false; });
    grid.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x; const dy = e.clientY - drag.y;
      if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) { step(dy < 0 ? 1 : -1); drag = { x: e.clientX, y: e.clientY }; dragged = true; }
      else if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { step(dx < 0 ? 1 : -1); drag = { x: e.clientX, y: e.clientY }; dragged = true; }
    });
    const end = () => { drag = null; };
    grid.addEventListener('pointerup', end); grid.addEventListener('pointercancel', end); grid.addEventListener('pointerleave', end);
    grid.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); dragged = false; } }, true);
    grid.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
    });

    layout(false);
  });
}
