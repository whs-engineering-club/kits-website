// Renders every step of a model into one contact-sheet PNG.
// Usage: node scripts/shots.cjs <kit>/<project> [out.png]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [, , model, out = `shots-${(process.argv[2] || '').replace('/', '-')}.png`] = process.argv;
const SITE = path.join(__dirname, '..', 'site');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
(async () => {
  const srv = http.createServer((req, res) => {
    const f = path.join(SITE, decodeURIComponent(req.url.split('?')[0]));
    fs.readFile(f, (e, d) => { res.writeHead(e ? 404 : 200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(e ? '' : d); });
  }).listen(0);
  const base = `http://localhost:${srv.address().port}`;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 640, height: 460 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`${base}/preview.html?m=${model}&step=0`);
  await p.waitForFunction('window.ready', null, { timeout: 15000 }).catch(() => {});
  if (errs.length) { console.error('ERRORS:', errs); process.exit(1); }
  const max = await p.evaluate(() => window.viewer.maxStep);
  const imgs = [];
  for (let s = 0; s <= max; s++) {
    await p.evaluate((n) => window.viewer.setStep(n, false), s);
    await p.waitForTimeout(700);
    imgs.push({ s, data: (await p.screenshot()).toString('base64') });
  }
  const sheet = await b.newPage({ viewport: { width: 1290, height: 100 } });
  await sheet.setContent(`<body style="margin:0;background:#000;display:grid;grid-template-columns:repeat(3,1fr);gap:4px">${imgs.map((i) =>
    `<div style="position:relative"><img src="data:image/png;base64,${i.data}" style="width:100%;display:block"><b style="position:absolute;left:6px;top:4px;color:#fff;font:700 16px sans-serif;background:#000a;padding:2px 6px">step ${i.s}</b></div>`).join('')}</body>`);
  await sheet.screenshot({ path: out, fullPage: true });
  console.log(`${model}: ${max} steps -> ${out}`, errs.length ? errs : '');
  await b.close(); srv.close();
})();
