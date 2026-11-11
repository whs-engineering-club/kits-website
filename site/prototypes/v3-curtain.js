// 3. Curtain. Axis: masks and wipes. Nothing fades: headings slide up out of a mask line by line (word by word),
// pictures are uncovered by a clip-path wipe while the picture settles, and hairlines draw across.
// Purpose: preventing a jarring change, with an editorial, architectural feel (the Nakagawa site).
import { TARGETS, reduced, whenRendered, stagger, revealOnce } from './shared.js';

export const css = `
.pv-m { display: inline-block; overflow: clip; vertical-align: top; padding: 0.1em 0.04em; margin: -0.1em -0.04em; }
.pv-m > span { display: inline-block; transform: translateY(112%); transition: transform 700ms var(--ease-out); transition-delay: calc(var(--w, 0) * 45ms); }
[data-in] .pv-m > span, .pv-m[data-in] > span { transform: none; }
/* the site styles ".big-copy span" and ".kb-txt span"; keep the mask spans neutral */
.big-copy .pv-m, .big-copy .pv-m > span, .kb-txt h3 .pv-m, .kb-txt h3 .pv-m > span { color: inherit; font-weight: inherit; }
.kb-txt h3 .pv-m { margin: -0.1em -0.04em; display: inline-block; }
.kb-txt h3 .pv-m > span { margin: 0; display: inline-block; }

/* pictures: wipe up from the bottom edge, picture counter-scales */
[data-pvt] { clip-path: inset(100% 0 0 0); transition: clip-path 900ms var(--ease-in-out); transition-delay: calc(var(--i, 0) * 90ms); }
[data-pvt] img.render, [data-pvt] > * { transform: scale(1.14); transition: transform 1100ms var(--ease-out); transition-delay: calc(var(--i, 0) * 90ms); }
[data-pvt][data-in] { clip-path: inset(0); }
[data-pvt][data-in] img.render, [data-pvt][data-in] > * { transform: none; }

/* text beside the pictures: short rise, no fade */
[data-pvx] { opacity: 0; transition: opacity 400ms ease-out; transition-delay: calc(var(--i, 0) * 70ms + 250ms); }
[data-pvx][data-in] { opacity: 1; }

/* section hairlines draw from the left */
.sec > .h2 { position: relative; }
.sec > .h2::after { content: ""; position: absolute; left: 0; right: 0; bottom: -14px; height: 1px; background: var(--ink); transform-origin: left; transform: scaleX(0); transition: transform 900ms var(--ease-in-out) 200ms; }
.sec > .h2[data-in]::after { transform: none; }

@media (prefers-reduced-motion: reduce) {
  .pv-m > span, [data-pvt], [data-pvt] img.render, [data-pvt] > *, .sec > .h2::after { transition: none; transform: none; clip-path: none; }
  [data-pvx] { opacity: 1; transition: none; }
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
    const heads = [...main.querySelectorAll('.display, .h1, .h2, .big-copy, .kb-txt h3')];
    heads.forEach((h) => splitWords(doc, h));
    const pics = [...main.querySelectorAll('.kblock .tile, .bcard .tile, .band-tile')];
    const txt = [...main.querySelectorAll('.kb-txt p, .kb-txt span, .bcard h3, .bcard p, .lead, .facts')];
    stagger(pics); stagger(txt);
    // Hide without a transition (nothing visibly wipes out before it wipes in).
    const hold = doc.createElement('style'); hold.textContent = '[data-pvt],[data-pvt] *,[data-pvx]{transition:none!important}'; doc.head.append(hold);
    pics.forEach((el) => el.setAttribute('data-pvt', ''));
    txt.forEach((el) => el.setAttribute('data-pvx', ''));
    void main.offsetHeight; hold.remove();
    // A fully clipped picture counts as not visible to IntersectionObserver, so watch each picture's parent instead.
    const byParent = new Map(pics.map((p) => [p.parentElement, p]));
    const watch = [...heads, ...byParent.keys(), ...txt, ...main.querySelectorAll(TARGETS)].filter((el) => !el.matches('.stage-hero *') || el.closest('.hero-over'));
    // After the wipe has played, give the pictures back to the site's own hover and press styles.
    const reveal = (node) => {
      const el = byParent.get(node) ?? node;
      el.setAttribute('data-in', '');
      if (el.hasAttribute('data-pvt') || el.hasAttribute('data-pvx')) setTimeout(() => ['data-pvt', 'data-pvx', 'data-in'].forEach((a) => el.removeAttribute(a)), 2200);
    };
    if (reduced(win)) { watch.forEach(reveal); return; }
    // the hero headline lands right after load
    win.requestAnimationFrame(() => win.requestAnimationFrame(() => main.querySelectorAll('.hero-over .display, .hero-over .lead, .hero-over .hero-row').forEach(reveal)));
    revealOnce(win, watch.filter((el) => !el.closest('.hero-over')), reveal);
  });
}
