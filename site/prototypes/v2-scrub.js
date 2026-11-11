// 2. Scrub. Axis: scroll-linked, reversible. The page is the playhead: nothing runs on a clock,
// everything is tied 1:1 to scroll position (CSS scroll-driven animations, off the main thread).
// Purpose: state indication / explanation: reading the mission paragraph literally fills in as you read.
import { TARGETS, whenRendered, stagger } from './shared.js';

export const css = `
.pv-progress { position: fixed; left: 0; right: 0; top: 0; height: 3px; z-index: 60; background: var(--accent); transform-origin: left; transform: scaleX(0); pointer-events: none; }
.pv-w { display: inline; }
.big-copy .pv-w { color: inherit; font-weight: inherit; } /* the site styles ".big-copy span" grey; keep the original split */
@supports (animation-timeline: view()) {
  .pv-progress { animation: pv-grow linear both; animation-timeline: scroll(root); }
  @keyframes pv-grow { to { transform: scaleX(1); } }

  /* cards and blocks rise and settle while they enter the viewport; 'backwards' hands the transform back to hover/press afterwards */
  [data-pv] { animation: pv-settle linear backwards; animation-timeline: view(); animation-range: entry 0% entry 70%; }
  @keyframes pv-settle { from { opacity: 0; transform: translateY(72px) scale(0.96); } }

  /* the mission paragraph fills in word by word, in reading order */
  .pv-w { animation: pv-ink linear both; animation-timeline: view(); animation-range: cover 12% cover 38%; }
  @keyframes pv-ink { from { opacity: 0.16; } }

  /* hero: copy drifts up and fades, the model sinks slower (parallax) */
  .stage-hero .hero-over { animation: pv-hero-out linear both; animation-timeline: scroll(root); animation-range: 0 55vh; }
  @keyframes pv-hero-out { to { opacity: 0; transform: translateY(-56px); } }
  .stage-hero [data-hero-viewer] { animation: pv-hero-sink linear both; animation-timeline: scroll(root); animation-range: 0 90vh; }
  @keyframes pv-hero-sink { to { transform: translateY(110px) scale(1.06); } }
}
@media (prefers-reduced-motion: reduce) {
  .pv-progress { display: none; }
  [data-pv], .pv-w, .stage-hero .hero-over, .stage-hero [data-hero-viewer] { animation: none !important; }
}
`;

export function setup(win, doc) {
  const bar = doc.createElement('div');
  bar.className = 'pv-progress';
  doc.body.append(bar);
  const stop = whenRendered(doc, (main) => {
    const els = [...main.querySelectorAll(TARGETS)].filter((el) => !el.matches('.big-copy'));
    stagger(els);
    els.forEach((el) => el.setAttribute('data-pv', ''));
    main.querySelectorAll('.big-copy:not([data-split])').forEach((p) => {
      p.setAttribute('data-split', '');
      p.setAttribute('aria-label', p.textContent.trim().replace(/\s+/g, ' '));
      const walk = (node) => [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.append(t); return; }
            const s = doc.createElement('span'); s.className = 'pv-w'; s.setAttribute('aria-hidden', 'true'); s.textContent = t; frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
      walk(p);
    });
  });
  return () => { stop(); bar.remove(); };
}
