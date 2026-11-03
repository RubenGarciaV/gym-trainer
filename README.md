# Gym Trainer API

Node.js, Express, TypeScript, Prisma ORM, and Prisma Postgres API for `gym-trainer-ui`. The Express app is exported from `src/index.ts` for deployment as a Vercel Function. The API is intended to live in a separate Vercel project from the UI.

## Local setup

1. Install Node.js 26 and run `npm install`.
2. This repository is linked to the Vercel project `gym-trainer-api`, which is connected to the Prisma Postgres resource `gym-trainer-db`.
3. Pull the linked environment variables with `vercel env pull .env.local --yes`.
4. Ensure `.env.local` contains `DATABASE_URL` (direct connection for Prisma CLI) and `DATABASE_URL_POOLED` (pooled connection for API runtime traffic).
5. Run `npm run db:generate`, then `npm run dev`.

The app loads `.env.local` and `.env` for local development. Do not commit either file.

## API

- `GET /api/v1/health` — liveness check; does not require the database.
- `GET /api/v1/health/database` — checks the Prisma Postgres connection and returns `503` if unavailable.

Set `CORS_ORIGINS` to a comma-separated list of UI origins. By default, local Vite (`http://localhost:5173`) and Create React App (`http://localhost:3000`) origins are allowed.

## Database commands

- `npm run db:generate` — generate the Prisma Client.
- `npm run db:push` — push the current schema to the database (development only).
- `npm run db:migrate` — create and apply a development migration.
- `npm run db:deploy` — apply committed migrations in deployment environments.

The schema intentionally starts without application models; add domain models and migrations when the UI's data requirements are defined. Use the direct `DATABASE_URL` for Prisma CLI commands and migrations, and the pooled `DATABASE_URL_POOLED` for runtime traffic.

## Validation

- `npm test`
- `npm run build`
