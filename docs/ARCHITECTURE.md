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
 | hackathon-    |   | ai-service    |   | scraper-      |
 | service :4001 |   | (future)      |   | service       |
 +-------+-------+   +---------------+   +---------------+
         |
         v
   Supabase PostgreSQL
```

## Gateway (`gateway/`)

- Single public URL for the team
- Proxies paths to internal services
- No Supabase credentials in gateway

## Hackathon service (`services/hackathon-service/`)

- Codyza master database CRUD, views, CSV exports, organizer follow-ups
- **Drizzle ORM + `DATABASE_URL`** (standard PostgreSQL — not coupled to Supabase SDK)
- Supabase can remain the host; migration to RDS/local Postgres is a connection-string change

## Codyza research rules

Enforced in **hackathon-service** (see `docs/RESEARCH-SOP.md`).

## Adding a new service

1. Create `services/<name>/` with its own port and `.env`.
2. Add `*_SERVICE_URL` to gateway env.
3. Register proxy prefix in `gateway/src/routes/service-proxy.ts`.
4. Document in `GET /gateway/routes`.
