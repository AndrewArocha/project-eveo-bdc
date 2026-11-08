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
- `GET /api/users?storeId=...` lists active employees who can access that store.
- `POST /api/users/invitations` lets an owner invite a manager, BDC representative or salesperson to one or more active stores. The response contains a single-use token; only its hash is stored. `GET /api/users/invitations?storeId=...` lists pending invitations, and `DELETE /api/users/invitations/:id` revokes one.
- `POST /api/auth/accept-invitation` accepts a valid invitation, creates the employee account transactionally and returns a JWT. Invitations expire after seven days. Email delivery is not configured; owners copy and share the returned link.
- `GET /api/stores` lists all stores for an owner and only assigned stores for other employees.
- `POST /api/stores` creates a store under the signed-in owner's dealer account.
- `PATCH /api/stores/:id` updates only a store owned by that dealer account.
- `GET /api/customers?search=...&storeId=...` queries customers within an assigned store.
- `POST /api/customers` creates a customer or returns the matching same-store record when its email already exists. Cross-store duplicates return a conflict until an explicit sharing workflow exists.
- `GET|PATCH|DELETE /api/customers/:id` reads or changes records only within the signed-in user's assigned store.
- `GET /api/inventory?storeId=...&status=...&search=...` lists vehicles for a store in the signed-in user's dealer account.
- `POST /api/inventory` creates an inventory vehicle; repeated VINs in the same store are idempotent, while an existing VIN in another store returns a conflict for reconciliation.
- `GET|PATCH /api/inventory/:id` reads or updates an account-owned inventory vehicle.
- `POST /api/inventory/:id/observations` records a source observation and opens a discrepancy when a field conflicts with the current record.
- `PATCH /api/inventory/:id/discrepancies/:discrepancyId` accepts the observed value or keeps the current value.
- `GET /api/leads?storeId=...` lists leads for an owned store; `POST /api/leads` creates a lead linked only to a customer and inventory vehicle in that same store.
- `GET /api/appointments?storeId=...` lists a store's appointments; `POST /api/appointments` validates its customer, lead, and inventory links against that store.
- `PATCH /api/appointments/:id/status?storeId=...` updates an appointment in the selected owned store. Cancelled appointments are terminal.
- `GET /api/showroom?storeId=...` lists visits; `POST /api/showroom` checks in a customer. A visit and its initial event are persisted in MongoDB, with customer, lead, appointment, employee and store links checked against the same dealer account.
- `GET /api/showroom/:id?storeId=...`, `POST /api/showroom/:id/events?storeId=...` and `PATCH /api/showroom/:id/assignment?storeId=...` load visits, append timeline events and reassign an active visit. Closed visits cannot be changed.
- `GET /api/activity?storeId=...` lists attributed activities; `POST /api/activity` records a staff-authored note for an owned store. Showroom check-ins, timeline events and assignments also generate linked activity records automatically.
- `POST /api/signup` and `POST /api/signin` are concise aliases for the `/api/auth/...` registration and sign-in routes used by the assessment checklist.
- `GET /api/health` reports API liveness without depending on the database.

All routes except registration, sign-in, invitation acceptance, and health require `Authorization: Bearer <token>`. Store creation and updates are owner-only; single-store accounts cannot add stores. Non-owner employees can access only assigned stores. Customer, inventory, lead, appointment, showroom and activity endpoints enforce store scope on both list and record operations. Client-supplied dealer account IDs are ignored. Request bodies are validated before database operations. The API does not return password hashes or invitation token hashes.

## Quality commands

```bash
npm run build
npm run lint
```

## Current implementation scope

Authentication, registration, store provisioning, employee invitations and store assignments, customer and inventory records, plus initial lead, appointment, showroom and activity operations establish the persistent full-stack workflows. Authenticated showroom sessions use the tenant-scoped API; unauthenticated sessions retain the local demonstration adapter. Authenticated media uploads remain disabled until an authorized object-storage integration is configured. KPI reporting, deterministic E.V.E. tools, billing, and external integrations remain follow-up milestones.

Active store selection now reads authenticated stores from the API and demo stores from the canonical domain repository. Phase 1 store metadata and data remain available through a compatibility adapter while those screens migrate to persistent records.
