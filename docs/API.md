# Gateway API Reference

Base URL (local): `http://localhost:4000`

## Health and operations

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Basic status |
| GET | `/health/live` | Liveness (load balancer) |
| GET | `/health/ready` | Readiness (includes DB check) |

## Hackathons

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/hackathons` | List with filters |
| GET | `/api/hackathons/:id` | Single record |
| POST | `/api/hackathons` | Create |
| PATCH | `/api/hackathons/:id` | Update |

### Views (Codyza deliverables)

| Method | Path |
|--------|------|
| GET | `/api/hackathons/views/apply-now` |
| GET | `/api/hackathons/views/prepare-before-opening` |
| GET | `/api/hackathons/views/monitor` |
| GET | `/api/hackathons/views/shortlist` |
| GET | `/api/hackathons/views/virtual-hybrid` |
| GET | `/api/hackathons/views/travel-supported` |
| GET | `/api/hackathons/views/deadlines?withinDays=7` |

### List query params

- `status`, `confidence`, `format`, `shortlisted`, `limit`

## Organizer follow-ups

| Method | Path |
|--------|------|
| GET | `/api/organizer-followups` |
| POST | `/api/organizer-followups` |
| PATCH | `/api/organizer-followups/:id` |

## Exports (CSV)

| Method | Path |
|--------|------|
| GET | `/api/exports/master-database.csv` |
| GET | `/api/exports/shortlist.csv` |
| GET | `/api/exports/organizer-followups.csv` |

## Admin (requires header `X-Admin-Key`)

| Method | Path |
|--------|------|
| GET | `/admin/access-control` |
| POST | `/admin/access-control/block-path` |
| POST | `/admin/access-control/block-ip` |

## Proxy (optional upstream)

| Method | Path |
|--------|------|
| ALL | `/proxy/rest/*` → `PROXY_REST_UPSTREAM_URL` |
| ALL | `/proxy/graphql` → `PROXY_GRAPHQL_UPSTREAM_URL` |

Returns 503 if upstream env is not configured.

## Logging

Each gateway request writes one JSON line with `requestId`, method, path, status, duration, and client IP.

- Development terminals print a readable line. The same JSON is appended to `LOG_FILE_PATH` when that variable is set (`logs/gateway.log` in the local example).
- Production containers leave `LOG_FILE_PATH` empty and keep JSON on stdout for the host log viewer.
- Admin key and authorization headers are not written to the log.
- Creates, updates, blocked IPs, blocked paths, and rejected research rules are logged as their own lines.
- The hackathon service writes the same shape to its own stdout and optional log file.

## Verification rules (summary)

These rules are checked by the API and by database constraints in `supabase/migrations/20261019120000_table_rules_and_comments.sql`.

- Verified statuses require evidence links, verifier ≠ researcher, confidence ≠ Low.
- Shortlist requires `shortlist_rationale`.
- A follow-up cannot store `confirmed_answer` while `response_status` is Pending.
- Duplicate `official_website` returns HTTP 409. Matching ignores case and a trailing slash.

See `docs/RESEARCH-SOP.md` for human research standards.
