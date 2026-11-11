// Scroll motion for the home page. Two pieces:
//  - bindMotion: headings and the mission paragraph slide up out of a mask word by word, lead copy fades in,
//    the stat numbers rise into their cards (then the count-up runs), a hairline draws under each section title.
//    (The pinned hero and the "how a unit runs" columns are pure CSS scroll-driven animation, see styles.css.)
//  - bindSpotlight: the kit section pins and each scroll step opens the next kit's colour (CSS). This file only gives each
//    scene a live, slowly turning 3D model, and only for the scenes that are on screen.
// Everything is skipped or instant under prefers-reduced-motion.
import { reduced, onCleanup, loadModels, FEATURE } from './core.js';
import { mountViewer } from './viewer.js';

// ---------- text, numbers, hairlines ----------
function splitWords(el) {
  if (el.hasAttribute('data-split')) return;
  el.setAttribute('data-split', '');
  el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
  let w = 0;
  const walk = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((t) => {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.append(t); return; }
        const mask = document.createElement('span');
        mask.className = 'sm-mask';
        mask.setAttribute('aria-hidden', 'true');
        const word = document.createElement('span');
        word.style.setProperty('--w', Math.min(w++, 14));
        word.textContent = t;
        mask.append(word);
        frag.append(mask);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1) walk(n);
  });
  walk(el);
}

// --i = position among siblings (capped), used for stagger delays
function stagger(els) {
  const seen = new Map();
  els.forEach((el) => {
    const n = seen.get(el.parentElement) ?? 0;
    seen.set(el.parentElement, n + 1);
    el.style.setProperty('--i', Math.min(n, 6));
  });
}

export function bindMotion(root) {
  root.setAttribute('data-motion', '');
  onCleanup(() => root.removeAttribute('data-motion'));

  const heads = [...root.querySelectorAll('.display, .h2, .big-copy')];
  heads.forEach(splitWords);
  const fades = [...root.querySelectorAll('.lead, .two > p, .how h3, .how p')];
  const nums = [...root.querySelectorAll('.numbers > div')];
  stagger(fades);
  stagger(nums);
  fades.forEach((el) => el.setAttribute('data-sm-fade', ''));
  nums.forEach((el) => el.setAttribute('data-sm-num', ''));

  const reveal = (el) => el.setAttribute('data-sm-in', '');
  if (reduced()) { [...heads, ...fades, ...nums].forEach(reveal); return; }

  // the hero headline lands right after the page appears
  const heroText = [...root.querySelectorAll('.hero-over .display, .hero-over .lead')];
  requestAnimationFrame(() => requestAnimationFrame(() => heroText.forEach(reveal)));

  // everything else when it scrolls into view (once)
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    reveal(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  [...heads, ...fades, ...nums].filter((el) => !heroText.includes(el) && !el.closest('.hero-over')).forEach((el) => io.observe(el));
  onCleanup(() => io.disconnect());
}

// ---------- spotlight: live 3D model per scene ----------
// Pin progress (0 = the pinned block entering at the bottom, 1 = leaving at the top) during which each scene can be seen.
// Matches the scene windows in styles.css. Only scenes inside their range hold a WebGL context.
const RANGES = [[-1, 0.43], [0.19, 0.63], [0.39, 0.83], [0.59, 2]];

export function bindSpotlight(root, theme) {
  const pin = root.querySelector('.spot-pin');
  if (!pin) return;
  const pinned = matchMedia('(min-width: 961px) and (prefers-reduced-motion: no-preference)').matches && CSS.supports('animation-timeline: view()');
  if (!pinned) return; // phones, reduced motion, older browsers: the plain kit cards with their pictures

  const scenes = [...pin.querySelectorAll('.kblock')].map((c) => ({ el: c.querySelector('.spot-viz'), kit: c.dataset.kit }));
  const live = scenes.map(() => null);
  let raf = 0;

  async function mount(i) {
    if (live[i]) return;
    live[i] = 'pending';
    const { el, kit } = scenes[i];
    const build = (await loadModels(kit))[FEATURE[kit]];
    if (live[i] !== 'pending') return; // scrolled away while loading
    const v = mountViewer(el, build, { step: 'last', autoRotate: true, overview: true, theme: theme(kit) });
    live[i] = v;
    if (v) el.classList.add('on');
  }
  function drop(i) {
    const v = live[i];
    live[i] = null;
    if (v && v !== 'pending') { v.dispose(); scenes[i].el.classList.remove('on'); }
  }
  function update() {
    raf = 0;
    const r = pin.getBoundingClientRect();
    const p = (innerHeight - r.top) / (r.height + innerHeight);
    const inside = p > 0 && p < 1;
    scenes.forEach((_, i) => {
      const [a, b] = RANGES[i];
      if (inside && p > a && p < b) mount(i); else drop(i);
    });
  }
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
  onCleanup(() => {
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
    cancelAnimationFrame(raf);
    scenes.forEach((_, i) => drop(i));
  });
}
