# GitHub repo description — copy/paste pack

Everything you need to fill in the repo's About panel, topics, social preview, and first-commit message. Keep this file local (or delete before pushing if you prefer).

---

## 1. Repository name

Pick one:

- `dsar-portal` ← recommended (concise, searchable)
- `gdpr-dsar-mvp`
- `privacy-request-portal`

---

## 2. Short description (≤ 350 chars)

GitHub's repo description sits at the top of the page. Use **one** of these:

### A — Compliance-forward (recommended for a hiring manager)
```
GDPR-aligned Data Subject Access Request portal. Spring Boot 3.5 + Angular 20, role-based workflow (customer / admin), append-only audit trail, state-machine-driven lifecycle (Access / Delete / Correct). Built as a technical assessment with AI-assisted development.
```

### B — Engineering-forward (for fellow devs)
```
Spring Boot 3.5 + Angular 20 POC. State-machine-driven DSAR workflow with append-only audit, BCrypt Basic Auth, Swagger, and 39 passing tests. In-memory H2, Docker-ready, phased delivery plan in PRD.md.
```

### C — Short & punchy
```
GDPR DSAR portal MVP — Spring Boot + Angular + H2. State machine, audit trail, role-based auth. Built to a client technical-assessment brief.
```

---

## 3. Topics (repo tags)

On GitHub: **About ⚙️ → Topics**. Add all of these (space-separated in the UI):

```
spring-boot  java-17  angular  angular-20  angular-material
gdpr  dsar  privacy  compliance  audit-log
state-machine  rest-api  h2-database  basic-auth  swagger-ui
bcrypt  jpa  hibernate  typescript  rxjs
technical-assessment  poc  mvp  ai-assisted
```

---

## 4. About panel settings

- [x] **Releases** — hide (this is a POC, not a library)
- [x] **Packages** — hide
- [x] **Deployments** — hide
- [ ] **Website** — leave blank, or point to Swagger once hosted
- [x] **Include in home page** — keep on

---

## 5. README front matter (badges)

Paste this just under the `# DSAR Portal — MVP` heading in the README:

```markdown
![Java](https://img.shields.io/badge/Java-17-007396?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?logo=springboot&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-20-DD0031?logo=angular&logoColor=white)
![H2](https://img.shields.io/badge/H2-in--memory-1021FF)
![Tests](https://img.shields.io/badge/tests-39_passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
```

(All static — no CI dependency. Swap the Tests badge for a real CI one if you add GitHub Actions later.)

---

## 6. First-commit message (if you haven't pushed yet)

```
feat: DSAR Portal MVP — Spring Boot + Angular

Automated Data Subject Access Request portal aligned with GDPR
Articles 15/16/17. Built to a technical-assessment brief.

Backend:
- Spring Boot 3.5 / Java 17 / JPA / H2 in-memory
- HTTP Basic Auth with BCrypt, role-based (CUSTOMER / ADMIN)
- State-machine-driven request lifecycle (5 states, unit-tested)
- Append-only audit log (@Immutable, no UPDATE/DELETE paths)
- 11 REST endpoints, fully documented in springdoc OpenAPI
- 39 tests: state machine, security integration, full lifecycle

Frontend:
- Angular 20 standalone components + signals
- Angular Material UI
- Lazy-loaded role-aware routes (14 chunks)
- Dynamic per-type forms, SLA badges, audit trail viewer

Docs:
- PRD.md with phased delivery plan (7 phases)
- README with architecture + state machine + sequence diagrams
- Postman collection + Docker compose
- Decision log + AI-Assisted Development section

Co-authored by Claude Code (AI-assisted development, as per
the client brief).
```

---

## 7. LinkedIn / portfolio blurb

For a public post once the assessment is over, or your portfolio page:

### Short version (Twitter / X / one-line)
> Built a GDPR-aligned DSAR portal in a week — Spring Boot + Angular, state machine, append-only audit, 39 tests. AI-assisted throughout, architecture directed manually. GitHub: <link>

### Medium version (LinkedIn post, ~150 words)
> Just wrapped a technical-assessment POC: a Data Subject Access Request portal aligned with GDPR Articles 15, 16, and 17.
>
> Customers file privacy requests (access / delete / correct their data), admins process them through a validated state machine, and every action lands in an append-only audit trail for compliance evidence.
>
> Stack was prescribed — Spring Boot 3.5 + Java 17, Angular 20, HTTP Basic Auth, H2 in-memory — so the value was in the architecture: a transition-vs-execute endpoint split that makes the side-effect boundary explicit, optimistic locking on concurrent admin actions, and anonymize-not-hard-delete semantics to balance Article 17 erasure with audit integrity.
>
> The brief encouraged AI-assisted development, so I paired with Claude Code throughout — AI handled scaffolding and boilerplate, I directed the architecture, reviewed every diff, and wrote tests alongside each phase. 39 passing.
>
> Full decision log + phased PRD in the repo: <link>

### Portfolio page summary (for a personal site)
> **Role**: Solo architect + implementer + AI-pairing operator
> **Timeline**: ~1 week, delivered against a 7-phase plan
> **Stack**: Spring Boot 3.5, Java 17, Spring Security, JPA, H2, Angular 20, Angular Material
> **Highlights**:
> - State machine encoded in an enum with a static transition map; unit-tested against all 21 transition pairs
> - Append-only audit with `@Immutable` + no UPDATE/DELETE code paths, tamper-evident model
> - Role enforcement at both URL and method level, drive-through integration tests
> - Full GDPR-aware semantics: 30-day SLA clock, rejection-requires-justification, anonymize-not-delete
> - AI pairing strategy documented in the README — the division between what the AI generated and what I directed

---

## 8. GitHub social preview (optional)

Under **Settings → Social preview**, upload a 1280×640 PNG. Easy options:

- **Fastest**: screenshot of the audit trail card (beat 8 from [SCREENSHOTS.md](SCREENSHOTS.md)) with a title bar added in Figma / Canva
- **Polished**: a title card with "DSAR Portal · Spring Boot + Angular · GDPR-aligned MVP", the three request-type icons, and your name — under 5 minutes in Canva using their "Tech" templates

Don't block the commit on this — GitHub falls back to a default card if you skip it.

---

## 9. Ready-to-share links to drop in your email reply

Fill these in after pushing:

```
Repo:     https://github.com/<you>/dsar-portal
README:   https://github.com/<you>/dsar-portal#readme
PRD:      https://github.com/<you>/dsar-portal/blob/main/PRD.md
Swagger:  (hosted only while backend runs locally — I'll demo live on the call)
```

### Suggested email reply to the recruiter

> Hi [Name],
>
> Thanks again for the opportunity. The DSAR Portal POC is ready for the technical-architect review:
>
> GitHub: https://github.com/<you>/dsar-portal
>
> The repo's README walks through the architecture, state machine, and sequence diagram; the PRD document captures the phased delivery plan; and the decision log explains the non-obvious choices. I've written 39 tests covering the state machine, security, and a full end-to-end request lifecycle — `mvn test` runs in 15 seconds.
>
> The brief encouraged AI-assisted development, so the README has a dedicated "AI-Assisted Development" section explaining the split between what Claude Code scaffolded and what I directed.
>
> I'm ready whenever the architect is. Happy to demo live or walk through any section of the code first.
>
> Best,
> Abhijith

---

## 10. Checklist before you hit "push"

- [ ] `.gitignore` excludes `node_modules/`, `target/`, `*.log`, `.env*`, IDE folders, `*.db` (already in place)
- [ ] No `.env` or credentials file accidentally staged — `git status` shows only intended files
- [ ] `README.md` renders correctly — preview on GitHub once pushed; Mermaid diagrams should render inline
- [ ] `PRD.md` link in README works
- [ ] Postman collection file is in the root, not buried in `docs/`
- [ ] Seeded passwords in README match what's in `DataSeeder.java`
- [ ] `mvn test` — still green
- [ ] `ng build --configuration=development` — still green
- [ ] Repo visibility is **public** (required — the brief asked for a GitHub link)

Then: `git push -u origin main` and paste the link into your reply.
