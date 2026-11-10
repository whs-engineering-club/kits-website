# WHS Engineering Kits website

A site for the club's four low-cost engineering kits (ECE, Mechanical, Aerospace, Biomedical): what is in each kit, where to buy the parts, a step-by-step build guide for every project, and the three-class Intro to Arduino mini-unit. It also has a backend that takes kit requests from schools and gives officers a page to manage them.

## Layout

| Path | What it is |
| --- | --- |
| `data/kits.mjs` | All kit content. Edit this, then run `npm run build`. |
| `site/` | The frontend (plain HTML/CSS/JS, no build tools). `site/data.js` is generated. |
| `server/server.mjs` | The backend: JSON API + SQLite storage + serves `site/`. No dependencies. |
| `.github/workflows/pages.yml` | Publishes `site/` to GitHub Pages on every push to `main`. |

## Run it locally

Needs Node 22.13 or newer. There is nothing to install.

```bash
ADMIN_TOKEN=choose-a-long-secret npm start
```

Open http://localhost:3000. The request form works, and `#/admin` (the "Officer login" link in the footer) lists requests once you enter the token.

```bash
npm test
```

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | Used by the frontend to detect the backend. |
| GET | `/api/kits`, `/api/kits/:id` | Kit summaries / one full kit with its guides. |
| GET | `/api/curriculum` | The Arduino mini-unit. |
| POST | `/api/requests` | Submit a kit request. Validated; 10 per IP per hour. |
| GET | `/api/requests` | Admin only (`Authorization: Bearer <ADMIN_TOKEN>`). |
| PATCH | `/api/requests/:id` | Admin only. Body `{"status": "new" \| "contacted" \| "fulfilled" \| "declined"}`. |

Environment variables: `PORT` (default 3000), `ADMIN_TOKEN` (admin page is disabled without it), `DB_PATH` (default `server/data/kits.db`), `ALLOWED_ORIGIN` (CORS origin; default `*`).

## GitHub Pages and the backend

GitHub Pages only hosts static files, so on Pages the kits, guides and curriculum all work, but the request form shows "server not connected" until a backend is hosted somewhere.

To turn Pages on: repository **Settings → Pages → Source: GitHub Actions**, then merge to `main`.

To connect the backend: run `npm start` on any host that supports Node 22 and a persistent disk for `DB_PATH`, set `ADMIN_TOKEN` and `ALLOWED_ORIGIN` (the Pages URL) there, then put that host's URL in `site/config.js` as `API_BASE`.

## Content sources

Kit contents, concepts, project lists, parts links and the Arduino lessons come from the club's planning spreadsheet. The step-by-step build guides and example sketches were written for this site and should be tried out by the club before they are used in a classroom.
