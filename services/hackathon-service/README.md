# Hackathon Service

Domain microservice for Codyza hackathon research records.

## Data access (portable)

- **PostgreSQL** via standard `DATABASE_URL` connection string
- **Drizzle ORM** (no Supabase SDK) — migrate to any Postgres host by changing the connection string
- SQL bootstrap scripts live in `../../supabase/migrations/` (plain PostgreSQL, not Supabase-specific logic)
- Research rules are also database checks. Apply `20261019120000_table_rules_and_comments.sql` after the earlier migrations
- Logs: JSON on stdout, readable lines in development, optional `LOG_FILE_PATH`

## Run locally

1. Supabase → **Settings → Database → Connection string → URI** (replace `[YOUR-PASSWORD]`)
2. Create `.env` from `.env.example` with `DATABASE_URL=...`
3. Ensure migrations were applied (SQL Editor)
4. `npm install && npm run dev` (port **4001**)

Clients should call the **gateway** on port 4000 in production.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests |
| `npm run db:studio` | Drizzle Studio (optional) |
