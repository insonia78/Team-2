# API Gateway

Central entry point for Team-2. **Does not contain business logic** — it routes traffic to microservices.

## Responsibilities

- Request logging (central-ready JSON)
- Rate limiting
- IP/path allow & block lists
- Admin access-control APIs
- Reverse proxy to:
  - `hackathon-service` — `/api/hackathons`, `/api/exports`, `/api/organizer-followups`
  - `ai-service` (future) — `/api/ai`
  - `scraper-service` (future) — `/api/scraper`
  - GraphQL — `/proxy/graphql`
- Health aggregation (`/health/ready` checks downstream services)

## Run locally

Start **hackathon-service first**, then gateway:

```bash
# Terminal 1
cd ../services/hackathon-service
cp .env.example .env
npm install && npm run dev

# Terminal 2
cd ../../gateway
# gateway/.env needs HACKATHON_SERVICE_URL=http://127.0.0.1:4001
npm install && npm run dev
```

Clients call **http://localhost:4000** only.

Inspect routes: `GET http://localhost:4000/gateway/routes`
