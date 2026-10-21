# JWT service

Signs stateless HS256 tokens after checking `hackathon_research.app_users`.

The gateway is the only caller. `POST /login` requires `X-Gateway-Caller: team-2-gateway` and `X-Gateway-Secret`. Health routes stay open.

## Run locally

1. Apply `supabase/migrations/20261021140000_app_users.sql`.
2. Copy `.env.example` to `.env`. Use the same database URL, `JWT_SECRET`, and `GATEWAY_INTERNAL_SECRET` as the gateway.
3. `npm install && npm run dev` (port **4004**).

When the seed email and password variables are set, those three accounts are created or updated on startup. The frontend calls `POST http://localhost:4000/api/auth/login`, not this port.
