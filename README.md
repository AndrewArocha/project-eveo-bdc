# EVEO BDC

EVEO is a dealership operations platform with a React client and an independently runnable TypeScript API. The API uses MongoDB/Mongoose, bcrypt password hashing, and JWT sessions. New dealership registrations create a pending application; account activation and billing are separate steps.

## Requirements

- Node.js 20 or later
- npm 10 or later
- A MongoDB Atlas connection string for persistent API operations

## Install and run

From the repository root:

```bash
npm run install:all
```

Copy `server/.env.example` to `server/.env`, set `MONGODB_URI`, and replace `JWT_SECRET` with a random secret of at least 32 characters. The development client uses `/api` and the Vite proxy, so its API origin is configured by the existing Vite setup. For a separate deployment, set `VITE_API_URL` to the public API base URL and configure `CLIENT_ORIGIN` on the server.

```bash
npm run dev:server
npm run dev:client
```

Or run both processes together with `npm run dev`. The client listens on port 3000 and the API listens on port 3001 by default. `GET /api/health` remains available when MongoDB is not configured; data routes return 503 until a database connection is ready.

## API

- `POST /api/auth/signup` creates a user, a pending DealerAccount, and its first Store.
- `POST /api/auth/signin` verifies the password and returns a short-lived JWT.
- `GET /api/users/me` returns the signed-in user's safe profile.
- `GET /api/stores` lists stores belonging to the signed-in user's dealer account.
- `POST /api/stores` creates a store under the signed-in owner's dealer account.
- `PATCH /api/stores/:id` updates only a store owned by that dealer account.
- `GET /api/customers?search=...&storeId=...` queries customers within the signed-in user's dealer account.
- `POST /api/customers` creates a customer or returns the matching dealer-account record when its email already exists.
- `GET|PATCH|DELETE /api/customers/:id` reads or changes records only within the signed-in user's dealer account.
- `GET /api/inventory?storeId=...&status=...&search=...` lists vehicles for a store in the signed-in user's dealer account.
- `POST /api/inventory` creates an inventory vehicle; VINs are deduplicated across the dealer account.
- `GET|PATCH /api/inventory/:id` reads or updates an account-owned inventory vehicle.
- `POST /api/inventory/:id/observations` records a source observation and opens a discrepancy when a field conflicts with the current record.
- `PATCH /api/inventory/:id/discrepancies/:discrepancyId` accepts the observed value or keeps the current value.
- `GET /api/health` reports API liveness without depending on the database.

All routes except registration, sign-in, and health require `Authorization: Bearer <token>`. Store creation and updates are owner-only; customer and inventory reads and writes are tenant-scoped. Client-supplied dealer account IDs are ignored. Request bodies are validated before database operations. The API does not return password hashes.

## Quality commands

```bash
npm run build
npm run lint
```

## Current implementation scope

Authentication, registration, store provisioning, customer records, and inventory repositories establish the initial persistent full-stack workflows. The EVEO product roadmap still calls for authorized inventory imports, lead and appointment operations, LiveActivity, KPI reporting, deterministic E.V.E. tools, billing, and external integrations; these remain follow-up milestones.
