import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './server.mjs';

const server = createApp();
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
test.after(() => server.close());
const get = async (path, init) => { const res = await fetch(base + path, init); return { status: res.status, json: await res.json() }; };

test('lists kits with their projects', async () => {
  const { status, json } = await get('/api/kits');
  assert.equal(status, 200);
  assert.deepEqual(json.map((k) => k.id), ['ece', 'meche', 'aero', 'bme']);
  assert.ok(json.every((k) => k.projects.length >= 5 && k.projects.every((p) => p.steps > 0)));
});

test('returns one kit and one project, 404 for unknown ones', async () => {
  assert.ok((await get('/api/kits/meche')).json.studentKit.length > 0);
  assert.ok((await get('/api/kits/ece/led-circuit')).json.steps.length > 0);
  assert.equal((await get('/api/kits/nope')).status, 404);
  assert.equal((await get('/api/kits/ece/nope')).status, 404);
});

test('serves the curriculum', async () => {
  assert.equal((await get('/api/curriculum')).json.lessons.length, 3);
});

test('is read-only', async () => {
  assert.equal((await get('/api/kits', { method: 'POST' })).status, 405);
  assert.equal((await get('/api/requests')).status, 404);
});

test('every project has a 3D model', async () => {
  const kits = (await get('/api/kits')).json;
  for (const k of kits) {
    const src = await (await fetch(`${base}/models/${k.id}.js`)).text();
    for (const p of k.projects) assert.match(src, new RegExp(`(^|[\\s{,])['"]?${p.id}['"]?\\s*[:(]`, 'm'), `${k.id}/${p.id}`);
  }
});

test('serves the frontend and blocks path traversal', async () => {
  const home = await fetch(base + '/');
  assert.equal(home.status, 200);
  assert.match(await home.text(), /<!doctype html>/i);
  assert.equal((await fetch(base + '/..%2Fpackage.json')).status, 404);
});
