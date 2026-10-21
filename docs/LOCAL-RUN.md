# Local run (gateway + hackathon-service)

## 1. Database connection string

Supabase is **PostgreSQL hosting**. The service does not use the Supabase JS client.

1. Supabase Dashboard → **Settings → Database**
2. **Connection string** → **URI**
3. Copy and replace `[YOUR-PASSWORD]` with your database password

Example shape (region may vary):

```text
postgresql://postgres.qdnbwzyhuzgvosploprb:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

## 2. Hackathon service env

`services/hackathon-service/.env`:

```env
DATABASE_URL=postgresql://postgres.qdnbwzyhuzgvosploprb:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
DATABASE_SSL=true
PORT=4001
GATEWAY_INTERNAL_SECRET=local-dev-gateway-secret
```

Apply `supabase/migrations/20261021140000_app_users.sql` in the SQL editor after the research schema, then `supabase/migrations/20261021180000_invitations.sql`.

## 3. JWT service env

`jwt-service/.env` uses the same `DATABASE_URL` and `GATEWAY_INTERNAL_SECRET` as the other services. `JWT_SECRET` belongs only in this file. See `jwt-service/.env.example` for the three local seed accounts.

## 4. Gateway env

`gateway/.env`:

```env
PORT=4000
HACKATHON_SERVICE_URL=http://127.0.0.1:4001
JWT_SERVICE_URL=http://127.0.0.1:4004
GATEWAY_INTERNAL_SECRET=local-dev-gateway-secret
```

## 5. Install dependencies (once)

From repo root `Team-2`:

```powershell
cd "D:\AIWorks\Codyza\HACKATHON OPPORTUNITY RESEARCH\Team-2"
npm run install:all
```

## 6. Start (three terminals — use full paths, not `...`)

**Terminal 1 — JWT service**

```powershell
cd "D:\AIWorks\Codyza\HACKATHON OPPORTUNITY RESEARCH\Team-2\jwt-service"
npm run dev
```

**Terminal 2 — hackathon service**

```powershell
cd "D:\AIWorks\Codyza\HACKATHON OPPORTUNITY RESEARCH\Team-2\services\hackathon-service"
npm run dev
```

**Terminal 3 — gateway**

```powershell
cd "D:\AIWorks\Codyza\HACKATHON OPPORTUNITY RESEARCH\Team-2\gateway"
npm run dev
```

**Or from repo root:**

```powershell
cd "D:\AIWorks\Codyza\HACKATHON OPPORTUNITY RESEARCH\Team-2"
npm run dev:jwt
# separate terminals:
npm run dev:hackathon
npm run dev:gateway
```

**Or auto-open three windows:**

```powershell
cd "D:\AIWorks\Codyza\HACKATHON OPPORTUNITY RESEARCH\Team-2"
.\scripts\start-dev.ps1
```

Do **not** run `npm run dev` from `Team-2` alone until `package.json` exists at root (use commands above).

## 7. Test via gateway

```bash
curl http://localhost:4000/health/ready
curl -X POST http://localhost:4000/api/auth/login -H "content-type: application/json" -d "{\"email\":\"viewer@local\",\"password\":\"change-me-viewer\"}"
curl http://localhost:4000/api/hackathons -H "authorization: Bearer TOKEN"
```

`viewer` can read. `researcher` can create and update. `admin` can also call `/admin/*`.

## 8. Logs

With `npm run dev`, the terminal prints a readable line for each request. The same record is appended as JSON to `logs/gateway.log` and `logs/hackathon-service.log` when `LOG_FILE_PATH` is set. Startup prints `logging to stdout and file` when the file is in use.

Apply the latest SQL migration in the Supabase SQL editor before relying on the new table rules:

`supabase/migrations/20261019120000_table_rules_and_comments.sql`
