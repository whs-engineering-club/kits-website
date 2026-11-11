// 1. Rise. Axis: triggered, one-shot. Things lift into place once, staggered, as you reach them.
// Purpose: preventing a jarring change (content doesn't just exist below the fold, it arrives).
import { TARGETS, reduced, whenRendered, stagger, revealOnce } from './shared.js';

export const css = `
[data-pv] { opacity: 0; transform: translateY(28px);
  transition: opacity 520ms var(--ease-out), transform 620ms var(--ease-out);
  transition-delay: calc(var(--i, 0) * 70ms); }
[data-pv="init"] { transition: none; }
[data-pv][data-in] { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  [data-pv] { transform: none; transition: opacity 200ms ease; transition-delay: 0ms; }
}
`;

export function setup(win, doc) {
  return whenRendered(doc, (main) => {
    const hero = [...main.querySelectorAll('.stage-hero .display, .stage-hero .lead, .stage-hero .hero-row')];
    const rest = [...main.querySelectorAll(TARGETS)];
    [hero, rest].forEach(stagger);
    const all = [...hero, ...rest];
    // Hide without a transition first, so nothing visibly fades out before it fades in.
    all.forEach((el) => el.setAttribute('data-pv', 'init'));
    void main.offsetHeight;
    all.forEach((el) => el.setAttribute('data-pv', ''));
    // Once an item has arrived, hand its transform/transition back to the site's own hover and press styles.
    const done = (e) => {
      if (e.target !== e.currentTarget || e.propertyName !== 'transform' || !e.target.hasAttribute('data-in')) return;
      e.target.removeAttribute('data-pv'); e.target.removeAttribute('data-in'); e.target.style.removeProperty('--i');
    };
    all.forEach((el) => el.addEventListener('transitionend', done));
    // Hero comes in on load; everything else when it scrolls into view.
    win.requestAnimationFrame(() => win.requestAnimationFrame(() => hero.forEach((el) => el.setAttribute('data-in', ''))));
    if (reduced(win)) { rest.forEach((el) => el.setAttribute('data-in', '')); return; }
    revealOnce(win, rest, (el) => el.setAttribute('data-in', ''));
  });
}
