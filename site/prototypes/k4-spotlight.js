// 4. Spotlight. The section pins full-bleed and the screen takes on one kit at a time: scrolling opens the next kit's colour
// as a circle growing from the bottom right and the new scene settles in from slightly zoomed. Scroll-linked and reversible.
// Purpose: preventing a jarring change: the kit colour carries you from one scene to the next instead of cutting.
import { whenRendered } from './shared.js';

export const css = `
@media (min-width: 961px) and (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .spot-pin { height: 420vh; view-timeline: --spot block; margin-top: 24px; }
    .spot-view { position: sticky; top: 0; height: 100vh; overflow: clip; margin-inline: calc(50% - 50vw); }
    .spot-view .kit-blocks { display: block; position: relative; height: 100%; }
    .spot-view .kblock { position: absolute; inset: 0; border-radius: 0; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); grid-template-rows: auto; align-items: center;
      padding: 68px max(32px, calc((100vw - 1240px) / 2 + 32px)) 0; column-gap: 24px; transform-origin: 82% 100%; }
    .spot-view .kblock .tile { order: 2; aspect-ratio: auto; height: min(640px, 70vh); background: transparent; }
    .spot-view .kb-txt { padding: 0; }
    .spot-view .kb-txt h3 { font-size: clamp(48px, 6.4vw, 96px); line-height: 0.95; letter-spacing: -0.05em; }
    .spot-view .kb-txt p { font-size: clamp(18px, 1.8vw, 24px); margin-top: 16px; max-width: 24ch; }
    .spot-view .kb-txt span { font-size: 18px; margin-top: 28px; }
    .spot-view .kblock:nth-child(n+2) { animation-timeline: --spot; animation-timing-function: linear; animation-fill-mode: both; }
    .spot-view .kblock:nth-child(2) { animation-name: pv-spot-2; }
    .spot-view .kblock:nth-child(3) { animation-name: pv-spot-3; }
    .spot-view .kblock:nth-child(4) { animation-name: pv-spot-4; }
    /* pinned from about 19% to 81%; each kit opens over a 14% window, then holds */
    @keyframes pv-spot-2 { 0%, 25% { clip-path: circle(0% at 82% 100%); transform: scale(1.06); } 39%, 100% { clip-path: circle(150% at 82% 100%); transform: none; } }
    @keyframes pv-spot-3 { 0%, 45% { clip-path: circle(0% at 82% 100%); transform: scale(1.06); } 59%, 100% { clip-path: circle(150% at 82% 100%); transform: none; } }
    @keyframes pv-spot-4 { 0%, 65% { clip-path: circle(0% at 82% 100%); transform: scale(1.06); } 79%, 100% { clip-path: circle(150% at 82% 100%); transform: none; } }
  }
}
`;

export function setup(win, doc) {
  return whenRendered(doc, (main) => {
    const grid = main.querySelector('.stage-hero ~ section .kit-blocks');
    if (!grid || grid.dataset.spot) return;
    grid.dataset.spot = '1';
    const pin = doc.createElement('div'); pin.className = 'spot-pin';
    const view = doc.createElement('div'); view.className = 'spot-view';
    grid.replaceWith(pin);
    view.append(grid);
    pin.append(view);
  });
}
