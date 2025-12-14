# Render automation (local CLI)

This repo includes a local CLI that can automate **most** Render setup using the Render API.

## Important limitation (Render API)

Render's API **cannot create free-tier web services**.

That means:
- If your hub web service is on **Free**, you must create it once in the Render UI.
- After that, this CLI can automate: Postgres creation, env vars, deploy triggers, etc.

If you're on a paid plan, the CLI can also create the web service.

## 1) Create a Render API key

In Render:
- **Account Settings → API Keys → Create API Key**

Keep it secret. Do not commit it.
Do not paste it into chat.

## 2) Set the API key in your shell (PowerShell)

```powershell
$env:RENDER_API_KEY="RENDER_xxx"
```

## 3) Configure automation (no secrets)

Copy the example config:

```powershell
Copy-Item tools/render/render.config.example.json tools/render/render.config.json
```

Edit `tools/render/render.config.json` and fill in:
- `ownerId` (workspace)
- `serviceName` (your hub service on Render)
- `postgresName` (db name)
- `region`

## Protected resources

The CLI will **refuse** to operate on these names:
- `kappa-db`
- `kappa-db-copy`
- `kappa-tracker`

## 4) Run automation

```powershell
node tools/render/cli.js doctor
node tools/render/cli.js list-owners
node tools/render/cli.js ensure-postgres
node tools/render/cli.js ensure-service-env
node tools/render/cli.js deploy
```

## Render setup from 0 (single web service)

1. Render Dashboard → **New +** → **Blueprint**
2. Select GitHub repo: `mozulator/moz-hub`
3. Render will read `render.yaml` and create the **single web service**
4. Turn on **Auto-Deploy** for `main`


