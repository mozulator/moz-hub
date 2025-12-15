# Momcilo Project Hub

This repo is a **hub website** that hosts your coding projects under one domain.

## Run locally

1. Install Node.js **18+**
2. Install deps:

```powershell
npm install
```

3. Start local Postgres (Docker):

```powershell
docker compose up -d
```

4. Start:

```powershell
npm start
```

Open:
- Hub: `http://localhost:3000/`
- Design Skill: `http://localhost:3000/p/design-skill/`

## Add a new project

Create a folder anywhere under `Projects/` and add a `project.json`.

### `project.json` format

**Static project (HTML/CSS/JS)**:

```json
{
  "slug": "my-static-app",
  "title": "My Static App",
  "description": "What it is",
  "type": "static",
  "staticDir": ".",
  "index": "index.html",
  "tags": ["html", "css", "js"],
  "icon": "fa-folder"
}
```

**Redirect project (hosted elsewhere)**:

```json
{
  "slug": "my-big-app",
  "title": "My Big App",
  "description": "Hosted on its own domain",
  "type": "redirect",
  "url": "https://example.com",
  "tags": ["saas"],
  "icon": "fa-arrow-up-right-from-square"
}
```

**Express project (mounted inside the hub)**:

```json
{
  "slug": "my-express-app",
  "title": "My Express App",
  "description": "Express sub-app",
  "type": "express",
  "module": "./hub-app.js",
  "tags": ["node", "express"],
  "icon": "fa-server"
}
```

Your `module` must export:

```js
module.exports = { createApp };
```

where `createApp({ repoRoot, basePath })` returns an Express app.

## Deploy on Render

This repo includes `render.yaml` (Render Blueprint).

### Required env vars (Render)

- **Budget Tracker (private, mounted at `/p/budget-tracker/`)**
  - `BUDGET_TRACKER_DATABASE_URL`: Postgres connection string (recommended with `?schema=budget_tracker`)
  - `BUDGET_TRACKER_SESSION_SECRET`: session secret for `express-session`
  - `BUDGET_TRACKER_ADMIN_USERNAME`: seed-only admin username
  - `BUDGET_TRACKER_ADMIN_PASSWORD`: seed-only admin password
  - `OPENAI_API_KEY` (optional): enables PDF import + AI summarize; without it those endpoints return 503

## GitHub setup

After you create an empty GitHub repo, you can push this repo:

```powershell
git init
git add .
git commit -m "Initial project hub"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```


