# Gateway Task Progress (`create gateway`)

**Assignee:** @saningore  
**Architecture:** API Gateway (port 4000) + microservices

## Ticket alignment

| Acceptance criteria | Implementation |
|---------------------|----------------|
| Central access point | `gateway/` — only public entry on :4000 |
| Routes to services | Proxy to `hackathon-service`, stubs for AI/scraper |
| Localized / central logging | JSON logs + `requestId` on gateway |
| Black/white list APIs | `/admin/access-control/*` |
| REST proxy | `/api/*` → downstream services |
| GraphQL proxy | `/proxy/graphql` |
| Redundancy | Live/ready checks, Docker, multi-replica ready |
| Docker image | `gateway/Dockerfile` + `docker-compose.yml` |

## Services

| Service | Path | Port |
|---------|------|------|
| hackathon-service | `/api/hackathons`, exports, follow-ups | 4001 |
| ai-service | `/api/ai` | TBD |
| scraper-service | `/api/scraper` | TBD |

## Changelog

- **2026-10-12** — Refactored: business API moved to `services/hackathon-service`; gateway is routing-only per team lead feedback.
- **2026-10-12** — Hackathon service uses **Drizzle ORM + DATABASE_URL** (no Supabase client) for portable PostgreSQL access.
- **2026-10-13** — Local run verified: gateway `/health/ready` + proxied `/api/hackathons` via session pooler `DATABASE_URL` (URL-encode `@` in passwords).
