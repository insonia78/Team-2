# JWT service

Signs HS256 tokens after a local password check or a Codyza LDAP bind, stores the token id and claim hash in `auth.jwt_tokens`, and checks both on `POST /verify`. The account role in `auth.app_users` has to match the token. The raw JWT is not stored.

The gateway is the only caller. `POST /login`, `POST /verify`, `POST /logout`, `POST /users/:id/revoke-sessions`, `POST /invitations`, and `POST /invitations/accept` require `X-Gateway-Caller: team-2-gateway` and `X-Gateway-Secret`. Health routes stay open. The signing secret stays in this service. An admin invitation stores only a hash of the one-time token and asks the mail service to send the link. Accepting it creates a local account and signs a token.

## Run locally

1. Apply `supabase/auth/001_auth.sql` on the auth project.
2. Copy `.env.example` to `.env`. Set `AUTH_DATABASE_URL` to that project. Keep `JWT_SECRET` only here. Generate it with `openssl rand -base64 32`.
3. `npm install && npm run dev` (port **4004**).

When the seed email and password variables are set, those three local accounts are created or updated on startup. The frontend calls `POST http://localhost:4000/api/auth/login`, not this port.

Set `LDAP_URL`, `LDAP_BIND_DN`, `LDAP_BIND_PASSWORD`, `LDAP_BASE_DN`, and the `LDAP_GROUP_*` names when Codyza directory login should run before the local password check. Set `MAIL_SERVICE_URL` when invite emails should be sent.
