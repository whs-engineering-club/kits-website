(() => {
  const DATA = window.KITS_DATA;
  const API = (window.KITS_CONFIG?.API_BASE || '').replace(/\/$/, '');
  const main = document.getElementById('main');
  const state = { live: false, adminConfigured: false };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
  };
  const session = {
    get token() { try { return sessionStorage.getItem('kits-admin') || ''; } catch { return ''; } },
    set token(v) { try { v ? sessionStorage.setItem('kits-admin', v) : sessionStorage.removeItem('kits-admin'); } catch { /* ignore */ } },
  };

  async function api(path, { method = 'GET', body, token } = {}) {
    const res = await fetch(API + path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(json.error || `Request failed (${res.status})`), { status: res.status, fields: json.fields });
    return json;
  }

  const kitById = (id) => DATA.kits.find((k) => k.id === id);
  const list = (items) => `<ul class="list">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  const totalProjects = DATA.kits.reduce((n, k) => n + k.projects.length, 0);

  // ---------- views ----------
  const kitCard = (k) => `
    <a class="card kit-card k-${k.id}" href="#/kits/${k.id}">
      <span class="kit-code">${esc(k.code)} KIT</span>
      <h3>${esc(k.name)}</h3>
      <p>${esc(k.tagline)}</p>
      <span class="more">${k.projects.length} build guides →</span>
    </a>`;

  function home() {
    return `
    <div class="wrap">
      <div class="hero">
        <p class="eyebrow">${esc(DATA.site.club)}</p>
        <h1>Real engineering,<br>in a kit that costs a few dollars.</h1>
        <p class="lead">${esc(DATA.site.mission)} Every kit comes with step-by-step guides, so any teacher can run it.</p>
        <div class="hero-actions">
          <a class="btn" href="#/kits">Explore the kits</a>
          <a class="btn btn-ghost" href="#/request">Request kits for your school</a>
        </div>
        <div class="stats">
          <div class="stat"><b>${DATA.kits.length}</b><span>engineering disciplines</span></div>
          <div class="stat"><b>${totalProjects}</b><span>step-by-step build guides</span></div>
          <div class="stat"><b>${DATA.curriculum.lessons.length}</b><span>ready-to-teach Arduino lessons</span></div>
          <div class="stat"><b>$3–$5</b><span>per ECE student kit</span></div>
        </div>
      </div>
      <section id="kits">
        <div class="section-head"><h2>Four kits, four kinds of engineering</h2>
          <p>Each kit has a low-cost bag for every student and a shared classroom toolbox for the equipment that gets reused.</p></div>
        <div class="grid">${DATA.kits.map(kitCard).join('')}</div>
      </section>
      <section>
        <div class="section-head"><h2>How it works</h2></div>
        <div class="grid steps3">
          <div class="card"><h3>Pick a kit</h3><p>See exactly what is inside each student kit and what the classroom shares.</p></div>
          <div class="card"><h3>Follow the guide</h3><p>Every project lists materials, numbered steps, a test, and the science behind it. Tick steps off as you go.</p></div>
          <div class="card"><h3>Finish with a capstone</h3><p>Each kit ends in an open-ended final project where students design their own solution.</p></div>
        </div>
      </section>
      <section>
        <a class="card" href="#/curriculum">
          <span class="kit-code">FOR TEACHERS</span>
          <h3>${esc(DATA.curriculum.title)}</h3>
          <p>${esc(DATA.curriculum.summary)}</p>
          <span class="more">Open the lesson plans →</span>
        </a>
      </section>
    </div>`;
  }

  function kitsIndex() {
    return `<div class="wrap">
      <div class="page-head" style="padding-top:40px"><h1>The kits</h1>
        <p class="lead">Choose a discipline to see what is in the kit and how to build every project.</p></div>
      <section><div class="grid grid-2">${DATA.kits.map(kitCard).join('')}</div></section>
    </div>`;
  }

  function kitPage(k) {
    const done = store.get(`kits-progress`, {});
    const sourcing = k.sourcing ? `
      <section>
        <div class="section-head"><h2>Where to buy the parts</h2><p>Links the club collected for single packs and bulk orders. Prices and stock change, so check before ordering.</p></div>
        <div class="grid">${k.sourcing.map((s) => `
          <div class="card source"><h3>${esc(s.part)}</h3>
            ${s.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗${l.note ? `<br><small>${esc(l.note)}</small>` : ''}</a>`).join('')}
          </div>`).join('')}</div>
      </section>` : '';
    const lessons = DATA.curriculum.kit === k.id ? `
      <section><a class="card" href="#/curriculum"><span class="kit-code">LESSON PLANS</span>
        <h3>${esc(DATA.curriculum.title)}</h3><p>${esc(DATA.curriculum.summary)}</p>
        <span class="more">Open the lesson plans →</span></a></section>` : '';
    return `<div class="wrap k-${k.id}">
      <p class="crumbs"><a href="#/kits">Kits</a> / ${esc(k.code)}</p>
      <div class="page-head">
        <h1>${esc(k.name)}</h1>
        <p class="lead">${esc(k.tagline)}</p>
        <div class="badges">
          <span class="badge badge-k">${esc(k.code)} KIT</span>
          ${k.cost ? `<span class="badge">${esc(k.cost)}</span>` : ''}
          <span class="badge">${k.projects.length} projects</span>
        </div>
      </div>
      <section>
        <div class="section-head"><h2>What's inside</h2></div>
        <div class="grid grid-2">
          <div class="card"><h3>Student kit</h3><p>One per student or pair.</p>${list(k.studentKit)}</div>
          <div class="card"><h3>Shared classroom toolbox</h3><p>One set per classroom, reused every session.</p>${list(k.classroomToolbox)}</div>
        </div>
      </section>
      <section>
        <div class="section-head"><h2>Concepts covered</h2></div>
        <div class="chips">${k.concepts.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>
      </section>
      <section>
        <div class="section-head"><h2>Build guides</h2><p>Work through them in order — each one builds on the last.</p></div>
        <div class="project-list">${k.projects.map((pr, i) => {
          const d = (done[`${k.id}/${pr.id}`] || []).length;
          return `<a class="card project-row" href="#/kits/${k.id}/${pr.id}">
            <span class="n">${String(i + 1).padStart(2, '0')}</span>
            <span><h3>${esc(pr.title)}</h3><p>${esc(pr.summary)}</p></span>
            <span class="meta">${esc(pr.level)} · ${esc(pr.time)}${d ? ` · ${d}/${pr.steps.length} done` : ''}</span>
          </a>`;
        }).join('')}</div>
      </section>
      ${lessons}${sourcing}
      <section><a class="btn" href="#/request?kit=${k.id}">Request this kit</a></section>
    </div>`;
  }

  function projectPage(k, pr) {
    const i = k.projects.indexOf(pr);
    const prev = k.projects[i - 1];
    const next = k.projects[i + 1];
    return `<div class="wrap k-${k.id}">
      <p class="crumbs"><a href="#/kits">Kits</a> / <a href="#/kits/${k.id}">${esc(k.code)}</a> / Project ${i + 1}</p>
      <div class="page-head">
        <h1>${esc(pr.title)}</h1>
        <p class="lead">${esc(pr.summary)}</p>
        <div class="badges"><span class="badge badge-k">${esc(pr.level)}</span><span class="badge">${esc(pr.time)}</span></div>
      </div>
      <div class="guide">
        <div>
          <h2>Steps</h2>
          <div class="progress" role="progressbar" aria-label="Steps completed" aria-valuemin="0" aria-valuemax="${pr.steps.length}"><i></i></div>
          <div id="steps" data-key="${k.id}/${pr.id}">${pr.steps.map((s, n) => `
            <label class="step"><input type="checkbox" data-step="${n}">
              <span><b>STEP ${n + 1}</b>${esc(s)}</span></label>`).join('')}</div>
          ${pr.code ? `<h2>Code</h2><pre><code>${esc(pr.code)}</code></pre>` : ''}
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
        <aside><div class="card"><h3>You will need</h3>${list(pr.materials)}</div></aside>
      </div>
    </div>`;
  }

  function bindProject() {
    const box = document.getElementById('steps');
    if (!box) return;
    const key = box.dataset.key;
    const all = store.get('kits-progress', {});
    const boxes = [...box.querySelectorAll('input')];
    const bar = main.querySelector('.progress');
    const paint = () => {
      const n = boxes.filter((b) => b.checked).length;
      bar.firstElementChild.style.width = `${(n / boxes.length) * 100}%`;
      bar.setAttribute('aria-valuenow', n);
    };
    boxes.forEach((b) => { b.checked = (all[key] || []).includes(Number(b.dataset.step)); });
    paint();
    box.addEventListener('change', () => {
      const fresh = store.get('kits-progress', {});
      fresh[key] = boxes.filter((b) => b.checked).map((b) => Number(b.dataset.step));
      store.set('kits-progress', fresh);
      paint();
    });
  }

  function curriculumPage() {
    const c = DATA.curriculum;
    return `<div class="wrap">
      <p class="crumbs"><a href="#/kits/${c.kit}">ECE kit</a> / Curriculum</p>
      <div class="page-head"><h1>${esc(c.title)}</h1><p class="lead">${esc(c.summary)}</p></div>
      <section>${c.lessons.map((l, i) => `
        <details class="card lesson"${i === 0 ? ' open' : ''}>
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
        <p style="color:var(--muted)">Ready for more? Continue with the <a href="#/kits/${c.kit}">ECE kit build guides</a>.</p>
      </section>
    </div>`;
  }

  function requestPage(query) {
    const pre = query.get('kit');
    const offline = !state.live ? `<div class="notice" role="status" style="margin-bottom:20px">
      Online requests are not available right now because the club's server is not connected. Browse the kits and guides in the meantime.</div>` : '';
    return `<div class="wrap">
      <div class="page-head" style="padding-top:40px"><h1>Request kits</h1>
        <p class="lead">Teachers and schools: tell us which kit you want and how many students you have. A club officer will follow up by email.</p></div>
      <section>${offline}
        <form class="form" id="request-form" novalidate>
          <label>Your name<input name="name" autocomplete="name" required maxlength="100"><span class="field-err" data-err="name"></span></label>
          <label>Email<input name="email" type="email" autocomplete="email" required maxlength="200"><span class="field-err" data-err="email"></span></label>
          <label>School or organization<input name="school" autocomplete="organization" required maxlength="200"><span class="field-err" data-err="school"></span></label>
          <div class="row">
            <label>Kit<select name="kitId">${DATA.kits.map((k) => `<option value="${k.id}"${k.id === pre ? ' selected' : ''}>${esc(k.name)}</option>`).join('')}</select><span class="field-err" data-err="kitId"></span></label>
            <label>Students<input name="quantity" type="number" min="1" max="500" value="30" required><span class="field-err" data-err="quantity"></span></label>
          </div>
          <label>Anything else we should know? (optional)<textarea name="notes" rows="4" maxlength="2000"></textarea><span class="field-err" data-err="notes"></span></label>
          <div><button class="btn" type="submit"${state.live ? '' : ' disabled'}>Send request</button></div>
          <div id="form-msg" role="status" aria-live="polite"></div>
        </form>
      </section>
    </div>`;
  }

  function bindRequest() {
    const form = document.getElementById('request-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('form-msg');
      const btn = form.querySelector('button');
      form.querySelectorAll('[data-err]').forEach((el) => { el.textContent = ''; });
      const body = Object.fromEntries(new FormData(form));
      body.quantity = Number(body.quantity);
      btn.disabled = true;
      try {
        await api('/api/requests', { method: 'POST', body });
        form.reset();
        msg.innerHTML = '<div class="notice ok">Request sent. A club officer will email you soon.</div>';
      } catch (err) {
        Object.entries(err.fields || {}).forEach(([f, m]) => {
          const el = form.querySelector(`[data-err="${f}"]`);
          if (el) el.textContent = m;
        });
        msg.innerHTML = `<div class="notice err">${esc(err.status ? err.message : 'Could not reach the server. Check your connection and try again.')}</div>`;
      } finally { btn.disabled = false; }
    });
  }

  function adminPage() {
    if (!state.live) return `<div class="wrap"><div class="page-head" style="padding-top:40px"><h1>Officer login</h1></div>
      <section><div class="notice">The club's server is not connected, so there are no requests to show.</div></section></div>`;
    return `<div class="wrap">
      <div class="page-head" style="padding-top:40px"><h1>Kit requests</h1><p class="lead">For club officers.</p></div>
      <section id="admin-body">${session.token ? '<p>Loading…</p>' : `
        <form class="form" id="admin-login">
          <label>Admin token<input name="token" type="password" autocomplete="current-password" required></label>
          <div><button class="btn" type="submit">Sign in</button></div>
          <div id="admin-msg" role="status" aria-live="polite"></div>
        </form>`}</section>
    </div>`;
  }

  async function bindAdmin() {
    const body = document.getElementById('admin-body');
    if (!body) return;
    const login = document.getElementById('admin-login');
    if (login) {
      login.addEventListener('submit', (e) => {
        e.preventDefault();
        session.token = login.token.value.trim();
        render();
      });
      return;
    }
    try {
      const rows = await api('/api/requests', { token: session.token });
      const statuses = ['new', 'contacted', 'fulfilled', 'declined'];
      body.innerHTML = `
        <p style="margin-bottom:14px">${rows.length} request${rows.length === 1 ? '' : 's'} · <a href="#/admin" id="signout">Sign out</a></p>
        ${rows.length ? `<div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>School</th><th>Contact</th><th>Kit</th><th>Qty</th><th>Notes</th><th>Status</th></tr></thead>
          <tbody>${rows.map((r) => `<tr>
            <td>${esc(r.created_at.slice(0, 10))}</td><td>${esc(r.school)}</td>
            <td>${esc(r.name)}<br><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td>
            <td>${esc(kitById(r.kit_id)?.code || r.kit_id)}</td><td>${r.quantity}</td><td>${esc(r.notes)}</td>
            <td><select data-id="${r.id}" aria-label="Status for ${esc(r.school)}">${statuses.map((s) => `<option${s === r.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
          </tr>`).join('')}</tbody></table></div>` : '<div class="notice">No requests yet.</div>'}
        <div id="admin-msg" role="status" aria-live="polite" style="margin-top:12px"></div>`;
      document.getElementById('signout').addEventListener('click', () => { session.token = ''; render(); });
      body.addEventListener('change', async (e) => {
        if (!e.target.matches('select[data-id]')) return;
        const msg = document.getElementById('admin-msg');
        try {
          await api(`/api/requests/${e.target.dataset.id}`, { method: 'PATCH', token: session.token, body: { status: e.target.value } });
          msg.innerHTML = '<span style="color:var(--ok)">Saved.</span>';
        } catch (err) { msg.innerHTML = `<span class="field-err">${esc(err.message)}</span>`; }
      });
    } catch (err) {
      session.token = '';
      render();
      const msg = document.getElementById('admin-msg');
      if (msg) msg.innerHTML = `<div class="notice err">${esc(err.status ? err.message : 'Could not reach the server.')}</div>`;
    }
  }

  const notFound = () => `<div class="wrap"><div class="page-head" style="padding-top:60px"><h1>Page not found</h1>
    <p class="lead">That page does not exist.</p><p style="margin-top:24px"><a class="btn" href="#/">Go home</a></p></div></div>`;

  // ---------- router ----------
  function render() {
    const [pathPart, queryPart = ''] = location.hash.replace(/^#/, '').split('?');
    const parts = pathPart.split('/').filter(Boolean);
    const query = new URLSearchParams(queryPart);
    let html;
    let title = 'Engineering Kits';
    let after;
    if (!parts.length) html = home();
    else if (parts[0] === 'kits' && parts.length === 1) { html = kitsIndex(); title = 'Kits'; }
    else if (parts[0] === 'kits') {
      const k = kitById(parts[1]);
      const pr = k && parts[2] ? k.projects.find((x) => x.id === parts[2]) : null;
      if (k && parts.length === 2) { html = kitPage(k); title = k.name; }
      else if (pr && parts.length === 3) { html = projectPage(k, pr); title = pr.title; after = bindProject; }
    } else if (parts[0] === 'curriculum' && parts.length === 1) { html = curriculumPage(); title = 'Curriculum'; }
    else if (parts[0] === 'request' && parts.length === 1) { html = requestPage(query); title = 'Request kits'; after = bindRequest; }
    else if (parts[0] === 'admin' && parts.length === 1) { html = adminPage(); title = 'Officer login'; after = bindAdmin; }
    main.innerHTML = html || notFound();
    document.title = `${html ? title : 'Not found'} – ${DATA.site.club}`;
    document.querySelectorAll('[data-nav]').forEach((a) => {
      a.dataset.nav === parts[0] ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
    after?.();
  }

  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); main.focus({ preventScroll: true }); });
  render();

  // Detect the backend; the guides work without it.
  const status = document.getElementById('api-status');
  const onFile = location.protocol === 'file:';
  (onFile && !API ? Promise.reject() : api('/api/health'))
    .then((h) => { state.live = Boolean(h.ok); state.adminConfigured = h.adminConfigured; })
    .catch(() => { state.live = false; })
    .finally(() => {
      status.textContent = state.live ? 'Server connected' : 'Guides only (server not connected)';
      status.classList.toggle('live', state.live);
      const route = location.hash.split('?')[0];
      if (route === '#/request' || route === '#/admin') render();
    });
})();
