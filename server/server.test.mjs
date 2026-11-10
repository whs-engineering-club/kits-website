import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './server.mjs';

const server = createApp({ dbPath: ':memory:', adminToken: 'secret', rateLimit: 5 });
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
test.after(() => server.close());

const call = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
};
const valid = { name: 'Ms. Rivera', email: 'teacher@example.org', school: 'Example Middle School', kitId: 'ece', quantity: 30, notes: '' };

test('lists kits and returns one kit with projects', async () => {
  const list = await call('/api/kits');
  assert.equal(list.status, 200);
  assert.deepEqual(list.json.map((k) => k.id), ['ece', 'meche', 'aero', 'bme']);
  const kit = await call('/api/kits/meche');
  assert.ok(kit.json.projects.length >= 5);
  assert.ok(kit.json.projects[0].steps.length > 0);
  assert.equal((await call('/api/kits/nope')).status, 404);
});

test('serves the curriculum', async () => {
  const { json } = await call('/api/curriculum');
  assert.equal(json.lessons.length, 3);
});

test('rejects invalid kit requests with field errors', async () => {
  const res = await call('/api/requests', { method: 'POST', body: { ...valid, email: 'nope', quantity: 0, kitId: 'x' } });
  assert.equal(res.status, 400);
  assert.deepEqual(Object.keys(res.json.fields).sort(), ['email', 'kitId', 'quantity']);
});

test('stores a request; admin can list and update it', async () => {
  const created = await call('/api/requests', { method: 'POST', body: valid });
  assert.equal(created.status, 201);
  const id = created.json.id;

  assert.equal((await call('/api/requests')).status, 401);
  assert.equal((await call('/api/requests', { token: 'wrong' })).status, 401);

  const list = await call('/api/requests', { token: 'secret' });
  assert.equal(list.json[0].school, 'Example Middle School');
  assert.equal(list.json[0].status, 'new');

  const bad = await call(`/api/requests/${id}`, { method: 'PATCH', token: 'secret', body: { status: 'lost' } });
  assert.equal(bad.status, 400);
  const ok = await call(`/api/requests/${id}`, { method: 'PATCH', token: 'secret', body: { status: 'fulfilled' } });
  assert.equal(ok.json.status, 'fulfilled');
  assert.equal((await call('/api/requests/9999', { method: 'PATCH', token: 'secret', body: { status: 'new' } })).status, 404);
});

test('rate-limits submissions', async () => {
  let last;
  for (let i = 0; i < 6; i++) last = await call('/api/requests', { method: 'POST', body: valid });
  assert.equal(last.status, 429);
});

test('serves the frontend and blocks path traversal', async () => {
  const home = await fetch(base + '/');
  assert.equal(home.status, 200);
  assert.match(await home.text(), /<!doctype html>/i);
  assert.equal((await fetch(base + '/..%2Fpackage.json')).status, 404);
});
