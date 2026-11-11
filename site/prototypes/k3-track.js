// 3. Track. The kits sit on a horizontal strip. The section pins, and scrolling down pulls the strip sideways one card at a time.
// A thin line along the bottom shows how far along you are. Scroll-linked and reversible.
// Purpose: state indication: you are moving through a sequence, and you can see how much is left.
import { whenRendered } from './shared.js';

export const css = `
/* default (phones, reduced motion, no scroll-driven animation): a swipeable row */
.track-view .kit-blocks { display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; scrollbar-width: none; }
.track-view .kblock { flex: 0 0 min(86vw, 520px); scroll-snap-align: start; }
.track-prog { display: none; }

@media (min-width: 961px) and (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .track-pin { height: 420vh; view-timeline: --trk block; margin-top: 24px; }
    .track-view { position: sticky; top: 0; height: 100vh; overflow: clip; display: flex; align-items: center; padding-top: 68px; margin-inline: calc(50% - 50vw); }
    .track-view .kit-blocks { overflow: visible; scroll-snap-type: none; padding-bottom: 0; gap: 32px; padding-inline: max(32px, calc((100vw - 1240px) / 2 + 32px)); will-change: transform;
      animation: pv-track linear both; animation-timeline: --trk; }
    .track-view .kblock { flex: 0 0 min(1080px, 80vw); height: min(560px, 66vh); grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); grid-template-rows: auto; align-items: stretch; }
    .track-view .kblock .tile { aspect-ratio: auto; height: 100%; }
    .track-view .kb-txt { align-self: center; padding: 8px 44px; }
    .track-view .kb-txt h3 { font-size: clamp(34px, 3.8vw, 56px); }
    /* the section is 420vh tall inside a 100vh window: it is pinned from about 19% to 81% of the way through */
    @keyframes pv-track { 0%, 19% { transform: translateX(0); } 81%, 100% { transform: translateX(calc(-3 * (min(1080px, 80vw) + 32px))); } }
    .track-prog { display: block; position: absolute; left: max(32px, calc((100vw - 1240px) / 2 + 32px)); right: max(32px, calc((100vw - 1240px) / 2 + 32px)); bottom: 36px; height: 3px; background: var(--line); border-radius: 3px; overflow: hidden; }
    .track-prog i { display: block; height: 100%; background: var(--ink); transform-origin: left; transform: scaleX(0); animation: pv-prog linear both; animation-timeline: --trk; }
    @keyframes pv-prog { 0%, 19% { transform: scaleX(0.25); } 81%, 100% { transform: scaleX(1); } }
  }
}
`;

export function setup(win, doc) {
  return whenRendered(doc, (main) => {
    const grid = main.querySelector('.stage-hero ~ section .kit-blocks');
    if (!grid || grid.dataset.track) return;
    grid.dataset.track = '1';
    const pin = doc.createElement('div'); pin.className = 'track-pin';
    const view = doc.createElement('div'); view.className = 'track-view';
    const prog = doc.createElement('div'); prog.className = 'track-prog'; prog.innerHTML = '<i></i>';
    grid.replaceWith(pin);
    view.append(grid, prog);
    pin.append(view);
  });
}
