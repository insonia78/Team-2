# Deployment

## Local (development)

```bash
cd gateway
cp ../.env.example .env
npm install
npm run dev
```

## Docker (single instance)

```bash
docker compose up --build
```

## Redundancy (production pattern)

1. Build image from `gateway/Dockerfile`.
2. Run **2+ replicas** behind a load balancer (Railway, Render, AWS ALB, etc.).
3. Configure LB health check: `GET /health/ready`.
4. All instances use the same Supabase credentials.
5. Set `ADMIN_API_KEY`, rate limits, and optional `IP_ALLOWLIST`.

## Environment variables

See root `.env.example` (local) and `.env.production.example` (production template).

Required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Never commit `.env` or paste production secrets into GitHub. Use the hosting provider **Environment Variables** / **Secrets** UI.

Optional proxy upstreams:

- `PROXY_REST_UPSTREAM_URL`
- `PROXY_GRAPHQL_UPSTREAM_URL`
