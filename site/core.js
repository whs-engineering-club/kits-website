// Data, helpers, reusable HTML blocks, the build-page controller (steps <-> 3D model)
// and the hash router. Page templates live in app.js.
import { mountViewer, snapshot } from './viewer.js';
import { heroBuild } from './hero-anim.js';

// ---------- data ----------
const SHORT = { ece: 'Electrical', meche: 'Mechanical', aero: 'Aerospace', bme: 'Biomedical' };
export const FEATURE = { ece: 'light-sensor', meche: 'bridge', aero: 'glider-wing', bme: 'water-filter' };
export const KITS = window.KITS_DATA.kits.map((k) => ({ ...k, short: SHORT[k.id], toolbox: k.classroomToolbox }));
export const PLANS = window.KITS_DATA.planInfo;
export const CURRICULUM = window.KITS_DATA.curriculum;
export const details = (k, p) => p.details ?? [];
export const kitById = (id) => KITS.find((k) => k.id === id);
export const STATS = {
  kits: KITS.length,
  builds: KITS.reduce((n, k) => n + k.projects.length, 0),
  steps: KITS.reduce((n, k) => n + k.projects.reduce((m, p) => m + p.steps.length, 0), 0),
  bonus: KITS.reduce((n, k) => n + k.bonus.length, 0),
};
export const HERO = [['meche', 'bridge', 'Truss bridge'], ['ece', 'light-sensor', 'Light sensor'], ['aero', 'glider-wing', 'Glider'], ['bme', 'water-filter', 'Water filter']];

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pad = (n) => String(n).padStart(2, '0');
export const shortTitle = (t) => t.replace(/ challenge:.*$/i, ' challenge');
export const split = (s) => { const m = String(s).match(/^(\d+(?:–\d+)?)\s+(.+)$/); return m ? [m[1], m[2][0].toUpperCase() + m[2].slice(1)] : ['', s]; };
export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const models = {};
export const loadModels = (kitId) => (models[kitId] ??= import(`./models/${kitId}.js`).then((m) => m.default));

// NumberFlow (vendor/number-flow.js) rolls the step counter's digits and counts up the stats.
// Loaded lazily; if it fails the numbers stay plain text.
let numberFlow = null;
const loadNumberFlow = () => (numberFlow ??= import('./vendor/number-flow.js').then(() => true, () => false));

// ---------- site copy ----------
export const COPY = {
  mission: "Engineering shouldn't depend on a school's budget.",
  missionMore: 'We design low-cost kits for Title I classrooms and write the lessons that go with them, so any teacher can run a real engineering unit.',
  kitsPara: 'Every student gets a bag of everyday parts: craft sticks, LEDs, straws, coffee filters. A shared classroom toolbox adds equipment like microcontrollers and digital scales for the bonus lessons.',
  clubPara: 'The WHS Engineering Club is a high school club. Members choose the parts and write every plan and build guide on this site.',
  how: [
    ['Every student gets a kit', 'A bag of low-cost parts for each student or pair. Every core lesson runs on that bag alone.'],
    ['One session a week', 'Six or seven sessions of 60–90 minutes, ending with a project students design themselves.'],
    ['Build it step by step', 'Each build has written steps and a 3D model that changes with every step. No engineering background needed.'],
  ],
  faq: [
    ['Who are the kits for?', 'Elementary and middle school classrooms, starting with Title I schools, where a STEM budget is hardest to find. The builds use cheap, everyday materials so a whole class can take part.'],
    ['Do teachers need an engineering background?', 'No. Each kit has a week-by-week plan, and every build has numbered steps, a 3D model of each step, a test to check it works, and a short explanation of the science.'],
    ['What is the shared classroom toolbox?', 'Equipment one classroom shares across every session, such as microcontrollers, multimeters, a digital scale or a box fan. The core weeks never need it. It unlocks six bonus lessons per kit.'],
    ['How long does a kit take?', `${PLANS.format} ${PLANS.flex}`],
  ],
};

// ---------- reusable blocks ----------
export const B = {
  render: (kitId, projId) => `<img class="render" alt="" data-snap="${kitId}/${projId}">`,
  crumbs: (items) => `<p class="crumbs">${items.map(([label, href]) => (href ? `<a href="${href}">${esc(label)}</a>` : `<span>${esc(label)}</span>`)).join('<span aria-hidden="true">/</span>')}</p>`,
  faq: () => `<div class="faq">${COPY.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`,
  materials: (k) => `
    <div class="lists">
      <div><h3>Student kit</h3><p class="list-note">One per student or pair. Every core week uses only this.</p>
        <ul class="list">${k.studentKit.map((m) => { const [q, n] = split(m); return `<li><span class="q">${q || '–'}</span><span>${esc(n)}</span></li>`; }).join('')}</ul></div>
      <div><h3>Shared classroom toolbox</h3><p class="list-note">One set per room. Needed for the bonus builds.</p>
        <ul class="list">${k.toolbox.map((m) => `<li><span class="q">1 set</span><span>${esc(m)}</span></li>`).join('')}</ul></div>
    </div>`,
  concepts: (k) => `<div class="concepts">${k.concepts.map((c) => `<span>${esc(c)}</span>`).join('')}</div>`,
  bonus: (k) => `<div class="bonus">${k.bonus.map((b) => `<div><h3>${esc(b.t)}</h3><p>${esc(b.d)}</p>${b.guide ? `<a class="textlink" href="#/kits/${k.id}/${b.guide}">Step-by-step guide →</a>` : ''}</div>`).join('')}</div>`,
  plan: (k) => `<div class="weeks">${k.weeks.map((w, i) => `
    <details${i === 0 ? ' open' : ''}><summary><span class="w">Week ${i + 1}</span><span class="t">${esc(w.t)}</span></summary>
      <div class="body"><ul>${w.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>
        ${w.guide ? `<a class="textlink" href="#/kits/${k.id}/${w.guide}">Build: ${esc(shortTitle(k.projects.find((p) => p.id === w.guide).title))} →</a>` : ''}</div></details>`).join('')}</div>`,
  toggle3d: (on) => `<button class="toggle" role="switch" aria-checked="${on}" data-toggle3d><span class="track"></span>3D model</button>`,
  stage: (p) => `
    <div class="stage3d" aria-label="3D model of the current step">
      <div class="viewer" data-viewer><p class="viewer-msg">Loading 3D model…</p></div>
      <div class="over"><span data-ov>Step 1 of ${p.steps.length}</span><span class="new">New part</span></div>
      <span class="hint">Drag to turn · scroll to zoom</span>
    </div>`,
  steplist: (p, k) => { const d = k ? details(k, p) : []; return `<ol class="steplist">${p.steps.map((s, j) => `<li><button data-step="${j + 1}"><span class="n">${pad(j + 1)}</span><span class="s">${esc(s)}${d[j] ? `<span class="d">${esc(d[j])}</span>` : ''}</span></button></li>`).join('')}</ol>`; },
  // A picture that morphs between pages (View Transitions): same name on both pages.
  vt: (name) => `style="view-transition-name:${name}"`,
  count: (p) => `<span class="count"><span data-count>1</span><span class="of">&nbsp;/ ${p.steps.length}</span></span>`,
  stepbtns: () => `<div class="btns"><button class="btn ghost" data-prev>Back</button><button class="btn" data-next>Next step</button></div>`,
  after: (p) => `
    <div class="after">
      <aside><h2>You will need</h2><ul class="list">${p.materials.map((m) => `<li><span>${esc(m)}</span></li>`).join('')}</ul></aside>
      <div class="blocks">
        ${p.code ? `<div><h2>Code</h2><pre class="code"><code>${esc(p.code)}</code></pre></div>` : ''}
        ${p.note ? `<div><h2>Before you start</h2><p class="note">${esc(p.note)}</p></div>` : ''}
        <div><h2>Test it</h2><p>${esc(p.test)}</p></div>
        <div><h2>Why it works</h2><p>${esc(p.why)}</p></div>
        ${p.extend ? `<div><h2>Go further</h2><p>${esc(p.extend)}</p></div>` : ''}
      </div>
    </div>`,
  pager: (k, p) => {
    const i = k.projects.indexOf(p);
    const prev = k.projects[i - 1];
    const next = k.projects[i + 1];
    return `<nav class="pager" aria-label="More builds">
      ${prev ? `<a href="#/kits/${k.id}/${prev.id}"><small>← Previous build</small><b>${esc(shortTitle(prev.title))}</b></a>` : '<span></span>'}
      ${next ? `<a class="next" href="#/kits/${k.id}/${next.id}"><small>Next build →</small><b>${esc(shortTitle(next.title))}</b></a>`
        : `<a class="next" href="#/kits/${k.id}"><small>All done →</small><b>Back to the ${esc(k.short.toLowerCase())} kit</b></a>`}
    </nav>`;
  },
};

// ---------- behaviour ----------
// Stats count up once when they first scroll into view (a rare, once-per-visit moment).
// NumberFlow's "continuous" plugin makes each digit run through the values in between.
export function bindCountUp(root) {
  const els = [...root.querySelectorAll('[data-countup]')];
  if (!els.length) return;
  loadNumberFlow().then(async (ok) => {
    if (!ok) return;
    const { continuous } = await import('./vendor/number-flow.js');
    const flows = els.map((el) => {
      const f = document.createElement('number-flow');
      f.plugins = [continuous];
      f.spinTiming = { duration: 1400, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' };
      el.replaceChildren(f);
      f.animated = false;
      f.update(reduced() ? Number(el.dataset.countup) : 0);
      return [el, f];
    });
    if (reduced()) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const [, f] = flows.find(([el]) => el === e.target);
      f.animated = true;
      f.update(Number(e.target.dataset.countup));
    }), { threshold: 0.6 });
    flows.forEach(([el]) => io.observe(el));
    onCleanup(() => io.disconnect());
  });
}

let cleanup = [];
export const onCleanup = (fn) => cleanup.push(fn);

// Fill every pending thumbnail with a render of the finished model, on the page's tile colour.
export function hydrateRenders(root, theme) {
  root.querySelectorAll('img[data-snap]').forEach(async (img) => {
    const [kitId, projId] = img.dataset.snap.split('/');
    try {
      const build = (await loadModels(kitId))[projId];
      if (!build) return;
      const url = await snapshot(`${kitId}/${projId}`, build, { theme: theme(kitId) });
      if (!url || !img.isConnected) return;
      img.onload = () => img.classList.add('ready');
      img.src = url;
    } catch { /* tile stays plain */ }
  });
}

// Home hero: a live, slowly turning model with buttons to switch builds.
// Switching crossfades (old canvas fades out 150ms, new one fades in with a 2px blur that clears),
// so the swap reads as one object changing rather than a flash.
export function bindHero(root, theme) {
  const el = root.querySelector('[data-hero-viewer]');
  if (!el) return;
  let viewer = null;
  let token = 0;
  async function show(kitId, projId, first) {
    const mine = ++token;
    const build = heroBuild(kitId, projId, (await loadModels(kitId))[projId]);
    if (mine !== token || !el.isConnected) return;
    if (viewer && !first && !reduced()) {
      el.classList.add('leaving');
      await new Promise((r) => setTimeout(r, 150));
      if (mine !== token) return;
    }
    viewer?.dispose();
    el.classList.remove('leaving');
    viewer = mountViewer(el, build, { step: 'last', autoRotate: true, overview: true, theme: theme(kitId) });
    if (!viewer) { el.innerHTML = '<p class="viewer-msg">3D is not available in this browser.</p>'; return; }
    if (!first) { el.classList.remove('entering'); void el.offsetWidth; el.classList.add('entering'); }
    const open = root.querySelector('[data-hero-open]');
    if (open) open.href = `#/kits/${kitId}/${projId}`;
  }
  const chips = root.querySelector('[data-hero-chips]');
  chips?.addEventListener('click', (e) => {
    const c = e.target.closest('[data-k]');
    if (!c || c.getAttribute('aria-pressed') === 'true') return;
    chips.querySelectorAll('[data-k]').forEach((x) => x.setAttribute('aria-pressed', x === c));
    show(c.dataset.k, c.dataset.p, false);
  });
  const first = chips?.querySelector('[aria-pressed="true"]');
  show(first?.dataset.k ?? HERO[0][0], first?.dataset.p ?? HERO[0][1], true);
  onCleanup(() => { token++; viewer?.dispose(); });
}

// In-page jump links (hash routing owns the URL fragment, so these scroll by id).
export function bindJumps(root) {
  const onClick = (e) => {
    const a = e.target.closest('[data-scroll]');
    if (!a) return;
    e.preventDefault();
    document.getElementById(a.dataset.scroll)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  };
  root.addEventListener('click', onClick);
  onCleanup(() => root.removeEventListener('click', onClick));
}

// Build page controller. Any element with [data-step=n] selects step n; [data-prev]/[data-next]
// step; [data-toggle3d] shows/hides the model; [data-count]/[data-ov]/[data-prog] are kept in sync.
// opts.paint(step, how) lets a page update its own UI ("click" | "key" | "init").
export function bindBuild(root, k, p, startStep, theme, opts = {}) {
  const total = p.steps.length;
  const bench = root.querySelector('[data-bench]');
  const viewerEl = root.querySelector('[data-viewer]');
  const toggle = root.querySelector('[data-toggle3d]');
  const countEl = root.querySelector('[data-count]');
  let step = Math.max(1, Math.min(total, startStep || 1));
  let viewer = null;
  let alive = true;
  let flow = null;

  // Swap the plain counter for a NumberFlow element once it loads.
  loadNumberFlow().then((ok) => {
    if (!ok || !alive || !countEl) return;
    flow = document.createElement('number-flow');
    flow.animated = false;
    countEl.replaceChildren(flow);
    flow.update(step);
  });

  function show(n, how) {
    const next = Math.max(1, Math.min(total, n));
    const changed = next !== step;
    step = next;
    root.querySelectorAll('[data-step]').forEach((b) => {
      const s = Number(b.dataset.step);
      b.classList.toggle('done', s < step);
      if (s === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    // Digits roll only for pointer navigation. Keyboard stepping is high-frequency: instant.
    if (flow) { flow.animated = how !== 'key' && how !== 'init' && changed && !reduced(); flow.update(step); } else if (countEl) countEl.textContent = step;
    root.querySelectorAll('[data-ov]').forEach((el) => { el.textContent = `Step ${step} of ${total}`; });
    root.querySelectorAll('[data-prog]').forEach((el) => { el.style.transform = `scaleX(${step / total})`; });
    root.querySelectorAll('[data-prev]').forEach((b) => { b.disabled = step === 1; });
    root.querySelectorAll('[data-next]').forEach((b) => { b.disabled = step === total; b.textContent = step === total ? 'Done' : (b.dataset.label || 'Next step'); });
    viewer?.setStep(step);
    history.replaceState(null, '', `${location.pathname}${location.search}#/kits/${k.id}/${p.id}${step > 1 ? `?step=${step}` : ''}`);
    opts.paint?.(step, how);
    if (how !== 'init') {
      const cur = root.querySelector('.steplist [aria-current="step"]');
      if (cur) { const r = cur.getBoundingClientRect(); if (r.top < 90 || r.bottom > innerHeight - 90) cur.scrollIntoView({ block: 'nearest' }); }
    }
  }

  async function mount3d(animateIn) {
    if (viewer || !viewerEl) return;
    viewerEl.innerHTML = '<p class="viewer-msg">Loading 3D model…</p>';
    try {
      const build = (await loadModels(k.id))[p.id];
      if (!alive || viewer || bench.classList.contains('no3d')) return;
      if (!build) throw new Error('no model');
      viewer = mountViewer(viewerEl, build, { step, theme: theme(k.id) });
      if (!viewer) viewerEl.innerHTML = '<p class="viewer-msg">3D is not available in this browser. The written steps have everything you need.</p>';
    } catch { viewerEl.innerHTML = '<p class="viewer-msg">The 3D model could not be loaded. The written steps have everything you need.</p>'; }
    if (animateIn && !reduced()) {
      const stage = viewerEl.closest('.stage3d');
      stage.classList.remove('entering'); void stage.offsetWidth; stage.classList.add('entering');
    }
  }
  const unmount3d = () => { viewer?.dispose(); viewer = null; };

  const onClick = (e) => {
    const s = e.target.closest('[data-step]');
    if (s) { show(Number(s.dataset.step), 'click'); return; }
    if (e.target.closest('[data-prev]')) show(step - 1, 'click');
    if (e.target.closest('[data-next]')) show(step + 1, 'click');
  };
  root.addEventListener('click', onClick);
  toggle?.addEventListener('click', () => {
    const on = toggle.getAttribute('aria-checked') !== 'true';
    toggle.setAttribute('aria-checked', on);
    bench.classList.toggle('no3d', !on);
    store.set('kits-3d', on);
    if (on) mount3d(true); else unmount3d(); // off is instant: the system responds, nothing to watch
  });
  // Capture phase + preventDefault so nothing else on the page also reacts to ←/→.
  const onKey = (e) => {
    if (e.target.closest?.('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); show(step + 1, 'key'); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(step - 1, 'key'); }
  };
  document.addEventListener('keydown', onKey, true);
  onCleanup(() => { alive = false; root.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey, true); unmount3d(); });

  show(step, 'init');
  if (!bench.classList.contains('no3d')) mount3d(false);
  return { get step() { return step; }, show };
}

// ---------- router ----------
let V = null; // the page templates (app.js)
let lastPath = null;
let lastDepth = 0;
export function setPages(v) { V = v; lastPath = null; }

export function route(force) {
  const [path, query] = location.hash.replace(/^#/, '').split('?');
  if (path === lastPath && !force) return;
  const prevPath = lastPath;
  lastPath = path;
  const depthOf = (pp) => (pp || '').split('/').filter((x) => x && x !== 'about').length;
  const dir = depthOf(path) >= lastDepth ? 'forward' : 'back';
  lastDepth = depthOf(path);
  // Page changes animate through the View Transitions API. First load stays instant.
  if (!force && prevPath !== null && V.vt && document.startViewTransition && !reduced()) {
    document.documentElement.dataset.vt = V.vt;
    document.documentElement.dataset.dir = dir;
    document.startViewTransition(() => render(path, query, force));
  } else render(path, query, force);
}

function render(path, query, force) {
  cleanup.forEach((fn) => fn());
  cleanup = [];
  const step = Number(new URLSearchParams(query).get('step')) || 1;
  const parts = path.split('/').filter(Boolean);
  const main = document.getElementById('main');
  const ctx = { parts, nav: '' };
  let page = null;
  if (!parts.length || parts[0] === 'about') { ctx.nav = parts[0] === 'about' ? 'about' : 'home'; page = V.home(ctx); }
  else if (parts[0] === 'kits' && parts.length === 1) { ctx.nav = 'kits'; page = V.kits(ctx); }
  else if (parts[0] === 'curriculum' && parts.length === 1) { ctx.nav = 'kits'; ctx.kit = kitById(CURRICULUM.kit); page = V.curriculum(ctx); }
  else if (parts[0] === 'kits') {
    const k = kitById(parts[1]);
    const p = k && parts[2] && k.projects.find((x) => x.id === parts[2]);
    ctx.nav = 'kits'; ctx.kit = k; ctx.project = p;
    if (k && parts.length === 2) page = V.kit(k, ctx);
    else if (p && parts.length === 3) page = V.build(k, p, ctx, step);
  }
  if (!page) page = { html: V.notFound(), title: 'Not found' };
  document.getElementById('shell-top').innerHTML = V.top(ctx);
  document.getElementById('shell-bottom').innerHTML = V.bottom(ctx);
  main.innerHTML = page.html;
  document.title = page.title ? `${page.title} · WHS Engineering Club` : 'WHS Engineering Club';
  page.after?.(main);
  hydrateRenders(document.body, V.theme);
  bindCountUp(main);
  V.afterRoute?.(ctx);
  if (parts[0] === 'about') document.getElementById('mission')?.scrollIntoView();
  else if (!force) window.scrollTo(0, 0);
}
