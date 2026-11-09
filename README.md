# EVEO BDC

EVEO is a dealership operations platform with a React client and an independently runnable TypeScript API. The API uses MongoDB/Mongoose, bcrypt password hashing, and JWT sessions. New dealership registrations create a pending application; account activation and billing are separate steps.

## Etapa 2 review deployment

- Frontend on Vercel: [EVEO registration](https://project-eveo-bdc-stage.vercel.app/register)
- API on Render: [API base URL](https://project-eveo-bdc.onrender.com/api) and [health check](https://project-eveo-bdc.onrender.com/api/health)

Register with a test account, sign in, then choose **My Customers** in Store Administration. Create a fictional customer, reload to confirm it was saved in MongoDB, then delete it. The Customers screen lists records you own in the active store. The **Demo** workspace uses temporary sample data.

## Requirements

- Node.js 20 or later
- npm 10 or later
- A MongoDB Atlas connection string for persistent API operations

## Install and run

From the repository root:

```bash
npm run install:all
```

Copy `server/.env.example` to `server/.env`, set `MONGODB_URI`, and replace `JWT_SECRET` with a random secret of at least 32 characters. Email verification is on by default in production. For a private staging/demo environment only, set `AUTH_EMAIL_VERIFICATION_REQUIRED=false` to allow account creation and sign-in without sending email. Re-enable it before opening registration to the public. To send verification links, configure `RESEND_API_KEY` and `AUTH_EMAIL_FROM` with a verified sending domain, and set `CLIENT_ORIGIN` to the public client origin so links return to the right site. The development client uses `/api` and the Vite proxy, so its API origin is configured by the existing Vite setup. For a separate deployment, set `VITE_API_URL` to the public API base URL and configure `CLIENT_ORIGIN` on the server.

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
- `GET /api/customers?search=...&storeId=...` queries the signed-in user's customer records in an authorized store.
- `POST /api/customers` assigns ownership to the signed-in user. An existing email can match a record the caller owns. An email on another user's record returns `409`.
- `GET|PATCH|DELETE /api/customers/:id` enforces individual ownership and store access. Attempts to delete another user's record return `403`. Dealership owners can set cross-store links on their own customer records through `PATCH /api/customers/:id/sharing`.
- `GET /api/inventory?storeId=...&status=...&search=...` lists vehicles for a store in the signed-in user's dealer account.
- `POST /api/inventory` creates an inventory vehicle; repeated VINs in the same store are idempotent, while an existing VIN in another store returns a conflict for reconciliation.
- `POST /api/inventory/imports/csv` imports up to 500 vehicles from a CSV (800 KB max); existing VINs are recorded as observations and disagreements are flagged rather than overwritten. `GET /api/inventory/imports?storeId=...` lists import jobs and row errors. Owners and managers can upload.
- `GET|PATCH /api/inventory/:id` reads or updates an account-owned inventory vehicle.
- `POST /api/inventory/:id/observations` records a source observation and opens a discrepancy when a field conflicts with the current record.
- `PATCH /api/inventory/:id/discrepancies/:discrepancyId` accepts the observed value or keeps the current value.
- `GET /api/leads?storeId=...` lists leads for an owned store; `POST /api/leads` creates a lead linked only to a customer and inventory vehicle in that same store.
- `GET /api/appointments?storeId=...` lists a store's appointments; `POST /api/appointments` validates its customer, lead, and inventory links against that store.
- `PATCH /api/appointments/:id/status?storeId=...` updates an appointment in the selected owned store. Cancelled appointments are terminal.
- `PATCH /api/appointments/:id?storeId=...` reschedules or reassigns an open appointment and records the change history.
- `PATCH /api/leads/:id?storeId=...` updates lead status/assignment and records a history entry. Appointment status changes enforce valid lifecycle transitions and cannot be booked against sold or delivered inventory.
- `GET|POST /api/deals?storeId=...` lists and creates store deals; `PATCH /api/deals/:id/status?storeId=...` progresses the sale, delivery, cancellation, or reversal lifecycle and synchronizes linked inventory, lead, and appointment state.
- `GET|POST /api/follow-ups?storeId=...` manages assigned follow-ups; `PATCH /api/follow-ups/:id/status?storeId=...` completes or cancels them.
- `GET /api/showroom?storeId=...` lists visits; `POST /api/showroom` checks in a customer. A visit and its initial event are persisted in MongoDB, with customer, lead, appointment, employee and store links checked against the same dealer account.
- `GET /api/showroom/:id?storeId=...`, `POST /api/showroom/:id/events?storeId=...` and `PATCH /api/showroom/:id/assignment?storeId=...` load visits, append timeline events and reassign an active visit. Closed visits cannot be changed.
- `POST /api/showroom/media?storeId=...` uploads private 25 MB showroom assets to MongoDB GridFS; `GET /api/showroom/media/:id/content` streams them only to an authorized account user assigned to that store.
- `GET /api/activity?storeId=...` lists attributed activities; `POST /api/activity` records a staff-authored note for an owned store. Showroom check-ins, timeline events and assignments also generate linked activity records automatically.
- `GET|POST /api/integrations?storeId=...` lists or saves an owner's store-specific provider credentials. Secrets are AES-256-GCM encrypted with `INTEGRATION_ENCRYPTION_KEY` and never returned by the API. `DELETE /api/integrations/:id` disables a connection. Saving credentials does not claim that an external provider sync is connected.
- `GET /api/reports/summary?storeId=...&startAt=...&endAt=...` calculates versioned store KPIs for a store-local date range. It returns formulas, metric notes, and a capped sample of source records. Owners and managers also see per-employee assignment/activity counts. `GET /api/reports/snapshots?storeId=...` lists snapshot metadata, `GET /api/reports/snapshots/:id` loads a snapshot, and `POST /api/reports/snapshots` saves an immutable report payload for owners and managers. KPI reads are limited to owners, managers, and BDC employees; saved snapshots are restricted to owners and managers.
- `POST /api/eve/respond` provides store-scoped inventory, lead, appointment, deal and follow-up counts. Set `OPENAI_API_KEY` to enable generated analysis through the OpenAI Responses API; without it E.V.E. returns deterministic summaries with their evidence.
- `GET|POST /api/marketing/campaigns?storeId=...` saves campaign drafts referencing media events; `PATCH /api/marketing/campaigns/:id/status` submits drafts for approval or approves them. External publishing is not enabled until channel OAuth/app credentials are configured.
- `GET|PATCH /api/account/onboarding` reads owner onboarding progress and records completed setup steps; `PATCH /api/account/store` updates the first store profile. Platform account review at `GET|PATCH /api/account/platform` is restricted to emails in `PLATFORM_ADMIN_EMAILS`.
- `POST /api/signup` and `POST /api/signin` are concise aliases for the `/api/auth/...` registration and sign-in routes used by the assessment checklist.
- `GET /api/health` reports API liveness without depending on the database.

All routes except registration, sign-in, invitation acceptance, and health require `Authorization: Bearer <token>`. Store creation and updates are owner-only; single-store accounts cannot add stores. Non-owner employees can access only assigned stores. Customer, inventory, lead, appointment, showroom and activity endpoints enforce store scope on both list and record operations. Client-supplied dealer account IDs are ignored. Request bodies are validated before database operations. The API does not return password hashes or invitation token hashes.

Integration credential storage requires a unique 32-byte hex `INTEGRATION_ENCRYPTION_KEY` in each backend environment. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`; store it in Render's secret environment settings and back it up securely. `OPENAI_API_KEY` enables AI-generated analysis and incurs provider charges. `PLATFORM_ADMIN_EMAILS` is a comma-separated allowlist for EVEO platform account reviewers. Do not commit these values.

## Quality commands

```bash
npm run build
npm run lint
```

## Current implementation scope

The current full-stack scope includes tenant-scoped customer sharing, inventory import, leads, appointment lifecycle, deals, follow-ups, showroom events and private media, versioned KPIs and snapshots, deterministic E.V.E. metrics tools, optional server-side AI analysis, campaign draft approval, onboarding progress, and platform account review. CRM, messaging, payment and social network connections still need provider credentials and their external account/app registrations; campaign publishing and subscription billing are not represented as active until those are connected. KPI reporting does not include external call/SMS/email events that have not been imported.

Active store selection now reads authenticated stores from the API and demo stores from the canonical domain repository. Phase 1 store metadata and data remain available through a compatibility adapter while those screens migrate to persistent records.
