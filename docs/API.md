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

## Verification rules (summary)

- Verified statuses require evidence links, verifier ≠ researcher, confidence ≠ Low.
- Shortlist requires `shortlist_rationale`.
- Duplicate `official_website` returns HTTP 409.

See `docs/RESEARCH-SOP.md` for human research standards.
