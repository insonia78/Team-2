# Gateway API Reference

Base URL (local): `http://localhost:4000`

## Authentication

Stateless HS256 JWTs. The JWT service signs them and checks the signature, issuer (`team-2-gateway`), and expiry. The gateway asks that service before it forwards a protected call. Tokens last 2 hours. Logout is the client discarding the token. `POST /verify` is internal to the gateway.

`POST /api/auth/login` is public.

```json
{ "email": "researcher@local", "password": "change-me-researcher" }
```

```json
{
  "token": "<jwt>",
  "expiresAt": "2026-10-21T16:00:00.000Z",
  "user": { "id": "<uuid>", "email": "researcher@local", "role": "researcher" }
}
```

Send `Authorization: Bearer <token>` on later calls. `GET /api/auth/me` returns the same user fields plus `expiresAt`.

| Role | Methods |
|------|---------|
| `viewer` | GET, HEAD |
| `researcher` | viewer, plus POST, PUT, PATCH |
| `admin` | all methods, including DELETE and `/admin/*` |

A non-admin token cannot call `/admin/*`. Requests with no token can still use `X-Admin-Key` there. `/health`, `/health/live`, `/health/ready`, and `/gateway/routes` stay public.

Unknown emails and wrong passwords both return 401 `{ "error": "Invalid email or password." }`.

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
| GET | `/api/hackathons/views/evidence` |

`withinDays=7` reads `v_deadlines_next_7_days`. `withinDays=30` reads `v_deadlines_next_30_days`. Apply Now and Prepare Before Opening read the shortlist queue views, not `operational_status` alone. Monitor reads `v_upcoming_monitoring_list`.

### List query params

- `operational_status`, `evidence_confidence`, `format`, `limit`

Event bodies use `hackathon_research.events` column names (`event_name`, `organizer_name`, `operational_status`, `evidence_confidence`, `event_start_date`, `registration_deadline_at`, and the support enums). Identity is `event_id`.

Child routes, all under the existing `/api/hackathons` proxy:

| Method | Path |
|--------|------|
| GET, POST | `/api/hackathons/categories` |
| GET, POST | `/api/hackathons/team-members` |
| GET, POST | `/api/hackathons/contributions` |
| GET, POST | `/api/hackathons/:id/sources` |
| GET, POST | `/api/hackathons/:id/tracks` |
| GET, POST | `/api/hackathons/:id/benefits` |
| GET, POST | `/api/hackathons/:id/milestones` |
| GET, POST | `/api/hackathons/:id/categories` |
| GET, PUT | `/api/hackathons/:id/shortlist` |
| GET, POST | `/api/hackathons/:id/requirements` |
| PATCH | `/api/hackathons/:id/requirements/:requirementId` |
| GET, POST | `/api/hackathons/:id/verifications` |

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

The live tables are `hackathon_research` in `supabase/migrations/20261020180000_hackathon_research.sql`.

- `event_end_date` is on or after `event_start_date`.
- `team_size_max` is greater than or equal to `team_size_min`.
- `registration_fee_amount` is zero or greater, and `registration_fee_currency` is a three-letter uppercase code.
- An event cannot be `duplicate_of_event_id` of itself.
- A second event with the same name, start date, city, and country returns HTTP 409.
- Shortlist rows require `why_practical`. Apply Now is `queue_type = apply_now` on `shortlist_entries`.
- A follow-up cannot store `confirmed_answer` while `response_status` is `draft`.
- Follow-up statuses are `draft`, `sent`, `responded`, `closed`, and `no_response`.

See `docs/RESEARCH-SOP.md` for human research standards.
