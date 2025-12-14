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

### Sniper Buddy (`Projects/Sniper Buddy`)

- **Type**: Express sub-app mounted by the hub at `/p/sniper-buddy/`
- **Backend**: Express (mounted; no separate service)
- **ORM**: Prisma
- **Database**: Postgres (Render Postgres in prod; Docker Postgres locally)
- **Env var (local)**: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/projects?schema=sniper_buddy`
- **Notes**:
  - We use **one Postgres database** and isolate each project using a dedicated **schema** via `?schema=<project_slug>`.


