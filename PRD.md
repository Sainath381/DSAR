# Product Requirements Document
## Automated DSAR (Data Subject Access Request) Portal — MVP

**Version:** 1.0
**Date:** 2026-04-23
**Author:** Abhijith Krishna Ravuri
**Status:** Draft for review
**Deliverable:** Working application on GitHub, followed by technical architect review call

---

## 1. Executive Summary

The DSAR Portal is a compliance tool that allows data subjects (customers) to exercise their privacy rights under GDPR Articles 15 (Access), 16 (Rectification), and 17 (Erasure), while giving data controllers (admins) a structured workflow to process these requests within regulatory timelines. Every action is captured in a tamper-evident audit trail.

**Primary goal of the POC:** Demonstrate end-to-end working flow across all three request types, with role-based access and full auditability, on the mandated tech stack.

**Secondary goal:** Showcase engineering judgment (architecture, security posture, testing discipline) and responsible GenAI usage.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- G1 — Customers can submit, view, and track status of their DSAR requests.
- G2 — Admins can triage, process, and resolve DSAR requests via a queue UI.
- G3 — Every significant action is captured in an append-only audit log.
- G4 — Role-based access enforced at the API layer (not just UI).
- G5 — Deployable locally via a single command (`docker compose up` or equivalent).
- G6 — Defensible architecture choices the candidate can explain in a live review.

### 2.2 Non-Goals (explicitly out of scope for POC)
- NG1 — Multi-tenant / organization hierarchy.
- NG2 — Email notifications, SMS, or external webhooks.
- NG3 — OAuth2 / SSO / MFA (Basic Auth is mandated).
- NG4 — Production-grade persistence — H2 in-memory is mandated.
- NG5 — Horizontal scaling, caching layers, message queues.
- NG6 — Mobile-native UI, PWA, offline mode.
- NG7 — Legal-grade encryption-at-rest, HSM key management.

### 2.3 Success Criteria
- All three DSAR request types (Access, Delete, Correct) flow end-to-end.
- A fresh reviewer can clone the repo and be running in under 5 minutes.
- Every user-visible action produces a corresponding audit log entry.
- Unauthorized role access is blocked at API level (verified by test).
- README answers "why" questions before they are asked.

---

## 3. Personas & Roles

### 3.1 Priya — Customer (Data Subject)
- Registered individual whose PII is held by the organization.
- Wants to see what data is held, correct errors, or have it deleted.
- Low technical literacy — UI must be simple, status must be obvious.
- **Permissions:** submit requests, view own requests only.

### 3.2 Arjun — Admin (Data Privacy Officer)
- Employee responsible for responding to privacy requests within the GDPR 30-day SLA.
- Needs a queue, filters, and the ability to act on requests.
- **Permissions:** view all requests, change status, execute approved operations, view audit logs.

### 3.3 Auditor (implicit)
- Anyone (admin or external reviewer) inspecting the audit log for compliance evidence.
- **Permissions:** read-only access to audit log (admin role in MVP; separate AUDITOR role is a future enhancement).

---

## 4. User Stories

### 4.1 Customer stories
- **US-C1** — As a customer, I can log in with my credentials so that I access my private request dashboard.
- **US-C2** — As a customer, I can submit an ACCESS request so that I receive a copy of all data held about me.
- **US-C3** — As a customer, I can submit a DELETE request so that my personal data is erased.
- **US-C4** — As a customer, I can submit a CORRECT request with the specific fields I want changed so that inaccurate data is rectified.
- **US-C5** — As a customer, I can view the list of my past requests with their current status.
- **US-C6** — As a customer, I can see how many days remain before my request breaches the 30-day SLA.
- **US-C7** — As a customer, I can download the data export once my ACCESS request is COMPLETED.

### 4.2 Admin stories
- **US-A1** — As an admin, I can log in and see a queue of all pending DSAR requests sorted by SLA urgency.
- **US-A2** — As an admin, I can filter the queue by type, status, and SLA breach risk.
- **US-A3** — As an admin, I can open a request and see the full context (requester, type, payload, history).
- **US-A4** — As an admin, I can transition a request through states: SUBMITTED → IN_REVIEW → APPROVED/REJECTED → COMPLETED.
- **US-A5** — As an admin, I can add notes/justification to any state transition.
- **US-A6** — As an admin, when I approve an ACCESS request the system generates a JSON export of the customer's data.
- **US-A7** — As an admin, when I approve a DELETE request the system anonymizes the customer's record (preserving audit integrity).
- **US-A8** — As an admin, when I approve a CORRECT request the proposed patch is applied to the customer's record.
- **US-A9** — As an admin, I can view the full audit log of any request.

### 4.3 System stories
- **US-S1** — As the system, I record every state change, login, and data access in an append-only audit log.
- **US-S2** — As the system, I reject invalid state transitions (e.g. COMPLETED → SUBMITTED).
- **US-S3** — As the system, I prevent a customer from viewing another customer's requests even if they guess the ID.

---

## 5. Functional Requirements

### 5.1 Authentication & Authorization
- FR-1.1 — HTTP Basic Auth on all API endpoints except `/health` and Swagger.
- FR-1.2 — Two seeded users: `customer@demo.io / customer123`, `admin@demo.io / admin123` (documented in README).
- FR-1.3 — Passwords stored BCrypt-hashed, never logged.
- FR-1.4 — Role enforcement via `@PreAuthorize` on controllers, not just route guards in Angular.
- FR-1.5 — Angular route guards prevent customer role from loading admin routes.

### 5.2 DSAR Request Lifecycle
- FR-2.1 — A request is created in status `SUBMITTED`.
- FR-2.2 — Valid transitions: SUBMITTED → IN_REVIEW → {APPROVED | REJECTED}; APPROVED → COMPLETED; REJECTED is terminal.
- FR-2.3 — Only admins can transition states.
- FR-2.4 — Every transition requires an optional note; some (REJECTED) require a mandatory justification.
- FR-2.5 — SLA is 30 calendar days from SUBMITTED. Status badges: GREEN (>14d left), AMBER (3–14d), RED (≤3d or breached).

### 5.3 Request Type Semantics
- FR-3.1 — ACCESS: on COMPLETED, a JSON export of the customer's profile and all their requests is attached to the response.
- FR-3.2 — DELETE: on COMPLETED, the customer's `User` row is anonymized (name → "REDACTED", email → "deleted-{id}@anonymized.local", `deleted=true`). Their audit history remains.
- FR-3.3 — CORRECT: payload carries `{field, newValue}[]`. On COMPLETED, the patch is applied with before/after snapshots stored in the audit log.

### 5.4 Audit Trail
- FR-4.1 — Audit rows are INSERT-only; no update or delete endpoints exist.
- FR-4.2 — Each row captures: actorId, actorRole, action, entityType, entityId, timestamp, requestIp, beforeJson, afterJson.
- FR-4.3 — All authentication attempts (success + failure) are logged.
- FR-4.4 — Admin reads of any customer record are logged (Article 30 accountability).

### 5.5 UI (Angular)
- FR-5.1 — Login screen (email + password, error on bad creds).
- FR-5.2 — Customer dashboard: "My Requests" table + "New Request" button with type selector and dynamic form per type.
- FR-5.3 — Admin dashboard: queue with filters, detail drawer, transition buttons, audit-log tab.
- FR-5.4 — SLA badges on every request row.
- FR-5.5 — Toast notifications for action results.
- FR-5.6 — Responsive layout down to 1024px; mobile not required.

---

## 6. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | API response time (p95) | < 300 ms on localhost |
| NFR-2 | Startup time | < 15 s backend, < 5 s frontend dev server |
| NFR-3 | Test coverage on service + security layers | ≥ 70% lines |
| NFR-4 | OpenAPI spec coverage | 100% of endpoints documented |
| NFR-5 | Zero high-severity issues in `npm audit` / Maven Dependabot scan | n/a |
| NFR-6 | Log format | Structured JSON, no PII in logs |

---

## 7. Technical Architecture

### 7.1 Stack (mandated)
- **Backend:** Spring Boot 3.2.x, Java 17, Spring Security, Spring Data JPA, springdoc-openapi
- **Database:** H2 in-memory (file mode for persistence across restarts during demo)
- **Frontend:** Angular 17+, Angular Material, RxJS, Angular Router, HttpClient
- **Build:** Maven (backend), npm + Angular CLI (frontend)
- **Containerization:** Docker + docker-compose (optional but recommended)

### 7.2 High-Level Architecture

```
┌───────────────┐    Basic Auth    ┌──────────────────┐
│ Angular SPA   │ ───────────────► │ Spring Boot API  │
│ (port 4200)   │ ◄─────────────── │ (port 8080)      │
└───────────────┘     JSON         └────────┬─────────┘
                                            │ JPA
                                            ▼
                                    ┌──────────────────┐
                                    │ H2 (in-memory)   │
                                    └──────────────────┘
```

### 7.3 Backend Package Layout
```
com.dsar.portal
 ├── config          // SecurityConfig, OpenApiConfig, DataSeeder
 ├── audit           // AuditLog entity, AuditService, AuditAspect
 ├── user            // User entity, UserRepository, UserService
 ├── request         // DsarRequest, RequestService, StateMachine
 │   ├── controller  // CustomerRequestController, AdminRequestController
 │   └── dto         // DTOs, validators
 ├── security        // CustomUserDetailsService, role constants
 └── common          // error handling, common DTOs
```

### 7.4 Angular Module Layout
```
src/app
 ├── core            // AuthService, AuthGuard, HttpInterceptor
 ├── shared          // SlaBadgeComponent, ConfirmDialog, pipes
 ├── features
 │   ├── auth        // LoginComponent
 │   ├── customer    // MyRequestsComponent, NewRequestComponent
 │   └── admin       // QueueComponent, RequestDetailComponent, AuditLogComponent
 └── app.routes.ts   // route config with role guards
```

---

## 8. Data Model

### 8.1 Entities

**User**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| email | String | unique |
| passwordHash | String | BCrypt |
| fullName | String | |
| role | Enum | CUSTOMER, ADMIN |
| createdAt | Instant | |
| deleted | boolean | soft-delete flag |

**DsarRequest**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| requesterId | UUID | FK → User |
| type | Enum | ACCESS, DELETE, CORRECT |
| status | Enum | SUBMITTED, IN_REVIEW, APPROVED, REJECTED, COMPLETED |
| payload | JSON | type-specific |
| result | JSON | populated on COMPLETED |
| assignedAdminId | UUID | nullable |
| createdAt | Instant | |
| updatedAt | Instant | |
| slaDueAt | Instant | createdAt + 30d |

**AuditLog**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| actorId | UUID | nullable for system actions |
| actorRole | String | snapshot, not FK |
| action | String | LOGIN_SUCCESS, REQUEST_CREATED, STATUS_CHANGED, ... |
| entityType | String | |
| entityId | String | |
| beforeJson | String | nullable |
| afterJson | String | nullable |
| ipAddress | String | |
| timestamp | Instant | |

### 8.2 Seed Data
- 1 admin user
- 2 customer users
- 3 pre-existing requests (one of each type, at different statuses) so the reviewer sees a populated UI on first load.

---

## 9. API Contract (summary)

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | /api/auth/whoami | any authed | Returns current user + role |
| POST | /api/customer/requests | CUSTOMER | Submit new DSAR |
| GET | /api/customer/requests | CUSTOMER | List my requests |
| GET | /api/customer/requests/{id} | CUSTOMER | Get my request |
| GET | /api/customer/requests/{id}/export | CUSTOMER | Download ACCESS result |
| GET | /api/admin/requests | ADMIN | Queue with filters |
| GET | /api/admin/requests/{id} | ADMIN | Request detail |
| POST | /api/admin/requests/{id}/transition | ADMIN | Change status |
| POST | /api/admin/requests/{id}/complete | ADMIN | Execute the action |
| GET | /api/admin/audit | ADMIN | Audit log (filterable) |
| GET | /api/admin/audit?entityId={id} | ADMIN | Audit log for one entity |

Full schema published as OpenAPI at `/swagger-ui.html`.

---

## 10. Security Model

- **Transport:** HTTP locally; README documents that production should be HTTPS-only.
- **Auth:** Spring Security `HttpBasic` with stateless sessions.
- **Password storage:** `BCryptPasswordEncoder` strength 10.
- **Authorization:** method-level `@PreAuthorize("hasRole('ADMIN')")` on admin endpoints.
- **IDOR prevention:** customer endpoints always filter by `authentication.principal.id`.
- **Audit integrity:** no UPDATE/DELETE endpoints on audit table; JPA entity marked `@Immutable`.
- **Error handling:** global `@ControllerAdvice`, no stack traces leaked to client.
- **CORS:** `http://localhost:4200` whitelisted in dev config; documented.

---

## 11. Phased Delivery Plan

Each phase ends in a demonstrable, committable state. If time runs short, stop at the end of Phase 3 and still have a presentable POC.

### Phase 0 — Project Scaffolding (est. 2–3 hrs)
**Objective:** Empty but runnable skeletons.
- Initialize Spring Boot project (Spring Initializr equivalent): web, security, data-jpa, h2, validation, lombok, springdoc-openapi.
- Initialize Angular 17 project with routing + Angular Material.
- Git repo with `.gitignore`, a real README stub, MIT license.
- Health endpoint returns 200. Angular loads a "Hello DSAR" page.
- `docker-compose.yml` builds and runs both.

**Acceptance:** `docker compose up` → visit `http://localhost:4200` → see welcome page; `curl :8080/health` → 200.

### Phase 1 — Auth & Role Foundations (est. 3–4 hrs)
**Objective:** Logged-in users with correct role routed to correct shell.
- `User` entity + repository + BCrypt + seed data.
- Spring Security `SecurityFilterChain` with Basic Auth + method security.
- `/api/auth/whoami` endpoint.
- Angular `AuthService`, `AuthGuard`, `BasicAuthInterceptor`, login page.
- Role-based redirect post-login to `/customer` or `/admin`.
- **Audit hooks:** LOGIN_SUCCESS, LOGIN_FAILURE.

**Acceptance:** Login as each seeded user; wrong password rejected; customer cannot reach `/admin/*`.

### Phase 2 — Customer Request Submission & Listing (est. 4–5 hrs)
**Objective:** Priya can file and track requests.
- `DsarRequest` entity + repository + state enum.
- `POST /api/customer/requests` (validates type + payload per type).
- `GET /api/customer/requests` (filtered by requester).
- Angular: "My Requests" table, "New Request" form with dynamic fields per type, SLA badge component.
- **Audit hooks:** REQUEST_CREATED.

**Acceptance:** Customer submits each of the 3 types, sees them in list with correct SLA badge.

### Phase 3 — Admin Queue & Workflow (est. 5–6 hrs)
**Objective:** Arjun can process the full lifecycle.
- `GET /api/admin/requests` with filters (type, status, sla).
- `POST /api/admin/requests/{id}/transition` with state machine validation.
- Queue component, detail drawer, transition buttons with mandatory note dialog.
- **Audit hooks:** STATUS_CHANGED (with before/after).

**Acceptance:** Admin moves a request through the full legal state graph; illegal transitions rejected with 409.

### Phase 4 — Action Execution (Access / Delete / Correct) (est. 4–5 hrs)
**Objective:** Approved requests actually do something.
- `POST /api/admin/requests/{id}/complete` dispatches per type:
  - ACCESS → aggregates user profile + request history into JSON export.
  - DELETE → anonymizes user row, flags `deleted=true`.
  - CORRECT → applies patch with before/after audit snapshot.
- Customer can download their ACCESS export.
- **Audit hooks:** ACTION_EXECUTED with before/after.

**Acceptance:** Each of three types can be completed; effects visible in DB and audit log.

### Phase 5 — Audit Log UI & Hardening (est. 3–4 hrs)
**Objective:** Compliance evidence + polish.
- Admin audit-log view, filterable by entity, actor, action, time range.
- OpenAPI/Swagger polished with descriptions and examples.
- Global error handler + proper HTTP status codes.
- Angular toast notifications, form validation errors, loading states.
- Confirm dialogs on destructive actions.

**Acceptance:** Every action taken during demo appears in audit log with full context.

### Phase 6 — Tests, Docs, Demo Polish (est. 4–6 hrs)
**Objective:** Pass the review call.
- Backend tests: MockMvc for security rules, service tests for state machine + anonymization, audit integration test.
- Frontend: at least smoke tests for guards + key components.
- README with:
  - Quickstart (credentials, how to run)
  - Architecture diagram (mermaid)
  - Sequence diagram for DELETE flow (mermaid)
  - Decisions log (why H2, why state machine, why append-only audit)
  - AI-Assisted Development section (what AI generated vs. what you designed)
  - Screenshots / short GIF of flows
- Postman collection checked in.

**Acceptance:** A cold reviewer can clone, read the README, run it, and understand every major choice within 15 minutes.

### Phase 7 — Stretch Goals (optional, time-permitting)
- SLA breach nightly job (`@Scheduled`) that marks breached requests.
- Dark mode toggle.
- Export request list as CSV for admins.
- Role constants extracted as an enum shared across layers.
- GitHub Actions CI: build + test on push.

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|:---:|:---:|------------|
| Over-engineering burns the timeline | High | High | Stick to phase gates; Phase 3 is the viable stopping point |
| Spring Security Basic Auth quirks with Angular (CORS, preflight) | Medium | Medium | Build auth end-to-end in Phase 1 before touching features |
| State machine bugs undermine demo | Medium | High | Unit-test the state machine in isolation before wiring UI |
| Reviewer asks "why Angular" | Certain | Low | Prepared answer: "mandated choice; I also know Vue — picked Angular to show structured, opinionated framework fit for enterprise compliance tooling" |
| AI-generated code contains subtle bugs | Medium | Medium | Review and test every AI-generated block; never ship unread code |

---

## 13. Review-Call Preparation (talking points)

Questions to expect and pre-prepared answers:

1. **Why in-memory H2?** Mandated, but I documented the migration path to Postgres (Flyway + profile switch).
2. **Why Basic Auth?** Mandated; I would upgrade to OAuth2 + JWT for production and I can describe that migration.
3. **How do you prevent audit tampering?** JPA `@Immutable`, no update/delete endpoints, plus ideas for production: append-only table + hash chain.
4. **What if two admins process the same request simultaneously?** Optimistic locking via `@Version` on `DsarRequest`.
5. **How did you use AI?** Point to the AI-Assisted Development section listing what was scaffolded vs. designed.
6. **Where would this scale first?** Audit table growth → archival strategy; request queue → Kafka for async processing.
7. **GDPR gotchas you caught?** 30-day SLA, right to explanation on rejection, audit survives deletion (anonymize not delete).

---

## 14. Open Questions (to confirm before coding)

1. Should customers be able to **amend or withdraw** a submitted request before it enters IN_REVIEW? *(Recommendation: yes, within SUBMITTED only.)*
2. Should rejected requests be **re-openable** by the same customer? *(Recommendation: no — customer must submit a new request; rejection is terminal.)*
3. Do we need a **public self-signup** for customers, or only seeded accounts? *(Recommendation: seeded only for POC, to keep the demo deterministic.)*
4. For CORRECT requests, is the customer allowed to patch their own **email** field? *(Recommendation: no — email is the identity anchor; only `fullName` is editable in POC.)*

---

## 15. Definition of Done (for POC submission)

- [ ] GitHub repo is public and contains backend + frontend + README + PRD
- [ ] `docker compose up` (or documented alternative) runs the whole app
- [ ] All three DSAR types demonstrably work end-to-end
- [ ] Audit log captures every user action during a 5-minute demo script
- [ ] Role enforcement verified by automated test
- [ ] README contains architecture diagram, decisions log, AI-usage section, screenshots
- [ ] OpenAPI spec live at `/swagger-ui.html`
- [ ] At least one meaningful test in each of: security, service, integration

---

*End of PRD. Next step: confirm the Open Questions in §14, then proceed to Phase 0 scaffolding.*
