# Deployment

## Local (development)

See [LOCAL-RUN.md](./LOCAL-RUN.md): start `services/hackathon-service` (4001) then `gateway` (4000).

## Docker (single instance)

```bash
docker compose up --build
```

## Redundancy (production pattern)

1. Build image from `gateway/Dockerfile`.
2. Run **2+ replicas** behind a load balancer (Railway, Render, AWS ALB, etc.).
3. Configure LB health check: `GET /health/ready`.
4. Gateway replicas share the same downstream URLs (`HACKATHON_SERVICE_URL`, etc.).
5. Hackathon-service replicas share the same `DATABASE_URL` (PostgreSQL).
6. Set `ADMIN_API_KEY`, rate limits, and optional `IP_ALLOWLIST`.

## Environment variables

See root `.env.example`, `gateway/.env.example` (if present), `services/hackathon-service/.env.example`, and `.env.production.example`.

**Gateway:** `HACKATHON_SERVICE_URL`, `PORT`, `ADMIN_API_KEY` (no database credentials). Optional `LOG_FILE_PATH` for a local JSON log file. Leave it unset in containers.

Apply `supabase/migrations/20261019120000_table_rules_and_comments.sql` after the two earlier migrations. It adds column comments and the research-rule checks.

**Hackathon service:** `DATABASE_URL`, `DATABASE_SSL` (standard PostgreSQL; Supabase is optional hosting only).

Never commit `.env` or paste production secrets into GitHub. Use the hosting provider **Environment Variables** / **Secrets** UI.

Optional proxy upstreams:

- `PROXY_REST_UPSTREAM_URL`
- `PROXY_GRAPHQL_UPSTREAM_URL`
