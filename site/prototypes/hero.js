// Landing-screen animation: the hero model plays a short story for each build.
//   Truss bridge  - weights stack up, a chord snaps, the bridge breaks into pieces, then rebuilds itself
//   Light sensor  - a lamp flashes and the LED answers it
//   Glider        - launches off the table, climbs, glides down to the tape measure, then fades back to the start
//   Water filter  - dirty water is poured in and the stopwatch runs while clean water drips through
// The animation code lives in hero-anim.js, which has to run inside the site's page (it wraps the site's own model builders).
export const css = '';

export function setup(win, doc) {
  let dead = false;
  (async () => {
    const mod = await win.Function('u', 'return import(u)')(new URL('prototypes/hero-anim.js', doc.baseURI).href);
    if (!dead) await mod.install(doc);
  })();
  return () => { dead = true; };
}
