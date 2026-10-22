# Authorization

Password checks, invitation links, and token signing live in `jwt-service/`. The gateway asks that service to verify stateless JWTs and enforces `viewer`, `researcher`, and `admin`. See `docs/API.md`.
