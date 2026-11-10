// Kits website backend. No dependencies: node:http + node:sqlite (Node 22.5+).
// Serves the JSON API under /api and the static frontend from ../site.
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kits, curriculum, site } from '../data/kits.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.join(ROOT, '..', 'site');
const STATUSES = ['new', 'contacted', 'fulfilled', 'declined'];
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

class HttpError extends Error {
  constructor(status, message, fields) { super(message); this.status = status; this.fields = fields; }
}

function validateRequest(body) {
  const errors = {};
  const str = (key, max, required = true) => {
    const v = typeof body[key] === 'string' ? body[key].trim() : '';
    if (required && !v) errors[key] = 'Required';
    else if (v.length > max) errors[key] = `Must be ${max} characters or fewer`;
    return v;
  };
  const name = str('name', 100);
  const email = str('email', 200);
  const school = str('school', 200);
  const notes = str('notes', 2000, false);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
  const kitId = typeof body.kitId === 'string' ? body.kitId : '';
  if (!kits.some((k) => k.id === kitId)) errors.kitId = 'Choose a kit';
  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) errors.quantity = 'Enter a whole number from 1 to 500';
  if (Object.keys(errors).length) throw new HttpError(400, 'Some fields need fixing', errors);
  return { name, email, school, notes, kitId, quantity };
}

export function createApp({
  dbPath = process.env.DB_PATH || path.join(ROOT, 'data', 'kits.db'),
  adminToken = process.env.ADMIN_TOKEN || '',
  allowedOrigin = process.env.ALLOWED_ORIGIN || '*',
  rateLimit = 10, // request submissions per IP per hour
} = {}) {
  if (dbPath !== ':memory:') mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, email TEXT NOT NULL, school TEXT NOT NULL,
    kit_id TEXT NOT NULL, quantity INTEGER NOT NULL, notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  const hits = new Map();
  const limited = (ip) => {
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
    if (recent.length >= rateLimit) return true;
    recent.push(now);
    hits.set(ip, recent);
    return false;
  };

  const requireAdmin = (req) => {
    if (!adminToken) throw new HttpError(503, 'Admin access is not configured on this server');
    const given = Buffer.from((req.headers.authorization || '').replace(/^Bearer /, ''));
    const want = Buffer.from(adminToken);
    if (given.length !== want.length || !timingSafeEqual(given, want)) throw new HttpError(401, 'Invalid admin token');
  };

  const readJson = async (req) => {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 20_000) throw new HttpError(413, 'Request body too large');
    }
    try {
      const body = JSON.parse(raw || '{}');
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
      return body;
    } catch { throw new HttpError(400, 'Body must be a JSON object'); }
  };

  const kitSummary = (k) => ({
    id: k.id, code: k.code, name: k.name, tagline: k.tagline, cost: k.cost ?? null,
    projectCount: k.projects.length,
  });

  async function api(req, url) {
    const { pathname } = url;
    const m = req.method;
    let match;
    if (pathname === '/api/health' && m === 'GET') return { ok: true, adminConfigured: Boolean(adminToken) };
    if (pathname === '/api/site' && m === 'GET') return site;
    if (pathname === '/api/kits' && m === 'GET') return kits.map(kitSummary);
    if ((match = pathname.match(/^\/api\/kits\/([\w-]+)$/)) && m === 'GET') {
      const kit = kits.find((k) => k.id === match[1]);
      if (!kit) throw new HttpError(404, 'Kit not found');
      return kit;
    }
    if (pathname === '/api/curriculum' && m === 'GET') return curriculum;
    if (pathname === '/api/requests' && m === 'POST') {
      if (limited(req.socket.remoteAddress)) throw new HttpError(429, 'Too many requests. Try again later.');
      const r = validateRequest(await readJson(req));
      const info = db.prepare('INSERT INTO requests (name, email, school, kit_id, quantity, notes) VALUES (?, ?, ?, ?, ?, ?)')
        .run(r.name, r.email, r.school, r.kitId, r.quantity, r.notes);
      return { status: 201, body: { id: Number(info.lastInsertRowid), status: 'new' } };
    }
    if (pathname === '/api/requests' && m === 'GET') {
      requireAdmin(req);
      return db.prepare('SELECT * FROM requests ORDER BY id DESC').all();
    }
    if ((match = pathname.match(/^\/api\/requests\/(\d+)$/)) && m === 'PATCH') {
      requireAdmin(req);
      const { status } = await readJson(req);
      if (!STATUSES.includes(status)) throw new HttpError(400, `Status must be one of: ${STATUSES.join(', ')}`);
      const info = db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(status, Number(match[1]));
      if (!info.changes) throw new HttpError(404, 'Request not found');
      return db.prepare('SELECT * FROM requests WHERE id = ?').get(Number(match[1]));
    }
    throw new HttpError(404, 'Not found');
  }

  async function serveStatic(res, pathname) {
    const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
    const file = path.join(SITE_DIR, rel);
    if (!file.startsWith(SITE_DIR + path.sep)) throw new HttpError(404, 'Not found');
    try {
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    } catch { throw new HttpError(404, 'Not found'); }
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const isApi = url.pathname.startsWith('/api/');
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };
    try {
      if (isApi) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
        if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
        const out = await api(req, url);
        if (out && out.status && out.body) send(out.status, out.body);
        else send(200, out);
      } else if (req.method === 'GET' || req.method === 'HEAD') {
        await serveStatic(res, url.pathname);
      } else throw new HttpError(405, 'Method not allowed');
    } catch (err) {
      if (!(err instanceof HttpError)) console.error(err);
      const status = err instanceof HttpError ? err.status : 500;
      send(status, { error: status === 500 ? 'Server error' : err.message, fields: err.fields });
    }
  });
  server.on('close', () => db.close());
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, () => {
    console.log(`Kits site running at http://localhost:${port}`);
    if (!process.env.ADMIN_TOKEN) console.log('ADMIN_TOKEN is not set: the admin page is disabled.');
  });
}
