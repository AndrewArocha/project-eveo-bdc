# Eveo BDC

A comprehensive full-stack SaaS platform engineered to modernize operational management, lead tracking, and floor coordination for automotive Business Development Centers (BDCs) and dealership showrooms.

Built to solve real-world dealership workflow challenges, Eveo BDC bridges the communication gap between internet lead agents, floor sales representatives, and executive management through real-time event tracking and role-specific workspaces.

## 🚀 Core Features

* **Role-Based Workspaces:** Dynamically rendered dashboards tailored to specific operational roles (BDC Agent, Sales Representative, General Manager, Dealership Owner), featuring calculated KPIs and actionable metric cards.
* **Live Showroom Event Feed:** A real-time timeline tracking customer visits from the initial greeting to the final BDC handoff, complete with status indicators, media uploads, and salesperson assignment.
* **NHTSA vPIC API Integration:** Live, automated VIN decoding for precise vehicle specifications (vehicles of interest and customer trade-ins) directly within the showroom check-in flow.
* **Interactive Hub Architecture:** A highly fluid UI featuring drag-to-close swipeable modals and bottom sheets powered by Framer Motion, optimized for both desktop command centers and mobile showroom tablets.
* **Payroll & Disbursements Engine:** Managerial interface for calculating contractor commissions, tracking base accrued pay, and processing zero-out ledger transactions.
* **Master Schedule & Roster Management:** Interactive smart calendars tied to real-time system dates for managing time-off requests, shift assignments, and daily coverage.
* **Mock State Persistence:** A custom `localStorage` repository adapter simulating backend latency and cross-component state synchronization, ensuring a seamless offline development and demo experience prior to backend hookup.

## 🛠 Tech Stack

**Frontend Architecture**
* **Framework:** React 18 / Vite
* **Language:** Strict TypeScript
* **Styling:** Tailwind CSS v4 
* **Animation:** Framer Motion
* **Icons:** Lucide React
* **Routing:** React Router DOM

**Backend Architecture (Phase 2)**
* **Runtime:** Node.js
* **Framework:** Express
* **Database:** MongoDB / Mongoose

**Third-Party Integrations**
* **Automotive:** NHTSA vPIC API
* **(Upcoming)AI Processing:** OpenAI API 🔜


## 🏗 Architecture & Workflow

This project operates on a decoupled client/server architecture. The frontend is fully modularized with a strict separation of concerns between UI components, context providers, and data fetching services. 

Development adheres to a strict Pull Request-driven Git workflow, enforced by aggressive ESLint rules and TypeScript strict mode configurations to ensure a pristine, zero-error continuous integration environment.

## 💻 Local Development

**1. Clone the repository and navigate to the client directory:**
```bash
git clone [https://github.com/AndrewArocha/project-eveo-bdc.git](https://github.com/AndrewArocha/project-eveo-bdc.git)
cd project-eveo-bdc/client
```

**2. Install dependencies:**
```bash
npm install
```

**3. Start the Vite development server:**
```bash
npm run dev
```

**4. Run the linter to ensure strict compliance:**
```bash
npm run lint
```