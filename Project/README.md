# Luma — Student Support Operations
> **Fullstack Developer Assignment 1 (Sep 2026.1)**  
> **Tech Stack:** Next.js 16 (App Router) • React 19 • TypeScript • Tailwind CSS v4 • PostgreSQL (Prisma) • Zod • AI Copilot

---

## 📌 Executive Summary & Problem Space

**Why this is not a generic to-do list or basic CRUD app:**  
Most evaluation assignments fall back on mundane task managers. In contrast, **Luma** solves a high-stakes, multi-stakeholder challenge in educational institutions: **Tier 2 and Tier 3 Student Support Caseload Management**.

School counselors, academic specialists, and advisory educators face fractured communication when tracking vulnerable students across attendance drops, literacy challenges, wellbeing concerns, and behavioral interventions. Reducing a struggling student to a binary checkmark or generic task harms continuity of care.

**Luma models the clinical workflow as an observable `SupportPlan`:**
- **Why** the student requires support (Focus Area / Concern).
- **Who** holds clinical accountability (Assigned Case Lead).
- **What** observable, measurable milestone is being pursued (SMART Goal).
- **When** the multidisciplinary team will reconvene to evaluate progress (Review Deadline).
- **Urgency** triage (High, Medium, Low Priority).
- **AI-Powered Assistance** to generate pedagogical interventions and measurable milestones.
- **Granular RBAC** protecting sensitive student records under educational privacy guidelines (FERPA/COPPA principles).

---

## 📋 Evaluation Criteria & Compliance Matrix

| Requirement | Implementation in Luma | Source References |
| :--- | :--- | :--- |
| **Next.js 16 + React 19** | App Router, Server Components + Client interactivity, dynamic route handlers | [`src/app/page.tsx`](file:///Project/src/app/page.tsx), [`src/app/layout.tsx`](file:///Project/src/app/layout.tsx) |
| **TypeScript Type Safety** | Strict type definitions, schema inference, zero `any` usage | [`src/lib/types.ts`](file:///Project/src/lib/types.ts) |
| **PostgreSQL & Database Design** | Prisma schema with composite indexes on `[status, nextReview]` and `[owner]` | [`prisma/schema.prisma`](file:///Project/prisma/schema.prisma) |
| **Robust CRUD Functionality** | Full Create, Read, Update, Delete with status filtering, live search, and detail modal | [`src/app/api/plans/route.ts`](file:///Project/src/app/api/plans/route.ts), [`src/components/dashboard.tsx`](file:///Project/src/components/dashboard.tsx) |
| **Data Validation & Sanitization** | Zod schema boundary validation + automated script/HTML tag stripping against Stored XSS | [`src/lib/validation.ts`](file:///Project/src/lib/validation.ts) |
| **Role-Based Access Control (RBAC)** | Lead Counselor (Full CRUD), Specialist (Edit/Update), Observer (Read-Only) with UI role selector | [`src/app/api/plans/[id]/route.ts`](file:///Project/src/app/api/plans/%5Bid%5D/route.ts) |
| **AI Integration (Bonus Feature)** | AI Counselor Copilot generating SMART goals and evidence-based interventions via Gemini / Heuristics | [`src/app/api/ai/suggest/route.ts`](file:///Project/src/app/api/ai/suggest/route.ts) |
| **Testing Coverage** | Automated test suite verifying validation schemas, XSS mitigation, store CRUD, and RBAC policies | [`tests/plans.test.ts`](file:///Project/tests/plans.test.ts) |
| **CI/CD Pipeline** | GitHub Actions workflow automating linting, Prisma generation, testing, and production build | [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml) |
| **Export & Reporting** | Instant CSV caseload export for staff and department meetings | [`src/components/dashboard.tsx`](file:///Project/src/components/dashboard.tsx) |

---

## 🚀 Quick Start (Local Run)

The application includes an **in-memory zero-dependency store** enabled by default so reviewers can test the entire UI, CRUD operations, RBAC policies, and AI features immediately without needing a local PostgreSQL instance running.

### 1. Install & Launch

```bash
cd Project
npm install
npm run dev
```

Open your browser at: **`http://localhost:3000`**

### 2. Run Automated Tests

Execute the comprehensive test suite:
```bash
npm run test
```
*Runs 11 automated unit and integration tests covering Zod schemas, XSS filtering, CRUD operations, and RBAC rules.*

### 3. Verify Build & Linting

```bash
npm run lint
npm run build
```

---

## 🗄️ Optional: Connecting Live PostgreSQL

If you wish to run against a live PostgreSQL database:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your connection string in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/luma_edtech?schema=public"
   ```
3. Generate the Prisma client and push schema:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

---

## 🤖 AI Counselor Copilot Architecture

The AI module addresses real-world counselor cognitive overload:

1. **Endpoint**: `POST /api/ai/suggest`
2. **Behavior**:
   - **Cloud AI (Gemini 1.5 Flash)**: If `GEMINI_API_KEY` or `AI_API_KEY` is present in `.env`, the endpoint invokes Gemini with a pedagogical system prompt to construct tailored SMART goals, intervention strategies, and priority levels.
   - **Deterministic Clinical Playbook Engine (Fallback)**: If no API key is configured, an integrated evidence-based rules engine provides targeted milestones for *Attendance, Literacy, Wellbeing, Belonging, and Behavioral* categories.
3. **FERPA Protection**: Student identifiable information is anonymized before cloud inference.

---

## 🔐 Security & Real-World Considerations

- **Stored XSS Prevention**: All text inputs (`studentName`, `concern`, `goal`, `notes`) pass through an HTML/script tag stripping sanitizer before database storage.
- **Granular Authorization**: Route handlers verify caller role permissions. Direct mutations return structured `403 Forbidden` errors with machine-readable error codes when unauthorized roles attempt writes or deletes.
- **Database Indexing**: The Prisma schema indexes `@@index([status, nextReview])` for rapid caseload dashboard filtering and `@@index([owner])` for counselor caseload views.
- **Accessibility (a11y)**: Built with semantic HTML elements (`<main>`, `<header>`, `<section>`, `<table>`, `<label>`), visible focus indicators, high color contrast ratios, keyboard dismissal on modals (`Escape` / backdrop click), and ARIA attributes.
