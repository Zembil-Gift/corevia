# Corevia end-to-end tests (Playwright)

Drives the real UI against the real stack — Next.js (`:3000`), the Spring API (`:8080`),
Postgres, SendGrid, Cloudflare R2 and Google Maps. Nothing in the app is mocked except the
GitHub connected state (see below).

## Run

```bash
cd frontend/e2e
npm install
npx playwright install chromium
npm test                       # whole suite, ~6 min
npx playwright test specs/09   # one spec, against the org the last full run created
npm run report                 # HTML report (traces/screenshots for failures)
```

Prerequisites: the API and `pnpm dev` are running; `psql` and `ffmpeg` are on `PATH`.

| Env var | Default | Purpose |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:3000` | Next.js app |
| `E2E_API_URL` | `http://localhost:8080` | API (reachability check only) |
| `E2E_DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/cms3` | same DB the API uses |
| `E2E_TRELLO_TOKEN` | — | a real Trello token (e.g. the API's `TRELLO_TOKEN`); without it the Trello-connected test is skipped |

## How it works

- **One fresh tenant per run.** `02` signs up a new company (`E2E Org <run>`), `03` approves it
  as platform admin, and every later spec builds on it (state in `.state.json`). Specs run in
  file order on one worker.
- **The DB is touched only for what a browser can't do:** a known-password platform admin is
  seeded (and removed in teardown); emailed passwords and OTP codes are reset to known values;
  a few rows are seeded where the real trigger is async (AI overview result, failed email
  deliveries). Everything else goes through the UI.
- **Real side effects:** uploads land in the R2 bucket; OTP, credential, test and retry emails
  go to `@example.com` addresses via SendGrid; data is left in the DB for inspection
  (uniquely named per run).
- **QR attendance is really scanned:** the employee's QR is screenshotted, turned into a
  fake webcam feed with ffmpeg, and fed to a Chromium launched with a fake camera + GPS.
- **GitHub connected state is stubbed** at the Next proxy (a real connection needs an
  interactive GitHub login). The OAuth redirect, CSRF state check and bad-code error path run
  for real.
- Public `/o/{slug}` pages are ISR-cached for 60 s, so those checks poll (`eventually`).

## Coverage

| Spec | Covers |
|---|---|
| 01 public site | landing nav anchors, CTAs, FAQ, EN/አማ toggle + persistence, mobile menu, footer; `/about` gallery; legacy `/jobs` search + chips, `/events` sort, `/blog`; unknown org 404 |
| 02 auth + signup | route guards for every role, bad/empty login, callbackUrl, redirect when signed in, sign-out, login i18n; signup → OTP (edit, resend, cooldown, wrong/right code) → request received |
| 03 platform admin | overview stats, nav + i18n, approve request → register (prefilled), reject (cancel/confirm), direct register (slug auto/validation/duplicate), suspend/activate (public page 404s), principles CRUD |
| 04 manager basics | dashboard KPIs/links, every sidebar page, drawer, company profile (all fields, logo/cover upload, URL paste, public page), OTP password change, log out |
| 05 branches + VMs | default branch, create with map (GPS, coords, radius, fullscreen, address search), edit, rename, delete; vice manager create/edit/deactivate/remove |
| 06 employees | modal cancel/close/validation, create in branches with photo/salary/days, duplicate email, branch filter, edit + email-change warning + deactivate, attendance add, soft delete |
| 07 content | blog (upload/URL cover, draft, edit, delete, duplicate slug, pagination, public list/article), events (online/in-person, edit, public + Register), jobs (application form builder: all field types, reorder, remove, required, file types, limits, validation; closed jobs; public list/detail/facts), org profile sections |
| 08 apply + hiring | apply form validation (every rule), 3 real applications, duplicate email/phone; dashboard count, answers/resume/GitHub, AI overview modal + states, status filter, under review, select for interview, hire into branch, send rejections, hire → employee |
| 09 email | builder (groups, live preview, placeholders, device width, save/persist, send test, reset, logo upload/remove), schedule (time/zone/interval validation, save), failed deliveries (retry, retry limit, pagination) |
| 10 payroll | dashboard upcoming payroll, due breakdown, branch filter, tx-ref required, mark paid, paid tab + month filter/clear |
| 11 employee portal | profile header, tabs, i18n, report + time spent, payments, password change, connected accounts, photo upload, QR modal, attendance panel, log out |
| 12 peer reviews | create period (cancel/validation), employee submits anonymous review, manager results + branch tabs + comments + feedback, reviewee sees scores/comments/feedback |
| 13 reports | monthly report + filters, employee detail (snapshot, GitHub/Trello, time spent, peer reviews), sync buttons |
| 14 integrations | Trello authorize redirect, real token connect → boards → branch ticks → save → disconnect; GitHub OAuth redirect/state, state mismatch, bad code, connected-state UI |
| 15 vice manager | nav restrictions, forbidden-page redirects, read-only branch employees, reports/peer reviews/payroll/integrations, deactivated VM can't log in |
| 16 QR attendance | portal clock-in by scan, kiosk lunch in/out + clock out, repeated clock-in refused, no-location message, manager sees the record |
| 17 wrap-up | platform stats reflect the org; deleting a used principle deactivates it |

Not covered: the legacy single-company `/jobs/[slug]`, `/blog/[slug]`, `/events/[slug]`
detail pages (they read `NEXT_PUBLIC_ORG_SLUG=afrodebab`, which doesn't exist in `cms3`),
and Reports pagination (needs >1 page of employees).

## Bugs the suite surfaced (all fixed; the tests now guard against regressions)

| Bug | Fix |
|---|---|
| Employee with no office days → HTTP 500 | at least one office day is required: the create/edit forms block it with a message, and the API answers 400 "Select at least one office day" instead of 500 |
| Failed-email list stuck on "Page 1 of 1" | `failed-email-notifications.tsx` reads the plain Spring `Page` fields (`totalPages`, `number`) |
| Links into server-rendered pages looked dead under load | `app/manager/loading.tsx`, `app/o/[slug]/loading.tsx`; employees land on `/employee/reports` directly |
| Manager Log out off-screen at 1280×720 | sidebar links scroll; language toggle + Log out stay pinned |
| Add Sub-Organization kept the previous branch's values | form resets to defaults on every close |
| Dead "Generated Password / Copy" block | removed (the password is emailed only) |
| Blog content / event + job description required only by the API | `required` on those fields |
| "Admin · —" before any manager feedback | an empty review (`id: null`) shows "No admin feedback yet." |
| Reports ignored reviews from custom review periods | Reports count reviews by submission date within the report range (`PeerReviewRepository.findSubmittedBetween`); period pages still match exact period dates |

Still by design: "Delete" employee is a soft delete (row stays, Inactive); company email is
unique platform-wide and is checked on Save.
