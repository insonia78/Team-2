# Gateway

Central API for Codyza hackathon research and optional proxy to future services.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm run typecheck` | Type check |
| `npm test` | Unit tests |

## Features

- Hackathon CRUD + Codyza verification rules
- Views: Apply Now, shortlist, deadlines, virtual/hybrid, travel-supported, monitor
- Organizer follow-up log
- CSV exports for submission packages
- Access control (IP/path allow & block lists)
- Admin APIs for runtime blocks
- REST/GraphQL proxy routes (configurable upstream)
- Health checks for load balancers
- Docker image

See `../docs/API.md` and `../docs/DEPLOYMENT.md`.
