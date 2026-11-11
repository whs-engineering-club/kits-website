const DATA = window.KITS_DATA;
const main = document.getElementById('main');
let cleanup = []; // disposers for the current page (3D viewers, timers, listeners)

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
};
const kitById = (id) => DATA.kits.find((k) => k.id === id);
const list = (items) => `<ul class="list">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
const totalProjects = DATA.kits.reduce((n, k) => n + k.projects.length, 0);
const totalSteps = DATA.kits.reduce((n, k) => n + k.projects.reduce((m, p) => m + p.steps.length, 0), 0);
const reached = (key) => { const v = store.get('kits-progress', {})[key]; return Array.isArray(v) ? v.length : (v || 0); };

// ---------- 3D stepper (shared by the home demo and every guide page) ----------
const stepperHtml = (extraHead = '') => `
  <div class="viewer" data-viewer><p class="viewer-loading">Loading 3D model…</p></div>
  <aside class="demo-side">
    ${extraHead}
    <ol class="step-list" data-steps></ol>
    <div class="side-foot">
      <div class="timer"><span data-now>1</span><small>/ <span data-total>1</span></small></div>
      <div class="btns">
        <button class="btn btn-small btn-ghost" data-prev aria-label="Previous step">← Back</button>
        <button class="btn btn-small" data-next>Next <span aria-hidden="true">→</span></button>
      </div>
    </div>
  </aside>`;

async function mountStepper(root, kit, pr, { auto = false, remember = false } = {}) {
  const key = `${kit.id}/${pr.id}`;
  const viewerEl = root.querySelector('[data-viewer]');
  const listEl = root.querySelector('[data-steps]');
  const total = pr.steps.length;
  let step = 1;
  let viewer = null;
  let timer = 0;
  let dead = false;

  root.querySelector('[data-total]').textContent = total;
  listEl.innerHTML = pr.steps.map((s, i) => `<li><button class="step-btn" data-step="${i + 1}"><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(s)}</span></button></li>`).join('');
  const btns = [...listEl.querySelectorAll('.step-btn')];

  function show(n, user = false) {
    step = Math.max(1, Math.min(total, n));
    if (user) stopAuto();
    viewer?.setStep(step);
    btns.forEach((b, i) => {
      b.classList.toggle('done', i + 1 < step);
      i + 1 === step ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current');
    });
    const cur = btns[step - 1];
    listEl.scrollTo({ top: cur.offsetTop - listEl.offsetTop - 40, behavior: 'smooth' });
    root.querySelector('[data-now]').textContent = step;
    root.querySelector('[data-prev]').disabled = step === 1;
    root.querySelector('[data-next]').disabled = step === total;
    if (remember && step > reached(key)) { const all = store.get('kits-progress', {}); all[key] = step; store.set('kits-progress', all); }
  }
  function stopAuto() { clearInterval(timer); timer = 0; }

  listEl.onclick = (e) => { const b = e.target.closest('.step-btn'); if (b) show(Number(b.dataset.step), true); };
  root.querySelector('[data-prev]').onclick = () => show(step - 1, true);
  root.querySelector('[data-next]').onclick = () => show(step + 1, true);
  viewerEl.addEventListener('pointerdown', stopAuto);
  show(1);

  const dispose = () => { dead = true; stopAuto(); viewer?.dispose(); };
  try {
    const [{ mountViewer }, models] = await Promise.all([import('./viewer.js'), import(`./models/${kit.id}.js`)]);
    if (dead) return dispose;
    const build = models.default[pr.id];
    if (!build) throw new Error('no model');
    viewer = mountViewer(viewerEl, build, { step });
    if (viewer) {
      viewerEl.insertAdjacentHTML('beforeend', '<span class="viewer-hint">drag to rotate · scroll to zoom</span>');
      if (auto && !matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => show(step === total ? 1 : step + 1), 3800);
    }
  } catch {
    if (!dead) viewerEl.innerHTML = '<p class="viewer-fallback">The 3D model could not be loaded. Follow the written steps on the right.</p>';
  }
  dispose.show = (n) => show(n, true);
  dispose.next = () => show(step + 1, true);
  dispose.prev = () => show(step - 1, true);
  return dispose;
}

// ---------- views ----------
const kitCard = (k) => `
  <a class="kit-card reveal" href="#/kits/${k.id}">
    <span class="kit-code">${esc(k.code)} KIT</span>
    <h3>${esc(k.name)}</h3>
    <p>${esc(k.tagline)}</p>
    <pre class="mini">${k.projects.slice(0, 3).map((p, i) => `<span class="o">${String(i + 1).padStart(2, '0')}</span> ${esc(p.title.replace(/:.*/, ''))}`).join('\n')}
<span class="m">+ ${k.projects.length - 3} more</span></pre>
    <span class="more">${k.projects.length} build guides →</span>
  </a>`;

const FEATURED = [['ece', 'led-circuit', 'LED circuit'], ['meche', 'bridge', 'Truss bridge'], ['aero', 'balloon-rocket', 'Balloon rocket'], ['bme', 'water-filter', 'Water filter']];

function home() {
  return `
  <section class="hero">
    <div class="wrap hero-copy">
      <p class="eyebrow"><span class="dot"></span> ${esc(DATA.site.club)} · ${DATA.kits.length} kits · ${totalProjects} builds</p>
      <h1>Engineering kits you<br>build step by step.</h1>
      <p class="lede">Low-cost kits for elementary and middle school classrooms. Every project comes with a 3D model that shows exactly what each step looks like, so any teacher can run it.</p>
      <div class="hero-ctas">
        <a class="btn" href="#/kits">Pick a kit <span aria-hidden="true">→</span></a>
        <a class="link" href="#/curriculum">Arduino lesson plans <span aria-hidden="true">→</span></a>
      </div>
    </div>
    <div class="wrap">
      <div class="demo" id="home-demo">${stepperHtml(`
        <div class="side-head"><span class="pulse"></span> Build guide <span class="muted" id="demo-kit"></span></div>
        <div class="prompt-chips">${FEATURED.map(([k, p, label], i) => `<button class="chip${i ? '' : ' active'}" data-kit="${k}" data-project="${p}">${label}</button>`).join('')}</div>`)}
      </div>
      <p class="caption">A real guide from the site. It plays by itself; click a step or drag the model to take over. <a class="link" id="demo-open" href="#/kits/ece/led-circuit">Open this guide →</a></p>
    </div>
  </section>

  <section class="strip">
    <div class="wrap strip-inner">
      <span class="muted">Covers</span>
      ${DATA.kits.map((k) => `<a class="logo-pill" href="#/kits/${k.id}">${esc(k.name.replace(' Kit', ''))}</a>`).join('')}
      <a class="logo-pill" href="#/curriculum">Intro to Arduino</a>
    </div>
  </section>

  <section class="section" id="how">
    <div class="wrap">
      <p class="kicker">How it works</p>
      <h2>See the build<br>before you build it.</h2>
      <p class="sub">Written instructions leave a lot to guesswork. Each guide here pairs every step with a 3D model: the new part drops into place, the camera moves to it, and you can turn it around to see where everything connects.</p>
      <div class="how-grid">
        <article class="how-card reveal"><div class="how-num">01</div><h3>Open the kit</h3>
          <p>Each kit page lists what goes in every student bag and what the classroom shares.</p>
          <pre class="mini"><span class="m">ECE student kit · $3–$5</span>
<span class="o">›</span> Mini breadboard
<span class="o">›</span> 5 LEDs, 5 resistors
<span class="o">›</span> Button, buzzer, sensor</pre></article>
        <article class="how-card reveal"><div class="how-num">02</div><h3>Follow the 3D steps</h3>
          <p>Click through the steps. The model shows what to add and labels where it goes.</p>
          <pre class="mini"><span class="ok">✓</span> LED into two columns
<span class="ok">✓</span> Resistor to the long leg
<span class="o">&gt;&gt;</span> Battery + to the resistor
<span class="m">   Battery − to the LED</span></pre></article>
        <article class="how-card reveal"><div class="how-num">03</div><h3>Test, then go further</h3>
          <p>Every guide ends with a test, the science behind it, and a challenge to push the design.</p>
          <pre class="mini"><span class="m">Test</span>   pull one wire: LED off
<span class="m">Why</span>    a circuit is a loop
<span class="m">Next</span>   <span class="s">"add a second LED"</span></pre></article>
      </div>
    </div>
  </section>

  <section class="section section-alt" id="kits">
    <div class="wrap">
      <p class="kicker">The kits</p>
      <h2>Four kits.<br>Four kinds of engineering.</h2>
      <p class="sub">Each one has a low-cost bag for every student and a shared classroom toolbox for the equipment that gets reused.</p>
      <div class="kit-grid">${DATA.kits.map(kitCard).join('')}</div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <p class="kicker">In every guide</p>
      <h2>Built so a teacher<br>can run it cold.</h2>
      <div class="feat-grid">
        <article class="feat reveal"><div class="feat-ico">◈</div><h3>3D model per step</h3><p>Rotate and zoom the build at every stage. New parts are highlighted and labelled.</p></article>
        <article class="feat reveal"><div class="feat-ico">☰</div><h3>Exact materials</h3><p>A parts list for each project, drawn from the student kit and the classroom toolbox.</p></article>
        <article class="feat reveal"><div class="feat-ico">✓</div><h3>A test that proves it</h3><p>Each build ends with a clear check, so students know whether it works.</p></article>
        <article class="feat reveal"><div class="feat-ico">?</div><h3>The why</h3><p>A short plain-language explanation of the engineering idea behind the build.</p></article>
        <article class="feat reveal"><div class="feat-ico">{ }</div><h3>Code included</h3><p>Microcontroller projects come with a complete, commented Arduino sketch.</p></article>
        <article class="feat reveal"><div class="feat-ico">↗</div><h3>A capstone</h3><p>Every kit finishes with an open-ended project where students design their own solution.</p></article>
      </div>
    </div>
  </section>

  <section class="section section-alt stats-sec">
    <div class="wrap stats">
      <div class="stat reveal"><b>${DATA.kits.length}</b><span>engineering disciplines</span></div>
      <div class="stat reveal"><b>${totalProjects}</b><span>projects with 3D build guides</span></div>
      <div class="stat reveal"><b>${totalSteps}</b><span>modelled steps across all kits</span></div>
      <div class="stat reveal"><b>$3–5</b><span>per ECE student kit</span></div>
    </div>
  </section>

  <section class="section cta">
    <div class="wrap cta-inner">
      <h2>Start with the first build.</h2>
      <p class="sub">Pick a kit, open the first guide, and build along with the 3D model.</p>
      <div class="hero-ctas center">
        <a class="btn" href="#/kits">Browse the kits <span aria-hidden="true">→</span></a>
        <a class="link" href="#/curriculum">Arduino lesson plans <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>`;
}

function bindHome() {
  const demo = document.getElementById('home-demo');
  let dispose = null;
  let token = 0;
  async function load(kitId, projectId) {
    const mine = ++token;
    dispose?.();
    const kit = kitById(kitId);
    const pr = kit.projects.find((p) => p.id === projectId);
    document.getElementById('demo-kit').textContent = `· ${kit.code} kit`;
    document.getElementById('demo-open').href = `#/kits/${kitId}/${projectId}`;
    demo.querySelector('[data-viewer]').innerHTML = '<p class="viewer-loading">Loading 3D model…</p>';
    const d = await mountStepper(demo, kit, pr, { auto: true });
    if (mine !== token) d(); else dispose = d;
  }
  demo.querySelector('.prompt-chips').onclick = (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    demo.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === chip));
    load(chip.dataset.kit, chip.dataset.project);
  };
  load(...FEATURED[0]);
  cleanup.push(() => { token++; dispose?.(); });
}

function kitsIndex() {
  return `<div class="wrap">
    <p class="crumbs">Kits</p>
    <div class="page-head"><h1>Pick a kit.</h1>
      <p class="lede">Choose a discipline to see what is in the kit and how to build every project, step by step in 3D.</p></div>
    <div class="kit-grid" style="margin-top:36px">${DATA.kits.map(kitCard).join('')}</div>
  </div>`;
}

function kitPage(k) {
  const sourcing = k.sourcing ? `
    <div class="block"><h2>Where to buy the parts</h2>
      <p class="sub">Links the club collected for single packs and bulk orders. Prices and stock change, so check before ordering.</p>
      <div class="source-grid">${k.sourcing.map((s) => `
        <div class="panel source"><h3>${esc(s.part)}</h3>
          ${s.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗${l.note ? `<br><small>${esc(l.note)}</small>` : ''}</a>`).join('')}
        </div>`).join('')}</div>
    </div>` : '';
  const lessons = DATA.curriculum.kit === k.id ? `
    <div class="block"><a class="kit-card" href="#/curriculum"><span class="kit-code">LESSON PLANS</span>
      <h3>${esc(DATA.curriculum.title)}</h3><p>${esc(DATA.curriculum.summary)}</p>
      <span class="more">Open the lesson plans →</span></a></div>` : '';
  return `<div class="wrap">
    <p class="crumbs"><a href="#/kits">Kits</a> / ${esc(k.code)}</p>
    <div class="page-head">
      <h1>${esc(k.name)}</h1>
      <p class="lede">${esc(k.tagline)}</p>
      <div class="badges">
        <span class="badge badge-k">${esc(k.code)} KIT</span>
        ${k.cost ? `<span class="badge">${esc(k.cost)}</span>` : ''}
        <span class="badge">${k.projects.length} projects</span>
      </div>
    </div>
    <div class="block"><h2>Build guides</h2>
      <p class="sub">Each one opens a 3D model you step through. Work in order: every project builds on the last.</p>
      <div class="project-list">${k.projects.map((pr, i) => {
        const d = reached(`${k.id}/${pr.id}`);
        return `<a class="project-row" href="#/kits/${k.id}/${pr.id}">
          <span class="n">${String(i + 1).padStart(2, '0')}</span>
          <span><h3>${esc(pr.title)}</h3><p>${esc(pr.summary)}</p></span>
          <span class="meta">${esc(pr.level)} · ${esc(pr.time)} · ${d ? `${d}/${pr.steps.length} steps` : `${pr.steps.length} steps`}</span>
        </a>`;
      }).join('')}</div>
    </div>
    <div class="block"><h2>What's inside</h2>
      <div class="panels">
        <div class="panel"><h3>Student kit</h3><p>One per student or pair.</p>${list(k.studentKit)}</div>
        <div class="panel"><h3>Shared classroom toolbox</h3><p>One set per classroom, reused every session.</p>${list(k.classroomToolbox)}</div>
      </div>
    </div>
    <div class="block"><h2>Concepts covered</h2>
      <div class="tags">${k.concepts.map((c) => `<span class="badge">${esc(c)}</span>`).join('')}</div>
    </div>
    ${lessons}${sourcing}
  </div>`;
}

function projectPage(k, pr) {
  const i = k.projects.indexOf(pr);
  const prev = k.projects[i - 1];
  const next = k.projects[i + 1];
  return `<div class="wrap">
    <p class="crumbs"><a href="#/kits">Kits</a> / <a href="#/kits/${k.id}">${esc(k.code)}</a> / Project ${i + 1}</p>
    <div class="page-head">
      <h1>${esc(pr.title)}</h1>
      <p class="lede">${esc(pr.summary)}</p>
      <div class="badges"><span class="badge badge-k">${esc(pr.level)}</span><span class="badge">${esc(pr.time)}</span><span class="badge">${pr.steps.length} steps</span></div>
    </div>
    <div class="demo flush" id="guide">${stepperHtml('<div class="side-head"><span class="pulse"></span> Steps <span class="muted">· use ← → keys</span></div>')}</div>
    <div class="block guide-below">
      <aside class="panel"><h3>You will need</h3>${list(pr.materials)}</aside>
      <div>
        ${pr.code ? `<h2>Code</h2><pre class="code"><code>${esc(pr.code)}</code></pre>` : ''}
        ${pr.note ? `<div class="callout" style="margin-top:14px"><strong>Note</strong>${esc(pr.note)}</div>` : ''}
        <h2>Test it</h2>
        <div class="callout"><strong>How you know it works</strong>${esc(pr.test)}</div>
        <h2>What's going on?</h2>
        <p>${esc(pr.why)}</p>
        ${pr.extend ? `<h2>Go further</h2><div class="callout"><strong>Challenge</strong>${esc(pr.extend)}</div>` : ''}
        <div class="pager">
          ${prev ? `<a class="btn btn-ghost" href="#/kits/${k.id}/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}
          ${next ? `<a class="btn" href="#/kits/${k.id}/${next.id}">Next: ${esc(next.title)} →</a>` : `<a class="btn" href="#/kits/${k.id}">Back to the ${esc(k.code)} kit</a>`}
        </div>
      </div>
    </div>
  </div>`;
}

async function bindProject(k, pr) {
  let alive = true;
  let stepper = null;
  const onKey = (e) => {
    if (!stepper || e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowRight') stepper.next();
    if (e.key === 'ArrowLeft') stepper.prev();
  };
  document.addEventListener('keydown', onKey);
  cleanup.push(() => { alive = false; document.removeEventListener('keydown', onKey); stepper?.(); });
  const s = await mountStepper(document.getElementById('guide'), k, pr, { remember: true });
  if (alive) stepper = s; else s();
}

function curriculumPage() {
  const c = DATA.curriculum;
  return `<div class="wrap">
    <p class="crumbs"><a href="#/kits/${c.kit}">ECE kit</a> / Curriculum</p>
    <div class="page-head"><h1>${esc(c.title)}</h1><p class="lede">${esc(c.summary)}</p></div>
    <div class="block">${c.lessons.map((l, i) => `
      <details class="lesson"${i === 0 ? ' open' : ''}>
        <summary><span class="n">CLASS ${l.n}</span><h3>${esc(l.title)}
          ${l.length ? `<small>${esc(l.length)}${l.topic ? ` · ${esc(l.topic)}` : ''}</small>` : ''}</h3></summary>
        <div class="lesson-body">
          <h4>Goal</h4><p>${esc(l.goal)}</p>
          <h4>Big idea</h4><p>${esc(l.bigIdea)}</p>
          ${l.materials ? `<h4>Materials</h4><p>${esc(l.materials.join(', '))}</p>` : ''}
          ${l.objectives ? `<h4>Learning objectives</h4><ul>${l.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}
          <h4>Vocabulary</h4><dl>${l.vocabulary.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>
          ${l.sections.map((s) => `<h4>${esc(s.heading)}</h4>${s.body.map((b) => `<p>${esc(b)}</p>`).join('')}`).join('')}
        </div>
      </details>`).join('')}
      <p class="muted" style="margin-top:20px">See these circuits in 3D: <a class="link" href="#/kits/ece/led-circuit">LED circuit →</a> <a class="link" href="#/kits/ece/mcu-led">LED controlled by code →</a></p>
    </div>
  </div>`;
}

const notFound = () => `<div class="wrap"><p class="crumbs">404</p><div class="page-head"><h1>Page not found.</h1>
  <p class="lede">That page does not exist.</p><div class="hero-ctas"><a class="btn" href="#/">Go home</a></div></div></div>`;

// ---------- router ----------
function render() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
  const [pathPart] = location.hash.replace(/^#/, '').split('?');
  const parts = pathPart.split('/').filter(Boolean);
  let html;
  let title = 'Engineering Kits';
  let after;
  if (!parts.length) { html = home(); after = bindHome; }
  else if (parts[0] === 'kits' && parts.length === 1) { html = kitsIndex(); title = 'Kits'; }
  else if (parts[0] === 'kits') {
    const k = kitById(parts[1]);
    const pr = k && parts[2] ? k.projects.find((x) => x.id === parts[2]) : null;
    if (k && parts.length === 2) { html = kitPage(k); title = k.name; }
    else if (pr && parts.length === 3) { html = projectPage(k, pr); title = pr.title; after = () => bindProject(k, pr); }
  } else if (parts[0] === 'curriculum' && parts.length === 1) { html = curriculumPage(); title = 'Curriculum'; }
  main.innerHTML = html || notFound();
  document.title = `${html ? title : 'Not found'} · ${DATA.site.club}`;
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.dataset.nav === parts[0] ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  main.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  cleanup.push(() => io.disconnect());
  after?.();
}

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); main.focus({ preventScroll: true }); });
render();
