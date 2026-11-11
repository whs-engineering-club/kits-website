// 4. Spotlight. The section pins full-bleed and the screen takes on one kit at a time: scrolling opens the next kit's colour
// as a circle growing from the bottom right and the new scene settles in from slightly zoomed. Scroll-linked and reversible.
// Each scene has a big live 3D model that slowly turns, a short description on the left, and a counter + segmented progress line on top.
// Purpose: preventing a jarring change (the kit colour carries you from one scene to the next) and state indication (which kit, how many).
import { whenRendered } from './shared.js';

export const css = `
/* default (phones, reduced motion, no scroll-driven animation): the normal kit cards, plus the description */
.spot-bar, .spot-segs, .spot-viz { display: none; }
.spot-desc { margin-top: 10px; }
.spot-tags { list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.spot-tags li { padding: 5px 11px; border-radius: 999px; background: rgba(255,255,255,.7); color: var(--ki); font: 600 13px var(--sans); }

@media (min-width: 961px) and (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .spot-pin { height: 440vh; view-timeline: --spot block; margin-top: 24px; }
    .spot-view { --spad: max(32px, calc((100vw - 1240px) / 2 + 32px)); position: sticky; top: 0; height: 100vh; overflow: clip; margin-inline: calc(50% - 50vw); }
    .spot-view .kit-blocks { display: block; position: relative; height: 100%; }
    .spot-view .kblock { position: absolute; inset: 0; border-radius: 0; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); grid-template-rows: auto; align-items: center;
      padding: 156px 0 40px var(--spad); column-gap: 8px; transform-origin: 82% 100%; }

    /* the picture: much bigger, bleeding to the right edge of the screen */
    .spot-view .kblock .tile { order: 2; position: relative; aspect-ratio: auto; height: min(calc(100vh - 196px), 840px); background: transparent; overflow: visible; margin-right: 0; }
    .spot-view .tile img.render { opacity: 0; }
    .spot-viz { display: block; position: absolute; inset: 0 0 0 0; pointer-events: none; }
    .spot-viz canvas { display: block; width: 100%; height: 100%; pointer-events: none; opacity: 0; transform: scale(0.96); transition: opacity 600ms var(--ease-out), transform 800ms var(--ease-out); }
    .spot-viz.on canvas { opacity: 1; transform: none; }
    .spot-viz .viewer-labels { display: none; }

    /* the words */
    .spot-view .kb-txt { padding: 0; max-width: 470px; }
    .spot-view .kb-txt h3 { font-size: clamp(44px, 5.4vw, 84px); line-height: 0.98; letter-spacing: -0.05em; }
    .spot-sub { font-size: clamp(17px, 1.5vw, 21px); margin-top: 14px; max-width: none; color: var(--ink); font-weight: 600; }
    .spot-desc { font-size: clamp(16px, 1.3vw, 19px); line-height: 1.55; max-width: 36ch; color: var(--ink-2); }
    .spot-view .kb-txt span { font-size: 18px; margin-top: 26px; }

    /* counter + segmented progress along the top of the pinned screen */
    .spot-bar { display: flex; justify-content: space-between; align-items: baseline; position: absolute; top: 92px; left: var(--spad); right: var(--spad); z-index: 6; pointer-events: none; }
    .spot-eyebrow { font: 600 15px var(--sans); color: var(--ink-2); letter-spacing: -0.01em; }
    .spot-count { display: inline-flex; gap: 0.45em; font: 600 20px/1.25 var(--sans); color: var(--ink); font-variant-numeric: tabular-nums; }
    .spot-roll { display: inline-block; height: 1.25em; overflow: clip; }
    .spot-roll ul { margin: 0; padding: 0; list-style: none; animation: pv-roll linear both; animation-timeline: --spot; }
    .spot-roll li { height: 1.25em; }
    .spot-segs { display: flex; gap: 8px; position: absolute; top: 128px; left: var(--spad); right: var(--spad); z-index: 6; pointer-events: none; }
    .spot-segs i { position: relative; flex: 1; height: 3px; border-radius: 3px; overflow: hidden; background: color-mix(in srgb, var(--ink) 14%, transparent); }
    .spot-segs i::after { content: ""; position: absolute; inset: 0; background: var(--ink); transform-origin: left; transform: scaleX(0); }
    .spot-segs i:nth-child(1)::after { transform: none; }
    .spot-segs i:nth-child(n+2)::after { animation: linear both; animation-timeline: --spot; }
    .spot-segs i:nth-child(2)::after { animation-name: pv-seg-2; }
    .spot-segs i:nth-child(3)::after { animation-name: pv-seg-3; }
    .spot-segs i:nth-child(4)::after { animation-name: pv-seg-4; }

    /* scenes 2-4 open as a circle over the previous one */
    .spot-view .kblock:nth-child(n+2) { animation-timeline: --spot; animation-timing-function: linear; animation-fill-mode: both; }
    .spot-view .kblock:nth-child(2) { animation-name: pv-spot-2; }
    .spot-view .kblock:nth-child(3) { animation-name: pv-spot-3; }
    .spot-view .kblock:nth-child(4) { animation-name: pv-spot-4; }
    /* pinned from about 19% to 81% of the way through; each kit opens over a 14% window, then holds. Counter and segments use the same windows. */
    @keyframes pv-spot-2 { 0%, 25% { clip-path: circle(0% at 82% 100%); transform: scale(1.06); } 39%, 100% { clip-path: circle(150% at 82% 100%); transform: none; } }
    @keyframes pv-spot-3 { 0%, 45% { clip-path: circle(0% at 82% 100%); transform: scale(1.06); } 59%, 100% { clip-path: circle(150% at 82% 100%); transform: none; } }
    @keyframes pv-spot-4 { 0%, 65% { clip-path: circle(0% at 82% 100%); transform: scale(1.06); } 79%, 100% { clip-path: circle(150% at 82% 100%); transform: none; } }
    @keyframes pv-seg-2 { 0%, 25% { transform: scaleX(0); } 39%, 100% { transform: scaleX(1); } }
    @keyframes pv-seg-3 { 0%, 45% { transform: scaleX(0); } 59%, 100% { transform: scaleX(1); } }
    @keyframes pv-seg-4 { 0%, 65% { transform: scaleX(0); } 79%, 100% { transform: scaleX(1); } }
    @keyframes pv-roll { 0%, 25% { transform: translateY(0); } 39%, 45% { transform: translateY(-1.25em); } 59%, 65% { transform: translateY(-2.5em); } 79%, 100% { transform: translateY(-3.75em); } }
  }
}
`;

export function setup(win, doc) {
  const disposers = [];
  const stop = whenRendered(doc, async (main) => {
    const grid = main.querySelector('.stage-hero ~ section .kit-blocks');
    if (!grid || grid.dataset.spot) return;
    grid.dataset.spot = '1';
    const sec = grid.closest('section');
    const cards = [...grid.children];
    const label = sec.querySelector('.h2')?.getAttribute('aria-label') || 'Choose your kind of engineering';

    // a short description under each kit's name: its tagline and the first few ideas it covers
    const kits = win.KITS_DATA.kits;
    cards.forEach((c) => {
      const kit = kits.find((k) => c.getAttribute('href').endsWith(`/${k.id}`));
      const txt = c.querySelector('.kb-txt');
      txt.querySelector('p').className = 'spot-sub';
      if (!kit) return;
      const d = doc.createElement('p'); d.className = 'spot-desc'; d.textContent = kit.tagline;
      const tags = doc.createElement('ul'); tags.className = 'spot-tags'; tags.setAttribute('aria-label', 'Ideas covered');
      kit.concepts.slice(0, 4).forEach((t) => { const li = doc.createElement('li'); li.textContent = t; tags.append(li); });
      txt.querySelector('.spot-sub').after(d, tags);
      c.dataset.kit = kit.id;
    });

    const pin = doc.createElement('div'); pin.className = 'spot-pin';
    const view = doc.createElement('div'); view.className = 'spot-view';
    const bar = doc.createElement('div'); bar.className = 'spot-bar'; bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = `<span class="spot-eyebrow">${label}</span><span class="spot-count"><span class="spot-roll"><ul>${cards.map((_, i) => `<li>0${i + 1}</li>`).join('')}</ul></span><span>/ 0${cards.length}</span></span>`;
    const segs = doc.createElement('div'); segs.className = 'spot-segs'; segs.setAttribute('aria-hidden', 'true');
    segs.innerHTML = cards.map(() => '<i></i>').join('');
    grid.replaceWith(pin);
    view.append(bar, segs, grid);
    pin.append(view);

    // live 3D model in each scene (only where the pinned layout runs)
    const pinned = win.matchMedia('(min-width: 961px) and (prefers-reduced-motion: no-preference)').matches && win.CSS.supports('animation-timeline: view()');
    if (!pinned) return;
    const scenes = cards.filter((c) => c.dataset.kit).map((c) => {
      const el = doc.createElement('div'); el.className = 'spot-viz viewer';
      c.querySelector('.tile').append(el);
      return { el, kit: c.dataset.kit };
    });
    // the viewer module has to run in the site's page, not this one, so it can use that page's three.js and models
    const mod = await win.Function('u', 'return import(u)')(new URL('prototypes/spot-viewer.js', doc.baseURI).href);
    disposers.push(mod.attachViewers(scenes, pin));
  });
  return () => { stop(); disposers.forEach((d) => d()); };
}
