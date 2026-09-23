import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { expect, type Browser, type Locator, type Page } from "@playwright/test"

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export const DB_URL = process.env.E2E_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/cms3"
export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8080"
/** Real Trello token (the backend's TRELLO_TOKEN works); the Trello-connected flow is skipped without it. */
export const TRELLO_TOKEN = process.env.E2E_TRELLO_TOKEN ?? ""

/** Every seeded/reset account uses this password. bcrypt below is its hash (cost 10). */
export const PASSWORD = "E2e-Passw0rd!"
const PASSWORD_HASH = "$2y$10$d6/wzSPZXKDsUZSK8UYZoezAb738V2quu6cohX0/YI5j9JTOYLhPe"
/** Email OTPs are stored bcrypt-hashed; tests overwrite the hash so this code is valid. */
export const OTP = "123456"
const OTP_HASH = "$2y$10$d2FuWU5.Tyy39Cb6QddJgummwzAbAkoWYSrwtTxJK2Rw1oAlJokgW"

/** Where the test "office" (branch geofence) is and where the fake GPS reports the user. */
// Distinct from the map picker's default (9.0105, 38.7612) so "GPS applied" is observable.
export const OFFICE = { latitude: 9.02, longitude: 38.77 }

export const PLATFORM_EMAIL = "e2e-platform@example.com"

const DIR = __dirname
export const STATE_FILE = path.join(DIR, ".state.json")
export const FILES = path.join(DIR, ".tmp")

// ---------------------------------------------------------------------------
// Shared state between numbered spec files (org slug, user emails, ids…)
// ---------------------------------------------------------------------------

export type State = {
  run: string
  orgName?: string
  orgSlug?: string
  directOrgName?: string
  managerEmail?: string
  managerPassword?: string
  viceEmail?: string
  vicePassword?: string
  branchName?: string
  mainBranchName?: string
  emp1?: { name: string; email: string }
  emp2?: { name: string; email: string }
  hired?: { name: string; email: string }
  principleA?: string
  blogSlug?: string
  blogTitle?: string
  eventSlug?: string
  eventTitle?: string
  jobSlug?: string
  jobTitle?: string
  jobId?: number
  closedJobSlug?: string
  periodName?: string
}

export function readState(): State {
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"))
}

export function writeState(patch: Partial<State>): State {
  const next = { ...readState(), ...patch }
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2))
  return next
}

export function initState(state: State) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

/** Fails fast with a clear message when an earlier spec did not produce what this one needs. */
export function need<K extends keyof State>(key: K): NonNullable<State[K]> {
  const value = readState()[key]
  if (value === undefined || value === null) throw new Error(`e2e state "${key}" missing — run the earlier specs first`)
  return value as NonNullable<State[K]>
}

// ---------------------------------------------------------------------------
// Database (psql) — only for what the UI cannot do: emailed passwords/OTPs, seeding
// ---------------------------------------------------------------------------

export const q = (s: string) => `'${s.replace(/'/g, "''")}'`

export function sql(query: string): string {
  return execFileSync("psql", [DB_URL, "-Atq", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim()
}

export function seedPlatformAdmin() {
  sql(`DELETE FROM platform_admins WHERE email = ${q(PLATFORM_EMAIL)};
       INSERT INTO platform_admins (name, email, password_hash, is_active)
       VALUES ('E2E Platform Admin', ${q(PLATFORM_EMAIL)}, ${q(PASSWORD_HASH)}, true);`)
}

export function removePlatformAdmin() {
  sql(`DELETE FROM platform_admins WHERE email = ${q(PLATFORM_EMAIL)}`)
}

/** Generated passwords are only emailed; reset them to PASSWORD so tests can sign in. */
export function setPassword(table: "managers" | "employees", email: string) {
  const n = sql(`UPDATE ${table} SET password_hash = ${q(PASSWORD_HASH)} WHERE lower(email) = lower(${q(email)}) RETURNING id`)
  if (!n) throw new Error(`no ${table} row for ${email}`)
}

/** Makes OTP the valid code for the latest emailed OTP of this address. */
export function setOtp(email: string) {
  const n = sql(`UPDATE email_otps SET code_hash = ${q(OTP_HASH)}, attempts = 0 WHERE lower(email) = lower(${q(email)}) RETURNING id`)
  if (!n) throw new Error(`no OTP row for ${email}`)
}

/** Skips the 60s OTP resend cooldown so "Resend code" can be exercised without sleeping. */
export function expireOtpCooldown(email: string) {
  sql(`UPDATE email_otps SET updated_at = now() - interval '2 minutes' WHERE lower(email) = lower(${q(email)})`)
}

export function orgId(slug: string): number {
  return Number(sql(`SELECT id FROM organizations WHERE slug = ${q(slug)}`))
}

// ---------------------------------------------------------------------------
// Browser helpers
// ---------------------------------------------------------------------------

/** Signs in through the real login form and waits for the role's landing page. */
export async function login(page: Page, email: string, password: string, landing: RegExp) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(landing)
}

/** Opens a fresh context signed in as the given user (sessionStorage survives within the page). */
export async function session(browser: Browser, email: string, password: string, landing: RegExp) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ["clipboard-read", "clipboard-write", "geolocation"],
    geolocation: OFFICE,
  })
  const page = await context.newPage()
  await login(page, email, password, landing)
  return page
}

/** The app-wide confirm/alert dialog (components/ui/app-dialog.tsx). */
export async function answerDialog(page: Page, button: string) {
  const dialog = page.getByRole("alertdialog")
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: button, exact: true }).click()
  await expect(dialog).toBeHidden()
}

/** Inline role="alert" messages (excludes Next's empty route announcer). */
export const alert = (scope: Page | Locator) => scope.locator('[role="alert"]:not(#__next-route-announcer__)')

/** Input/select/textarea next to a visible label text (for labels without htmlFor). */
export function fieldNear(scope: Page | Locator, label: string | RegExp) {
  // `has` locators resolve relative to each candidate div, so build them from the page root.
  const root = "goto" in scope ? scope : scope.page()
  return scope.locator("div").filter({ has: root.getByText(label, { exact: true }) }).last().locator("input, select, textarea").first()
}

/** Table row containing the given text. */
export const row = (scope: Page | Locator, text: string) => scope.locator("tr", { hasText: text })

export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export const addDays = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export const file = (name: string) => path.join(FILES, name)

/**
 * Public /o/{slug} pages are ISR-cached for 60s (lib/org-content-api.ts), so fresh edits show
 * up to a minute later: reload until the check passes.
 */
export async function eventually(page: Page, url: string, check: () => Promise<void>) {
  await expect(async () => {
    await page.goto(url)
    await check()
  }).toPass({ timeout: 100_000, intervals: [3_000, 5_000, 10_000] })
}
