# Mahberix — Frontend

Marketing site **and** product dashboards for **Mahberix**, a multi-tenant SaaS that gives any
company one platform for hiring, employee management, attendance, performance/peer reviews,
payments and content (blog & events).

Built with **Next.js 15 (App Router) / React 19 / Tailwind v4 / shadcn-Radix**. It talks to the
`afrodebab-cms-api` Spring Boot backend, which was converted to a multi-tenant SaaS.

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Requires network access on first run/build so `next/font` can fetch **Plus Jakarta Sans**.

### Environment (`.env`)

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CMS_BASE_URL` | Base URL of the CMS API (default `http://localhost:8080`) |
| `APP_ATTENDANCE_GEOFENCE_LAT` / `_LNG` | Geofence center for attendance clock-in |
| `S3_API`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, … | R2/S3 upload config (admin uploads) |

## Structure

- `app/page.tsx` — **new** Mahberix marketing landing (hero, features, how-it-works, pricing, FAQ, CTA).
- `components/mahberix/*` — landing sections + shared `Logo`. Brand text lives in `lib/brand.ts`.
- `app/admin/**`, `app/employee/**`, `app/blog/**`, `app/events/**`, `app/jobs/**`, `app/attendance/**`
  — product dashboards & public pages, reused from the company-profile app and rewired to the
  multi-tenant API.

## Branding & theming

- Rename / retagline the product in one place: **`lib/brand.ts`**.
- **Dark-first** theme matching the product dashboards. Color tokens (near-black `#0a0c0b`
  surface + AfroDebab emerald/lime accent `#34d399` / `#a3e635`) live in `app/globals.css`;
  `<html>` carries the `dark` class in `app/layout.tsx`.
- The brand mark is the AfroDebab green leaf-triangle "A" (forest → lime gradient) in
  `components/mahberix/logo.tsx`; the wordmark text stays the product name.
- Pricing tiers are **placeholders** — edit `components/mahberix/pricing.tsx`.

## API wiring (multi-tenant)

The reused dashboards were rewired for the SaaS backend:

- Manager (formerly "admin") CMS calls → `/manager/**` (org resolved from JWT).
- Manager login → `/manager/auth/login`; employee login → `/employee/auth/login`.
- Public blog/events/jobs → `/o/{slug}/...` pages, backed by `/public/{slug}/...`.
- Attendance clock-in/out drops the old shared `X-Employee-Attendance-Key`; the employee (and their
  org) is resolved from the email in the request body.

> Frontend cookie roles are still named `admin`/`employee` internally; only the outbound CMS paths
> use `/manager`.

## Known limitations

- **Self-serve signup is not wired.** `/signup` collects company + admin details and shows a
  confirmation, but does not yet provision an organization — backend org creation currently requires
  a platform admin (none seeded). Wire a provisioning endpoint in `app/signup/page.tsx`.
- Per-tenant public sites on subdomains are not implemented; public pages live at `/o/{slug}`.
- End-to-end behavior against a live backend is unverified (backend needs Postgres + a seeded org).
