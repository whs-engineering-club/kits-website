// 4. Depth. Axis: layers and pinning. The hero is pinned while the page slides over it, the kit blocks stack
// like a deck of cards (each one shrinks back as the next covers it), and the three "how" cards parallax at different speeds.
// Purpose: spatial consistency: the page reads as a stack of surfaces, not a flat scroll.
import { whenRendered } from './shared.js';

export const css = `
@supports (animation-timeline: view()) {
  /* pinned hero: the section stays, the next one slides over it */
  .stage-hero { position: sticky; top: 0; z-index: 0; }
  /* every later section gets a full-bleed paper background so it covers the pinned hero */
  .stage-hero ~ section { position: relative; z-index: 1; background: var(--bg); box-shadow: 0 0 0 100vmax var(--bg); clip-path: inset(0 -100vmax); }
  #mission { padding-bottom: 8px; }
  .stage-hero .hero-over { animation: pv-hero-out linear both; animation-timeline: scroll(root); animation-range: 0 60vh; }
  @keyframes pv-hero-out { to { opacity: 0; transform: translateY(-40px) scale(0.98); } }
  .stage-hero [data-hero-viewer] { animation: pv-hero-back linear both; animation-timeline: scroll(root); animation-range: 0 100vh; }
  @keyframes pv-hero-back { to { transform: scale(0.9) translateY(-30px); opacity: 0.5; } }
}

/* kit blocks: one wide card per row, stacking as you go */
@supports (animation-timeline: view()) and (view-timeline-name: --a) {
  @media (min-width: 961px) {
    .kit-blocks { display: block; timeline-scope: --k1, --k2, --k3, --k4; }
    .kblock { position: sticky; top: calc(96px + var(--i) * 20px); grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); grid-template-rows: auto;
      height: min(460px, 68vh); margin-bottom: 28px; align-items: stretch; box-shadow: 0 -14px 40px rgba(23,22,26,.08); transform-origin: 50% 0; }
    .kblock .tile { aspect-ratio: auto; height: 100%; }
    .kb-txt { align-self: center; padding: 8px 40px; }
    .kb-txt h3 { font-size: clamp(34px, 3.6vw, 52px); }
    .kblock:nth-child(1) { --i: 0; view-timeline: --k1 block; animation: pv-away linear both; animation-timeline: --k2; animation-range: entry 10% cover 50%; }
    .kblock:nth-child(2) { --i: 1; view-timeline: --k2 block; animation: pv-away linear both; animation-timeline: --k3; animation-range: entry 10% cover 50%; }
    .kblock:nth-child(3) { --i: 2; view-timeline: --k3 block; animation: pv-away linear both; animation-timeline: --k4; animation-range: entry 10% cover 50%; }
    .kblock:nth-child(4) { --i: 3; view-timeline: --k4 block; }
    @keyframes pv-away { to { transform: scale(0.93); } } /* stays opaque so the card underneath never shows through */
  }

  /* "how a unit runs": columns travel at different speeds, then line up */
  .how > div { animation: pv-lag linear backwards; animation-timeline: view(); animation-range: entry 0% cover 45%; }
  .how > div:nth-child(1) { --lag: 40px; } .how > div:nth-child(2) { --lag: 110px; } .how > div:nth-child(3) { --lag: 180px; }
  @keyframes pv-lag { from { transform: translateY(var(--lag)); opacity: 0; } }

  /* section titles slide in from the side as they cross the lower half */
  .sec > .h2 { animation: pv-slide linear backwards; animation-timeline: view(); animation-range: entry 0% entry 80%; }
  @keyframes pv-slide { from { transform: translateX(-48px); opacity: 0; } }
}
@media (prefers-reduced-motion: reduce) {
  .stage-hero { position: relative; }
  .stage-hero .hero-over, .stage-hero [data-hero-viewer], .kblock, .how > div, .sec > .h2 { animation: none !important; }
  .kblock { position: relative; top: auto; }
}
`;

export function setup(win, doc) {
  return whenRendered(doc, () => {});
}
