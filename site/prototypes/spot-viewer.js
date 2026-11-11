// Runs inside the site's own page (loaded into the preview frame), so it can reuse the site's 3D viewer and model loader.
// Gives each Spotlight scene a live, slowly turning 3D model. Only the scenes on screen (or about to be) hold a WebGL context;
// the rest are disposed, so there are never more than two running at once.
import { FEATURE, loadModels } from '../core.js';
import { mountViewer } from '../viewer.js';
import { plain } from './hero-anim.js'; // the Spotlight scenes keep the plain, unanimated models

const BG = { ece: 0xe6ecff, meche: 0xffe8da, aero: 0xdcf1ee, bme: 0xe3f1df }; // same as the site's kit tile colours
// Pin progress (0 = section entering at the bottom, 1 = leaving at the top) during which each scene can be seen.
const RANGES = [[-1, 0.43], [0.19, 0.63], [0.39, 0.83], [0.59, 2]];

export function attachViewers(scenes, pin) {
  const live = scenes.map(() => null);
  let raf = 0;
  const progress = () => {
    const r = pin.getBoundingClientRect();
    return (innerHeight - r.top) / (r.height + innerHeight);
  };
  async function mount(i) {
    if (live[i]) return;
    live[i] = 'pending';
    const { el, kit } = scenes[i];
    const models = await loadModels(kit);
    const build = plain(kit, FEATURE[kit], models);
    if (live[i] !== 'pending') return; // scrolled away while loading
    const v = mountViewer(el, build, { step: 'last', autoRotate: true, overview: true, theme: { bg: BG[kit], shadow: 0.14 } });
    live[i] = v;
    if (v) el.classList.add('on');
  }
  function drop(i) {
    const v = live[i];
    live[i] = null;
    if (v && v !== 'pending') { v.dispose(); scenes[i].el.classList.remove('on'); }
  }
  function update() {
    raf = 0;
    const p = progress();
    const inside = p > 0 && p < 1;
    scenes.forEach((_, i) => {
      const [a, b] = RANGES[i];
      if (inside && p > a && p < b) mount(i); else drop(i);
    });
  }
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
  return () => {
    removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll);
    cancelAnimationFrame(raf);
    scenes.forEach((_, i) => drop(i));
  };
}
