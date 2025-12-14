# Architecture / Stack Decisions

## Hub (this repo root)

- **Runtime**: Node.js 22 (LTS)
- **Web framework**: Express
- **Frontend**: Vanilla HTML/CSS/JS (Notion-style, based on `Projects/Design Skill/design.md`)
- **Database**: **None**
- **Purpose**:
  - Home page grid of projects (`/`)
  - Mount projects under `/p/<slug>/`
  - Support project types:
    - `static`: serve a folder
    - `express`: mount an Express sub-app
    - `redirect`: send users to an external domain

## Projects

### Design Skill (`Projects/Design Skill`)

- **Type**: Static
- **Runs**: Served as static files by the hub at `/p/design-skill/`
- **Database**: **None**
- **Purpose**: Visual design baseline + components showcase

## Database-backed projects (recommended standard)

- **DB**: Postgres
- **Local dev**: Docker Postgres (via `docker-compose.yml`)
- **Prod**: Render Postgres
- **Pattern**: One Postgres instance, one schema per app (`?schema=<app_slug>`)


