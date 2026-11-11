// Page templates. Each kit has its own colour (tile + ink) that follows it into tiles,
// headers and the 3D background. Pictures carry a view-transition-name so they glide
// between pages; build steps are one card at a time that you can drag or flick.
import { KITS, STATS, COPY, HERO, FEATURE, PLANS, CURRICULUM, B, esc, shortTitle, store, details, setPages, route, bindHero, bindJumps, bindBuild, reduced } from './core.js';

const KC = {
  ece: { tile: '#E6ECFF', hex: 0xe6ecff, ink: '#3451C7' },
  meche: { tile: '#FFE8DA', hex: 0xffe8da, ink: '#B93D0B' },
  aero: { tile: '#DCF1EE', hex: 0xdcf1ee, ink: '#0B6E80' },
  bme: { tile: '#E3F1DF', hex: 0xe3f1df, ink: '#237A38' },
};
const theme = (kitId) => ({ bg: KC[kitId]?.hex ?? 0xf3f1ec, shadow: 0.14 });
const kvars = (id) => `--kc:${KC[id].tile};--ki:${KC[id].ink}`;
const pic = (name) => B.vt(name);
const sections = [['builds', 'Builds'], ['materials', 'Materials'], ['concepts', 'Concepts'], ['bonus', 'Bonus builds'], ['plan', 'Lesson plan']];

// ---------- build page: one card per step ----------
const stepCard = (k, p) => `
  <div class="steps-col focus-col">
    <div class="pips" role="group" aria-label="Steps">${p.steps.map((s, j) => `<button data-step="${j + 1}" aria-label="Step ${j + 1}">${j + 1}</button>`).join('')}</div>
    <div class="fcard-wrap"><article class="fcard" data-fcard aria-live="polite">
      <p class="fno">Step ${B.count(p)}</p><p class="fstep" data-ftext>${esc(p.steps[0])}</p><p class="fdetail" data-fdetail>${esc(details(k, p)[0] ?? '')}</p>
    </article></div>
    <div class="stepnav"><span class="hint-s">Drag the card, or use the buttons</span>${B.stepbtns()}</div>
    <details class="all"><summary>All ${p.steps.length} steps</summary>${B.steplist(p, k)}</details>
  </div>`;

// Drag the step card: it follows the pointer 1:1, resists past the first/last step
// (rubber-band), and a flick commits on velocity, not just distance.
function bindDrag(root, p, getCtl) {
  const card = root.querySelector('[data-fcard]');
  const rubber = (x, d, c = 0.55) => (x * d * c) / (d + c * Math.abs(x));
  let drag = null;
  card.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    card.setPointerCapture(e.pointerId);
    card.style.transition = 'none';
    drag = { x0: e.clientX, dx: 0, hist: [{ x: e.clientX, t: e.timeStamp }] };
  });
  card.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const ctl = getCtl();
    let dx = e.clientX - drag.x0;
    if ((dx > 0 && ctl.step === 1) || (dx < 0 && ctl.step === p.steps.length)) dx = rubber(dx, card.clientWidth);
    drag.dx = dx;
    drag.hist.push({ x: e.clientX, t: e.timeStamp }); if (drag.hist.length > 5) drag.hist.shift();
    card.style.transform = `translateX(${dx}px) rotate(${dx * 0.02}deg)`;
  });
  const end = () => {
    if (!drag) return;
    const { dx, hist } = drag; drag = null;
    const a = hist[0]; const b = hist[hist.length - 1];
    const v = (b.x - a.x) / Math.max(1, b.t - a.t);
    const w = card.clientWidth; const ctl = getCtl();
    card.style.transition = '';
    if ((dx < -w * 0.25 || v < -0.45) && ctl.step < p.steps.length) ctl.show(ctl.step + 1, 'swipe-next');
    else if ((dx > w * 0.25 || v > 0.45) && ctl.step > 1) ctl.show(ctl.step - 1, 'swipe-prev');
    else card.style.transform = ''; // settle back from where it was released
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', end);
}

function cardPainter(root, k, p) {
  const card = root.querySelector('[data-fcard]');
  const text = root.querySelector('[data-ftext]');
  const det = root.querySelector('[data-fdetail]');
  let last = 1;
  return (s, how) => {
    text.textContent = p.steps[s - 1];
    det.textContent = details(k, p)[s - 1] ?? '';
    // Spatial consistency: the next step comes in from the right, the previous from the left.
    const dir = how === 'swipe-next' ? 1 : how === 'swipe-prev' ? -1 : how === 'click' ? Math.sign(s - last) : 0;
    last = s;
    card.style.transform = '';
    if (dir && !reduced()) {
      card.animate([{ transform: `translateX(${dir * 48}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 260, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    }
  };
}

const pages = {
  vt: 'morph',
  theme,
  top: (ctx) => `
    <header class="top"><div class="wrap top-in">
      <a class="brand" href="#/"><img src="logo.png" alt="" width="583" height="494"><span>WHS Engineering Club</span></a>
      <nav aria-label="Main">
        <a href="#/" ${ctx.nav === 'home' ? 'aria-current="page"' : ''}>Home</a>
        <a href="#/kits" ${ctx.nav === 'kits' ? 'aria-current="page"' : ''}>Kits</a>
        <a href="#/about" ${ctx.nav === 'about' ? 'aria-current="page"' : ''}>About</a>
      </nav>
      <a class="btn" href="#/kits">Pick a kit</a></div></header>`,
  bottom: () => `
    <footer class="foot"><div class="wrap foot-in">
      <p>Made by the WHS Engineering Club for Title I classrooms. <a href="https://github.com/whs-engineering-club/kits-website" target="_blank" rel="noopener">GitHub</a></p>
    </div></footer>`,

  home: () => ({
    html: `
    <section class="stage-hero" data-hero-stage style="${kvars(HERO[0][0])}">
      <div data-hero-viewer></div>
      <div class="wrap hero-over">
        <h1 class="display">Engineering for every kid, not just the ones with a lab.</h1>
        <p class="lead">Four low-cost kits for Title I classrooms. A bag of parts for each student, a plan for every week, and a 3D model for every step of every build.</p>
        <div class="hero-row">
          <a class="btn big" href="#/kits">Pick a kit</a>
          <div class="seg" data-hero-chips role="group" aria-label="Featured build">${HERO.map(([k, p, l], i) => `<button aria-pressed="${i === 0}" data-k="${k}" data-p="${p}" style="${kvars(k)}">${l}</button>`).join('')}</div>
          <a class="open" data-hero-open href="#/kits/meche/bridge">Open this build →</a>
        </div>
      </div>
    </section>

    <section class="wrap sec" id="mission">
      <p class="big-copy">${esc(COPY.mission)} <span>${esc(COPY.missionMore)}</span></p>
      <div class="numbers">
        <div><b data-countup="${STATS.kits}">${STATS.kits}</b>kits</div><div><b data-countup="${STATS.builds}">${STATS.builds}</b>builds</div>
        <div><b data-countup="${STATS.steps}">${STATS.steps}</b>steps in 3D</div><div><b data-countup="${STATS.bonus}">${STATS.bonus}</b>bonus lessons</div>
      </div>
      <div class="two"><p>${esc(COPY.kitsPara)}</p><p>${esc(COPY.clubPara)}</p></div>
      <p class="fine">${esc(COPY.costNote)}</p>
    </section>

    <section class="wrap sec">
      <h2 class="h2">Choose your kind of engineering</h2>
      <div class="kit-blocks">${KITS.map((k) => `
        <a class="kblock" href="#/kits/${k.id}" style="${kvars(k.id)}">
          <div class="tile" ${pic(`pic-${k.id}`)}>${B.render(k.id, FEATURE[k.id])}</div>
          <div class="kb-txt"><h3>${esc(k.short)}</h3><p>${esc(k.subject)}</p><span>${k.projects.length} builds · ${k.weeks.length} weeks →</span></div>
        </a>`).join('')}</div>
    </section>

    <section class="wrap sec"><h2 class="h2">How a unit runs</h2>
      <div class="how">${COPY.how.map(([t, d], i) => `<div style="${kvars(KITS[i].id)}"><span class="n">${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
    </section>
    <section class="wrap sec narrow"><h2 class="h2">Questions</h2>${B.faq()}</section>`,
    after: (root) => {
      bindHero(root, theme);
      const stage = root.querySelector('[data-hero-stage]');
      root.querySelector('[data-hero-chips]').addEventListener('click', (e) => {
        const c = e.target.closest('[data-k]');
        if (c) stage.setAttribute('style', kvars(c.dataset.k)); // stage colour eases to the new kit
      });
    },
  }),

  kits: () => ({
    title: 'Kits',
    html: `<div class="wrap">${B.crumbs([['Home', '#/'], ['Kits']])}<h1 class="h1 page-title">Choose a kit</h1>
      <div class="kit-blocks">${KITS.map((k) => `
        <a class="kblock" href="#/kits/${k.id}" style="${kvars(k.id)}"><div class="tile" ${pic(`pic-${k.id}`)}>${B.render(k.id, FEATURE[k.id])}</div>
          <div class="kb-txt"><h3>${esc(k.short)}</h3><p>${esc(k.tagline)}</p><span>${k.projects.length} builds · ${k.studentKit.length} parts · ${k.weeks.length} weeks →</span></div></a>`).join('')}</div></div>`,
  }),

  kit: (k) => ({
    title: `${k.short} kit`,
    html: `
    <div class="kit-band" style="${kvars(k.id)}"><div class="wrap band-in">
      <div>${B.crumbs([['Home', '#/'], ['Kits', '#/kits'], [k.short]])}<h1 class="h1">${esc(k.subject)}</h1><p class="lead">${esc(k.tagline)}</p>
        <p class="facts"><span>${k.projects.length} builds</span><span>${k.weeks.length} weeks</span>${k.cost ? `<span>${esc(k.cost.replace(/^Student kit: around /, ''))} per kit</span>` : ''}</p></div>
      <div class="tile band-tile" ${pic(`pic-${k.id}`)}>${B.render(k.id, FEATURE[k.id])}</div></div></div>
    <div class="wrap" style="${kvars(k.id)}">
      <nav class="subnav" aria-label="On this page">${[...sections.slice(0, 4), ...(k.sourcing ? [['buy', 'Where to buy']] : []), sections[4]].map(([id, l]) => `<a href="#/kits/${k.id}" data-scroll="${id}">${l}</a>`).join('')}</nav>
      <section class="sec anchor" id="builds"><h2 class="h2">Builds</h2>
        <div class="grid-3">${k.projects.map((p, i) => `
          <a class="bcard" href="#/kits/${k.id}/${p.id}"><div class="tile" ${pic(`pic-${k.id}-${p.id}`)}>${B.render(k.id, p.id)}<span class="badge">${i + 1}</span></div>
            <h3>${esc(shortTitle(p.title))}</h3><p>${esc(p.level)} · ${esc(p.time)} · ${p.steps.length} steps</p></a>`).join('')}</div></section>
      <section class="sec anchor" id="materials"><h2 class="h2">What's in the bag</h2>${B.materials(k)}</section>
      <section class="sec anchor" id="concepts"><h2 class="h2">Concepts covered</h2>${B.concepts(k)}</section>
      <section class="sec anchor" id="bonus"><h2 class="h2">Bonus builds</h2><p class="intro">For classrooms with the shared toolbox.</p>${B.bonus(k)}</section>
      ${k.sourcing ? `<section class="sec anchor" id="buy"><h2 class="h2">Where to buy the parts</h2>
        <p class="intro">Links the club collected for single packs and bulk orders. Prices and stock change, so check before ordering.</p>
        <div class="buy">${k.sourcing.map((g) => `<div><h3>${esc(g.part)}</h3>${g.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗${l.note ? `<small>${esc(l.note)}</small>` : ''}</a>`).join('')}</div>`).join('')}</div></section>` : ''}
      <section class="sec anchor narrow" id="plan"><h2 class="h2">Lesson plan</h2><p class="intro">${esc(PLANS.format)}</p>${B.plan(k)}
        ${CURRICULUM.kit === k.id ? `<a class="extra" href="#/curriculum"><b>${esc(CURRICULUM.title)}</b><span>${esc(CURRICULUM.summary)}</span></a>` : ''}</section>
    </div>`,
    after: bindJumps,
  }),

  build: (k, p, ctx, step) => {
    const on = store.get('kits-3d', true);
    const i = k.projects.indexOf(p);
    const stage = B.stage(p).replace('class="stage3d"', `class="stage3d" ${pic(`pic-${k.id}-${p.id}`)}`);
    return {
      title: p.title,
      html: `
      <div class="wrap" style="${kvars(k.id)}">
        ${B.crumbs([['Home', '#/'], ['Kits', '#/kits'], [k.short, `#/kits/${k.id}`], [`Build ${i + 1}`]])}
        <div class="build-head"><div><h1 class="h1">${esc(p.title)}</h1><p class="lead">${esc(p.summary)}</p></div>${B.toggle3d(on)}</div>
        <div class="bench${on ? '' : ' no3d'}" data-bench>${stage}${stepCard(k, p)}</div>
        ${B.after(p)}
        ${B.pager(k, p)}
      </div>`,
      after: (root) => {
        let ctl = null;
        ctl = bindBuild(root, k, p, step, theme, { paint: cardPainter(root, k, p) });
        bindDrag(root, p, () => ctl);
      },
    };
  },

  // The three-class Intro to Arduino mini-unit (ECE kit).
  curriculum: () => {
    const k = KITS.find((x) => x.id === CURRICULUM.kit);
    return {
      title: CURRICULUM.title,
      html: `
      <div class="kit-band" style="${kvars(k.id)}"><div class="wrap band-in solo">
        <div>${B.crumbs([['Home', '#/'], ['Kits', '#/kits'], [k.short, `#/kits/${k.id}`], ['Intro to Arduino']])}<h1 class="h1">${esc(CURRICULUM.title)}</h1><p class="lead">${esc(CURRICULUM.summary)}</p></div></div></div>
      <div class="wrap narrow lessons" style="${kvars(k.id)}">
        ${CURRICULUM.lessons.map((l, i) => `
        <details class="lesson"${i === 0 ? ' open' : ''}><summary><span class="ln">Class ${l.n}</span><span class="lt">${esc(l.title)}${l.length ? `<small>${esc(l.length)}${l.topic ? ` · ${esc(l.topic)}` : ''}</small>` : ''}</span></summary>
          <div class="lesson-body">
            <h3>Goal</h3><p>${esc(l.goal)}</p>
            <h3>Big idea</h3><p>${esc(l.bigIdea)}</p>
            ${l.materials ? `<h3>Materials</h3><p>${esc(l.materials.join(', '))}</p>` : ''}
            ${l.objectives ? `<h3>Learning objectives</h3><ul>${l.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}
            <h3>Vocabulary</h3><dl>${l.vocabulary.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>
            ${l.sections.map((s) => `<h3>${esc(s.heading)}</h3>${s.body.map((b) => `<p>${esc(b)}</p>`).join('')}`).join('')}
          </div></details>`).join('')}
        <p class="see">See these circuits in 3D: <a class="textlink" href="#/kits/ece/led-circuit">LED circuit →</a> <a class="textlink" href="#/kits/ece/mcu-led">LED controlled by code →</a></p>
      </div>`,
    };
  },

  notFound: () => `<div class="wrap">${B.crumbs([['Home', '#/']])}<h1 class="h1 page-title">Page not found</h1><a class="btn" href="#/">Go home</a></div>`,
};

setPages(pages);
window.addEventListener('hashchange', () => { route(); document.getElementById('main').focus({ preventScroll: true }); });
route();
