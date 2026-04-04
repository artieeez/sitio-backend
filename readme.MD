# sitio-backend

NestJS HTTP API for **Sítio** — feature **001-school-trip-payments** (school trip pending payments dashboard): schools, school-scoped trips, passengers, trip-scoped manual payments, and derived payment status. Specs and contracts live in the sibling design-notes repo (see links below).

## Environment

| Variable        | Description |
|-----------------|-------------|
| `DATABASE_URL`  | PostgreSQL connection string for Prisma. Local dev typically uses host `localhost` port `5432`. Copy from `.env.example` and set user, password, and database name. |

Example:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sitio_dev"
```

## Scripts

```bash
pnpm install
pnpm run start:dev   # watch mode
pnpm run build
pnpm run test
pnpm run test:e2e
pnpm run lint        # Biome check + format fixes
pnpm run format      # Biome format only
```

After `prisma/schema.prisma` exists, apply migrations locally (human/CI): `pnpm exec prisma migrate dev`.

## Stack

- NestJS 11, **strict TypeScript** (`tsconfig.json`)
- **@nestjs/cqrs**, **@nestjs/config**, **Prisma** (schema and migrations in Phase 2+)
- Lint/format: **Biome**

## Design references

- [Quickstart & local setup](../sitio-design-notes/specs/001-school-trip-payments/quickstart.md) (sibling repo under the same parent folder as this repo)
- OpenAPI: `sitio-design-notes/specs/001-school-trip-payments/contracts/openapi.yaml`

## NestJS resources

[NestJS documentation](https://docs.nestjs.com)
