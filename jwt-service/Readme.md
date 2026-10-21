# JWT service

Signs stateless HS256 tokens after checking `hackathon_research.app_users`, and checks those tokens on `POST /verify`. Verification looks at the signature, issuer, and expiry only.

The gateway is the only caller. `POST /login` and `POST /verify` require `X-Gateway-Caller: team-2-gateway` and `X-Gateway-Secret`. Health routes stay open. The signing secret stays in this service.

## Run locally

1. Apply `supabase/migrations/20261021140000_app_users.sql`.
2. Copy `.env.example` to `.env`. Use the same database URL and `GATEWAY_INTERNAL_SECRET` as the gateway. Keep `JWT_SECRET` only here.
3. `npm install && npm run dev` (port **4004**).

When the seed email and password variables are set, those three accounts are created or updated on startup. The frontend calls `POST http://localhost:4000/api/auth/login`, not this port.
