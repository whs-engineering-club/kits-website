// The shared base for round two: everything the user liked, minus the kit section (each variant owns that).
//  - Curtain: headings and the mission paragraph slide up out of a mask word by word, lead copy fades in,
//    the stat numbers rise into their cards (then the site's own count-up runs), and a hairline draws under every section title
//    (including "How a unit runs" and "Questions").
//  - Depth: the hero is pinned while the next section slides over it, and the "How a unit runs" columns arrive at different speeds.
import { reduced, whenRendered, stagger, revealOnce } from './shared.js';

export const css = `
/* ---- Curtain: word masks ---- */
.pv-m { display: inline-block; overflow: clip; vertical-align: top; padding: 0.1em 0.04em; margin: -0.1em -0.04em; }
.pv-m > span { display: inline-block; transform: translateY(112%); transition: transform 700ms var(--ease-out); transition-delay: calc(var(--w, 0) * 45ms); }
[data-in] .pv-m > span { transform: none; }
.big-copy .pv-m, .big-copy .pv-m > span { color: inherit; font-weight: inherit; } /* the site styles ".big-copy span" grey */

/* ---- Curtain: lead copy fades in after its headline ---- */
[data-pvx] { opacity: 0; transition: opacity 420ms ease-out; transition-delay: calc(var(--i, 0) * 70ms + 220ms); }
[data-pvx][data-in] { opacity: 1; }

/* ---- Curtain: numbers rise into their cards ---- */
.numbers > div { overflow: clip; }
[data-pvn] b { transform: translateY(118%); transition: transform 760ms var(--ease-out); transition-delay: calc(var(--i, 0) * 90ms); }
[data-pvn][data-in] b { transform: none; }

/* ---- Curtain: hairline under every section title ---- */
.sec .h2 { position: relative; }
.sec .h2::after { content: ""; position: absolute; left: 0; right: 0; bottom: -14px; height: 1px; background: var(--ink); transform-origin: left; transform: scaleX(0); transition: transform 900ms var(--ease-in-out) 200ms; }
.sec .h2[data-in]::after { transform: none; }

/* ---- Depth: pinned hero, page slides over it; "how" columns at different speeds ---- */
html, body { overflow-x: clip; } /* full-bleed pinned scenes use 100vw, which is a few px wider than the page when a scrollbar shows */
@supports (animation-timeline: view()) {
  .stage-hero { position: sticky; top: 0; z-index: 0; }
  .stage-hero ~ section { position: relative; z-index: 1; background: var(--bg); box-shadow: 0 0 0 100vmax var(--bg); clip-path: inset(0 -100vmax); }
  #mission { padding-bottom: 8px; }
  .stage-hero .hero-over { animation: pv-hero-out linear both; animation-timeline: scroll(root); animation-range: 0 60vh; }
  @keyframes pv-hero-out { to { opacity: 0; transform: translateY(-40px) scale(0.98); } }
  .stage-hero [data-hero-viewer] { animation: pv-hero-back linear both; animation-timeline: scroll(root); animation-range: 0 100vh; }
  @keyframes pv-hero-back { to { transform: scale(0.9) translateY(-30px); opacity: 0.5; } }
}
@supports (animation-timeline: view()) {
  .how > div { animation: pv-lag linear backwards; animation-timeline: view(); animation-range: entry 0% cover 45%; }
  .how > div:nth-child(1) { --lag: 40px; } .how > div:nth-child(2) { --lag: 110px; } .how > div:nth-child(3) { --lag: 180px; }
  @keyframes pv-lag { from { transform: translateY(var(--lag)); opacity: 0; } }
}

@media (prefers-reduced-motion: reduce) {
  .pv-m > span, [data-pvn] b, .sec .h2::after { transition: none; transform: none; }
  [data-pvx] { opacity: 1; transition: none; }
  .stage-hero { position: relative; }
  .stage-hero .hero-over, .stage-hero [data-hero-viewer], .how > div { animation: none !important; }
}
`;

function splitWords(doc, el) {
  if (el.hasAttribute('data-split')) return;
  el.setAttribute('data-split', '');
  el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
  let w = 0;
  const walk = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = doc.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((t) => {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.append(t); return; }
        const m = doc.createElement('span'); m.className = 'pv-m'; m.setAttribute('aria-hidden', 'true');
        const s = doc.createElement('span'); s.style.setProperty('--w', Math.min(w++, 14)); s.textContent = t;
        m.append(s); frag.append(m);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1) walk(n);
  });
  walk(el);
}

export function setup(win, doc) {
  return whenRendered(doc, (main) => {
    const heads = [...main.querySelectorAll('.display, .h1, .h2, .big-copy')];
    heads.forEach((h) => splitWords(doc, h));
    const lead = [...main.querySelectorAll('.lead, .two > p, .how h3, .how p')];
    const nums = [...main.querySelectorAll('.numbers > div')];
    stagger(lead); stagger(nums);
    // Hide without a transition first, so nothing visibly slides out before it slides in.
    const hold = doc.createElement('style');
    hold.textContent = '[data-pvx],[data-pvn],[data-pvn] b{transition:none!important}';
    doc.head.append(hold);
    lead.forEach((el) => el.setAttribute('data-pvx', ''));
    nums.forEach((el) => el.setAttribute('data-pvn', ''));
    void main.offsetHeight; hold.remove();

    const reveal = (el) => el.setAttribute('data-in', '');
    const watch = [...heads, ...lead, ...nums].filter((el) => !el.closest('.hero-over'));
    if (reduced(win)) { [...heads, ...lead, ...nums].forEach(reveal); return; }
    // the hero headline lands right after load
    win.requestAnimationFrame(() => win.requestAnimationFrame(() => main.querySelectorAll('.hero-over .display, .hero-over .lead').forEach(reveal)));
    revealOnce(win, watch, reveal);
  });
}
