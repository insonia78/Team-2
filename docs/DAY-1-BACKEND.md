# Day 1 Backend Checklist (jbiri03 / create gateway)

## What you are building today (simple)

You are creating the **back office** for the hackathon research project:

1. **Database table** where every hackathon record lives (Codyza required fields).
2. **API (gateway)** so the team can add and update records without touching SQL by hand.

Think: **Excel sheet + rules**, but proper software.

## Why today matters

- Frontend cannot build Apply Now / filters without data shape and API.
- Research team needs one place to store verified facts and evidence links.
- You unblock the whole Team-2 repo (currently empty placeholders).

## Your steps today

### 1. Supabase (30–45 min)

- [ ] Create Supabase project (team shared account recommended).
- [ ] Run `supabase/migrations/20261009120000_hackathons.sql` in SQL Editor.
- [ ] Confirm table `hackathons` exists.
- [ ] Copy Project URL + **service role** key (server only, never commit).

### 2. Gateway locally (30–45 min)

- [ ] `cd gateway && npm install`
- [ ] Create `gateway/.env` from `../.env.example`
- [ ] `npm run dev`
- [ ] `curl http://localhost:4000/health` returns ok

### 3. Prove CRUD (30 min)

- [ ] POST one draft hackathon (`Needs Confirmation`, `Low` confidence)
- [ ] GET list returns it
- [ ] PATCH update a field (e.g. registration_deadline)
- [ ] POST second record with same website → expect 409 duplicate

### 4. Sync with GitHub (20 min)

- [ ] Branch: `feat/gateway-day1-foundation`
- [ ] Commit gateway + supabase migration + docs (not `.env`)
- [ ] Push and open PR to `main`
- [ ] Post in Slack: API base URL, env vars needed, link to `docs/API.md`

## Not Day 1 (do later)

- Kubernetes / Docker infra
- AI scraper analysis
- CSV export endpoint
- Supabase Auth JWT on gateway
- Organizer follow-up table

## Demo script for standup

"I shipped Day 1 gateway: Supabase schema for Codyza fields, REST API for hackathon CRUD, duplicate check, and verification rules for Verified status. Frontend can integrate against docs/API.md."
