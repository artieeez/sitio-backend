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
pnpm run openapi:check   # smoke-check sibling OpenAPI + route strings (requires ../sitio-design-notes)
pnpm run lint        # Biome check + format fixes
pnpm run format      # Biome format only
```

### Database schema and migrations (human-run)

1. Ensure `DATABASE_URL` is set (see `.env.example`). Prisma 7 reads the URL from **`prisma.config.ts`** for CLI commands; the `datasource` block in `prisma/schema.prisma` declares only the provider.
2. After any change to `prisma/schema.prisma`, create and apply a migration locally (or in CI with your team’s workflow):

   ```bash
   pnpm exec prisma migrate dev --name describe_your_change
   ```

   **Agents** update the schema and docs only; **do not** commit generated migration SQL unless your process explicitly requires it—humans normally run the command above and commit the `prisma/migrations/` output.
3. Regenerate the client after schema changes (usually automatic after `migrate dev`; otherwise `pnpm exec prisma generate`).

## Stack

- NestJS 11, **strict TypeScript** (`tsconfig.json`)
- **@nestjs/cqrs**, **@nestjs/config**, **Prisma 7** (`prisma/schema.prisma` + `prisma.config.ts` for CLI `DATABASE_URL`)
- Runtime DB access: **`pg`** + **`@prisma/adapter-pg`** (see `PrismaService`); `DATABASE_URL` must be set at process start.
- Lint/format: **Biome**

## Wix API exploration (Bruno)

Manual calls to Wix REST endpoints (before implementing them in Nest) live in **`bruno/wix-api/`**. Open that folder as a [Bruno](https://www.usebruno.com/) collection; see `bruno/wix-api/README.md`. Implemented in code: `WixApiService` (`getProduct`, `getCatalogVersion`, `queryCollections`).

## Design references

- [Quickstart & local setup](../sitio-design-notes/specs/001-school-trip-payments/quickstart.md) (sibling repo under the same parent folder as this repo)
- OpenAPI: `sitio-design-notes/specs/001-school-trip-payments/contracts/openapi.yaml`

## NestJS resources

[NestJS documentation](https://docs.nestjs.com)
