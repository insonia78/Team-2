# Team-2 — Hackathon Opportunity Research

Codyza **Team 02 Task 01**: verified hackathon research platform (database + API + frontend).

## Repository layout

| Path | Purpose |
|------|---------|
| `client/` | Next.js frontend |
| `gateway/` | API Gateway — routes traffic to services |
| `services/hackathon-service/` | Hackathon research API (Drizzle + PostgreSQL) |
| `ETL/` | Python ETL service |
| `scrapper/` | Scraper service |
| `infra/` | Kubernetes manifests |
| `supabase/migrations/` | PostgreSQL schema |
| `docs/` | Architecture, API, task progress, research SOP |

## Quick start (gateway + hackathon API)

1. Create Supabase project and run migrations in order:
   - `supabase/migrations/20261009120000_hackathons.sql`
   - `supabase/migrations/20261012120000_organizer_followups.sql`
2. Configure env (see [LOCAL-RUN.md](docs/LOCAL-RUN.md)): `services/hackathon-service/.env` + `gateway/.env`
3. Start **hackathon-service** then **gateway** (or `npm run dev:hackathon` / `dev:gateway` from repo root).
4. Verify: `GET http://localhost:4000/health/ready` and `GET http://localhost:4000/gateway/routes`

## Documentation index

- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Research SOP](docs/RESEARCH-SOP.md)

## Docker (gateway stack)

```bash
docker compose up --build
```

## Skaffold / Kubernetes (ETL + scrapper)

The Kubernetes manifests under [infra/](./infra) reference the `team2-etl` and `team2-scrapper` images. For remote or shared clusters, [skaffold.yaml](./skaffold.yaml) is configured to push images so the cluster can pull the generated tag.

Example:

```bash
skaffold run --default-repo <your-registry>
```

For common local clusters (`docker-desktop`, `minikube`, and `kind-kind`), the `local-cluster` profile is auto-activated and keeps image pushes disabled so local development still works with the node's local image store.

## Remote repositories

Local clone may point to `saningore/Team-2`. Team PRs may also use `ayushgaire/Team-2` — confirm the canonical remote with your lead before pushing.

Powered by Codyza.
