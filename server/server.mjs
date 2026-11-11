// Kits website server. No dependencies (Node 22+).
// Serves the static frontend from ../site and a read-only JSON API of the kit content.
// The published GitHub Pages site does not need this; it is for running the site locally
// or giving other tools the kit data as JSON.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kits, curriculum, site } from '../data/kits.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.join(ROOT, '..', 'site');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const kitSummary = (k) => ({
  id: k.id, code: k.code, name: k.name, tagline: k.tagline,
  projects: k.projects.map((p) => ({ id: p.id, title: p.title, level: p.level, time: p.time, steps: p.steps.length })),
});

function api(pathname) {
  let match;
  if (pathname === '/api/health') return { ok: true };
  if (pathname === '/api/site') return site;
  if (pathname === '/api/kits') return kits.map(kitSummary);
  if (pathname === '/api/curriculum') return curriculum;
  if ((match = pathname.match(/^\/api\/kits\/([\w-]+)$/))) {
    const kit = kits.find((k) => k.id === match[1]);
    if (!kit) throw new HttpError(404, 'Kit not found');
    return kit;
  }
  if ((match = pathname.match(/^\/api\/kits\/([\w-]+)\/([\w-]+)$/))) {
    const project = kits.find((k) => k.id === match[1])?.projects.find((p) => p.id === match[2]);
    if (!project) throw new HttpError(404, 'Project not found');
    return project;
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

export function createApp({ allowedOrigin = process.env.ALLOWED_ORIGIN || '*' } = {}) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed');
      if (url.pathname.startsWith('/api/')) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        send(200, api(url.pathname));
      } else await serveStatic(res, url.pathname);
    } catch (err) {
      if (!(err instanceof HttpError)) console.error(err);
      const status = err instanceof HttpError ? err.status : 500;
      send(status, { error: status === 500 ? 'Server error' : err.message });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, () => console.log(`Kits site running at http://localhost:${port}`));
}
