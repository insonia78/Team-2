# Team-2 Architecture

## Pattern: API Gateway + microservices

```
                    +------------------+
  Client / Next.js  |   API Gateway    |  :4000
                    |  logging, ACL,   |
                    |  rate limit,     |
                    |  route proxy     |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
         v                   v                   v
 +---------------+   +---------------+   +---------------+
 | hackathon-    |   | jwt-service   |   | ai / scraper  |
 | service :4001 |   | :4004         |   | (future)      |
 +-------+-------+   +-------+-------+   +---------------+
         |                   |
         v                   v
              Supabase PostgreSQL
```

## Gateway (`gateway/`)

- Single public URL for the team
- Proxies paths to internal services
- No Supabase credentials in gateway. Login and password hashes stay in `jwt-service`.
- Verifies stateless JWTs and enforces `viewer`, `researcher`, and `admin` before proxying `/api/*`
- Forwards `X-User-Id`, `X-User-Role`, and `X-User-Email` from the token, plus `X-Gateway-Caller` and `X-Gateway-Secret`
- Request logs go to stdout as JSON. In development they are also printed as readable lines, and copied to `LOG_FILE_PATH` when set. The hackathon service logs the same way. Passwords, bearer tokens, and the gateway secret are removed from logs.

## Database rules

The hackathon service uses schema `hackathon_research` from `supabase/migrations/20261020180000_hackathon_research.sql`: `events` plus sources, tracks, benefits, milestones, categories, shortlist entries, application requirements, follow-ups, verifications, and team members. Queue endpoints read the SQL views (`v_apply_now_queue`, `v_codyza_shortlist`, and the rest). `public.hackathons` is the retired flat table. Login accounts live in `hackathon_research.app_users` from `supabase/migrations/20261021140000_app_users.sql`.

## JWT service (`jwt-service/`)

- `POST /login` checks `hackathon_research.app_users` and signs the token
- Accepts calls only from the gateway (`X-Gateway-Caller` / `X-Gateway-Secret`)
- Health routes stay open so the gateway readiness check can reach them

## Hackathon service (`services/hackathon-service/`)

- Codyza master database CRUD, views, CSV exports, organizer follow-ups
- Rejects calls that do not carry the gateway caller and secret. `/health`, `/health/live`, and `/health/ready` stay open.
- **Drizzle ORM + `DATABASE_URL`** (standard PostgreSQL — not coupled to Supabase SDK)
- Supabase can remain the host; migration to RDS/local Postgres is a connection-string change

## Codyza research rules

Enforced in **hackathon-service** (see `docs/RESEARCH-SOP.md`).

## Adding a new service

1. Create `services/<name>/` with its own port and `.env`.
2. Add `*_SERVICE_URL` to gateway env.
3. Register proxy prefix in `gateway/src/routes/service-proxy.ts`.
4. Document in `GET /gateway/routes`.
