# EVEO BDC

EVEO BDC is a full-stack platform for automotive Business Development Centers (BDCs) and dealership teams. It grew out of my [BDC Report Generator](https://github.com/AndrewArocha/BDC-Report-maker), which started as a way to format daily appointment reports. EVEO brings the work behind those reports into one place: staff can track leads, manage appointments, log showroom activity, and see how their store is performing.

[Staging preview](https://project-eveo-bdc-stage.vercel.app/) · [Full-stack source and setup guide](https://github.com/AndrewArocha/project-eveo-bdc/tree/stage-fullstack#readme) · [API health check](https://project-eveo-bdc.onrender.com/api/health)

## What’s implemented

- **Dealership workflows:** Manage customer records, inventory, leads, and appointments. Log showroom visits and staff activity, and track changes as appointments are reassigned or rescheduled.
- **Accounts and access:** Sign in with bcrypt-hashed passwords and JWT sessions. The API checks store access and record ownership before returning or changing data.
- **Frontend state:** React workspaces use shared state for live activity and connect to the API for persistent records.
- **E.V.E. assistant:** Ask about inventory, leads, appointments, deals, and follow-ups for the active store. The API can generate analysis through OpenAI when configured and returns summaries from store data when it isn’t.

**Stack:** React, TypeScript, Vite, Tailwind CSS, Node.js, Express, and MongoDB. The staging frontend runs on Vercel and the API runs on Render.

EVEO is in active development. Some external integrations, including subscription billing and campaign publishing, are still pending. The application code, local setup, and API details live on the [`stage-fullstack` branch](https://github.com/AndrewArocha/project-eveo-bdc/tree/stage-fullstack).
