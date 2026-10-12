# Team-2 Architecture

## Purpose

Support **Codyza Team 02 Task 01** (hackathon opportunity research) with a reliable API and database. The gateway is the single entry point for the frontend and internal tools.

## Components

| Component | Role |
|-----------|------|
| `client/` | Next.js UI (forms, filters, submission views) |
| `gateway/` | Backend API, validation, exports, access control, optional proxy |
| Supabase PostgreSQL | Master database, organizer follow-up log |

## Request flow

```
Browser / tools
    -> gateway (Fastify)
        -> Supabase (hackathons, organizer_followups)
    optional: /proxy/rest/* and /proxy/graphql -> future services
```

## Codyza research rules (enforced in API)

- Verified statuses require evidence links, verifier name, and confidence not Low.
- Verifier must differ from researcher.
- Shortlist requires `shortlist_rationale`.
- Duplicate official websites are rejected.
- Organizer follow-ups cannot store `confirmed_answer` while status is Pending.

## Redundancy and operations

- `GET /health/live` — process is running (for load balancers).
- `GET /health/ready` — database reachable (for load balancers).
- Graceful shutdown on SIGTERM/SIGINT (Docker/Kubernetes friendly).
- Run multiple gateway containers behind a load balancer; all share one Supabase database.

## Logging

- Structured JSON logs via Fastify/Pino to stdout.
- Each request logs `requestId`, method, path, status (ready for centralized log tools).

## Security notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Use `ADMIN_API_KEY` only on server-side admin routes.
- Configure IP allow/block lists via environment variables for restricted deployments.
