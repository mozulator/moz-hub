# Architecture / Stack Decisions

## Hub (this repo root)

- **Runtime**: Node.js 18+
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
- **Database**: SQLite (`Projects/Sniper Buddy/prisma/ballistics.db`)
- **Env var**: `DATABASE_URL=file:./Projects/Sniper Buddy/prisma/ballistics.db`
- **Notes**:
  - Great fit for **read-only** or **rarely changing** data.
  - If you want persistent user data (saved builds, users, analytics), migrate to **Postgres** (Render managed DB).


