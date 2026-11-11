// 2. Stack. One wide card per row; each pins under the header and the next one slides over it,
// while the covered card shrinks back. Scroll-linked and reversible (CSS scroll-driven animations).
// Purpose: spatial consistency: the kits read as a deck of cards on a table.
import { whenRendered } from './shared.js';

export const css = `
@media (min-width: 961px) and (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) and (view-timeline-name: --a) {
    .stage-hero ~ section .kit-blocks { display: block; timeline-scope: --k1, --k2, --k3, --k4; }
    .stage-hero ~ section .kblock { position: sticky; top: calc(96px + var(--i) * 20px); grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); grid-template-rows: auto;
      height: min(460px, 68vh); margin-bottom: 28px; align-items: stretch; box-shadow: 0 -14px 40px rgba(23,22,26,.08); transform-origin: 50% 0; }
    .stage-hero ~ section .kblock .tile { aspect-ratio: auto; height: 100%; }
    .stage-hero ~ section .kb-txt { align-self: center; padding: 8px 40px; }
    .stage-hero ~ section .kb-txt h3 { font-size: clamp(34px, 3.6vw, 52px); }
    .stage-hero ~ section .kblock:nth-child(1) { --i: 0; view-timeline: --k1 block; animation: pv-away linear both; animation-timeline: --k2; animation-range: entry 10% cover 50%; }
    .stage-hero ~ section .kblock:nth-child(2) { --i: 1; view-timeline: --k2 block; animation: pv-away linear both; animation-timeline: --k3; animation-range: entry 10% cover 50%; }
    .stage-hero ~ section .kblock:nth-child(3) { --i: 2; view-timeline: --k3 block; animation: pv-away linear both; animation-timeline: --k4; animation-range: entry 10% cover 50%; }
    .stage-hero ~ section .kblock:nth-child(4) { --i: 3; view-timeline: --k4 block; }
    @keyframes pv-away { to { transform: scale(0.93); } } /* stays opaque so the card underneath never shows through */
  }
}
`;

export function setup(win, doc) {
  return whenRendered(doc, () => {});
}
