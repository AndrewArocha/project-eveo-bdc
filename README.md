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
- `GET|POST /api/customers` lists or creates records owned by the signed-in user.
- `GET|PATCH|DELETE /api/customers/:id` reads or changes only records owned by that user.
- `GET /api/health` reports API liveness without depending on the database.

All routes except registration, sign-in, and health require `Authorization: Bearer <token>`. Customer request bodies are validated before database operations. The API does not return password hashes.

## Quality commands

```bash
npm run build
npm run lint
```

## Current implementation scope

The authentication and owner-scoped customer workflow establish the first persistent full-stack slice. The EVEO product roadmap also calls for integrations, operational workflows, reports, deterministic E.V.E. tools, billing, production deployment, and external service credentials; these are separate milestones and are not represented as live integrations by the current demo data.
