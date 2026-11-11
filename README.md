# WHS Engineering Kits website

A site for the club's four low-cost engineering kits (ECE, Mechanical, Aerospace, Biomedical): what is in each kit, where to buy the parts, a step-by-step build guide with an interactive 3D model for every project, and the three-class Intro to Arduino mini-unit. The colours, fonts and logo match the main club site (`eng-club-website`).

## Layout

| Path | What it is |
| --- | --- |
| `data/kits.mjs` | All kit content. Edit this, then run `npm run build`. |
| `site/` | The frontend (plain HTML/CSS/JS, no build tools). `site/data.js` is generated. |
| `site/viewer.js` | The 3D step viewer (three.js, vendored in `site/vendor/`). |
| `site/models/<kit>.js` | One 3D model per project. Each part is tagged with the step that adds it. |
| `scripts/shots.cjs` | Renders every step of a model to one image: `node scripts/shots.cjs ece/led-circuit out.png`. |
| `server/server.mjs` | Small server: serves `site/` and a read-only JSON API of the kit content. No dependencies. |
| `.github/workflows/pages.yml` | Publishes `site/` to GitHub Pages on every push to `main`. |

## Run it locally

Needs Node 22 or newer. There is nothing to install.

```bash
npm start
```

Open http://localhost:3000.

```bash
npm test
```

## The server

The published site is static and does not use the server. `npm start` exists to run the site locally and to expose the kit content as JSON:

| Path | Returns |
| --- | --- |
| `/api/kits` | Kit summaries with their project lists. |
| `/api/kits/:kit` | One full kit. |
| `/api/kits/:kit/:project` | One build guide. |
| `/api/curriculum` | The Arduino mini-unit. |

It is read-only and stores nothing. Environment variables: `PORT` (default 3000), `ALLOWED_ORIGIN` (CORS origin; default `*`).

## Publishing

`.github/workflows/pages.yml` publishes `site/` to GitHub Pages on every push to `main`.

## Content sources

Kit contents, concepts, project lists, parts links and the Arduino lessons come from the club's planning spreadsheet. The step-by-step build guides, example sketches and 3D models were written for this site (the models are drawn in code as diagrams, not CAD files of real parts) and should be tried out by the club before they are used in a classroom.
