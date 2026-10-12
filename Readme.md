# Team-2 — Hackathon Opportunity Research

Codyza **Team 02 Task 01**: verified hackathon research platform (database + API + frontend).

## Repository layout

| Path | Purpose |
|------|---------|
| `client/` | Next.js frontend |
| `gateway/` | Backend API (Fastify + Supabase) |
| `supabase/migrations/` | PostgreSQL schema |
| `docs/` | Architecture, API, task progress, research SOP |

## Quick start

1. Create Supabase project and run migrations in order:
   - `supabase/migrations/20261009120000_hackathons.sql`
   - `supabase/migrations/20261012120000_organizer_followups.sql`
2. Configure env: copy `.env.example` → `gateway/.env`
3. Start API:

```bash
cd gateway
npm install
npm run dev
```

4. Verify: `GET http://localhost:4000/health/ready`

## Documentation index

- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Research SOP](docs/RESEARCH-SOP.md)
- [Gateway task progress](docs/GATEWAY-TASK-PROGRESS.md) — update GitHub Project from here
- [How to update GitHub task](docs/HOW-TO-UPDATE-GITHUB-TASK.md)

## Docker

```bash
docker compose up --build
```

## Remote repositories

Local clone may point to `saningore/Team-2`. Team PRs may also use `ayushgaire/Team-2` — confirm the canonical remote with your lead before pushing.

Powered by Codyza.
