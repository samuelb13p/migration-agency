# Migration Agency Document Portal MVP

This repository contains a production-oriented MVP for a migration agency document upload and verification system. It uses a monorepo structure with an Express + Prisma backend, a Next.js frontend, PostgreSQL, JWT-based authentication, private file storage abstractions, and server-side PDF generation.

## What is included

- Phase 1 design documentation in [docs/phase-1-architecture.md](/C:/Users/samue/Documents/New%20project/docs/phase-1-architecture.md)
- PostgreSQL Prisma schema and initial SQL migration
- Modular Express API scaffold for:
  - auth
  - profile
  - visa types and required documents
  - cases
  - uploads and secure download tokens
  - reviews
  - notifications
  - contracts
  - admin user management
- Next.js App Router frontend scaffold for customer, agent, and admin dashboards
- Prisma seed data for local development
- Dockerfiles and `docker-compose.yml`
- Unit tests for auth validation, RBAC logic, and completeness calculations

## Repository structure

```text
apps/
  api/        Express + Prisma backend
  web/        Next.js App Router frontend
packages/
  shared/     Shared enums and Zod schemas
docs/
  phase-1-architecture.md
```

## Local setup

1. Copy `.env.example` to `.env` at the repository root and update values as needed.
2. Install dependencies:

```bash
npm install
```

3. Generate the Prisma client:

```bash
npm run prisma:generate -w @migration-agency/api
```

4. Start PostgreSQL with Docker or use an existing instance:

```bash
docker compose up -d postgres
```

This compose file maps PostgreSQL to host port `5432`.

5. Run the database migration:

```bash
npm run prisma:migrate -w @migration-agency/api
```

6. Seed demo data:

```bash
npm run prisma:seed -w @migration-agency/api
```

7. Run the backend:

```bash
npm run dev:api
```

8. Run the frontend:

```bash
npm run dev:web
```

Frontend default URL: [http://localhost:3000](http://localhost:3000)  
Backend default URL: [http://localhost:4000](http://localhost:4000)

## Demo accounts

- Admin: `admin@migration.local` / `ExamplePass123!`
- Agent: `agent@migration.local` / `ExamplePass123!`
- Customer: `customer@migration.local` / `ExamplePass123!`

## Notes on the current MVP state

- The backend domain structure, schema, routes, and core workflow scaffolding are implemented.
- The frontend is currently a professional scaffold with representative dashboard pages and sample data-driven layouts.
- Storage is implemented with a local private driver for development and is intentionally abstracted for later S3-compatible replacement.
- Email delivery uses Nodemailer. If SMTP is configured, customer access emails can be sent for agent-created visa cases. Without SMTP, the API falls back to a safe development transport.
- Government or third-party migration integrations are intentionally out of scope.

## Recommended next steps

1. Install dependencies and run the Prisma client generation.
2. Connect the frontend forms and dashboard pages to live backend endpoints.
3. Add integration tests with a real test database container.
4. Replace local storage with S3-compatible object storage and tighten signed URL policies.
5. Add refresh-token cookies, CSRF strategy, and production deployment configuration.
