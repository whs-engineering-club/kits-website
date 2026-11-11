// Prototype-only helpers shared by the four scroll-animation variants.
// Nothing in the real site imports from /prototypes.

// One font for every variant: Space Grotesk (from mijobello.com). The variants differ in motion, not type.
export const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap';
export const BASE_CSS = `
body { --sans: "Space Grotesk", system-ui, sans-serif; --display: "Space Grotesk", system-ui, sans-serif; --mono: "Space Grotesk", sans-serif;
  --display-weight: 600; --display-track: -0.04em; }
.display, .h1, .h2 { font-variation-settings: normal; }
.display { line-height: 1; }
.big-copy, .kb-txt h3, .how h3, .numbers b, .brand, .btn, .seg button { letter-spacing: -0.03em; }
`;

// Things that scroll into view. Grid children get --i (their index among siblings) for stagger.
export const TARGETS = [
  '.big-copy', '.numbers > div', '.two > p', '.fine', '.sec > .h2', '.kblock', '.how > div', '.faq details',
  '.bcard', '.bonus > div', '.buy > div', '.weeks details', '.concepts', '.lesson', '.kit-band .band-in > *',
].join(', ');

export const reduced = (win) => win.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Run `bind(main)` now and again every time the router swaps the page content.
export function whenRendered(doc, bind) {
  const main = doc.getElementById('main');
  let queued = false;
  const run = () => { queued = false; bind(main); };
  const mo = new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(run); } });
  mo.observe(main, { childList: true });
  run();
  return () => mo.disconnect();
}

export function stagger(els) {
  const seen = new Map();
  els.forEach((el) => {
    const p = el.parentElement;
    const n = seen.get(p) ?? 0;
    seen.set(p, n + 1);
    el.style.setProperty('--i', Math.min(n, 6));
  });
}

// Reveal-once observer. onIn(el) is called the first time an element is 12% visible.
export function revealOnce(win, els, onIn) {
  const io = new win.IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); onIn(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
