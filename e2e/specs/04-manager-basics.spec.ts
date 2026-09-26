import { expect, test, type Page } from "@playwright/test"
import { OTP, PASSWORD, alert, eventually, expireOtpCooldown, file, login, need, readState, session, setOtp, setPassword } from "../support"

test.describe.configure({ mode: "serial" })

let page: Page
test.beforeAll(async ({ browser }) => {
  setPassword("managers", need("managerEmail"))
  page = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
})
test.afterAll(() => page.context().close())

const NAV = [
  ["Company Profile", "/manager/profile", "Company profile"],
  ["Branches & Sub-Orgs", "/manager/sub-organizations", "Sub-Organizations & Branches"],
  ["Vice Managers", "/manager/vice-managers", "Vice Managers"],
  ["Blog", "/manager/blog", "Blog"],
  ["Jobs", "/manager/jobs", "Jobs"],
  ["Events", "/manager/events", "Events"],
  ["Employees", "/manager/employees", "Employees"],
  ["Reports", "/manager/metrics", "Metrics Report"],
  ["Peer Reviews", "/manager/peer-reviews", "Peer Reviews"],
  ["Payroll", "/manager/payments", "Payroll"],
  ["Email Notifications", "/manager/email-notifications", "Email Notifications"],
  ["Integrations", "/manager/integrations", "Integrations"],
  ["Settings", "/manager/settings", "Settings"],
] as const

test("dashboard: KPI cards, charts and quick links to the org's public pages", async () => {
  const slug = need("orgSlug")
  await page.goto("/manager")
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible()
  for (const kpi of ["Employees", "Open jobs", "Upcoming payroll", "New applicants"]) {
    await expect(page.getByRole("main").getByText(kpi, { exact: true }).first()).toBeVisible()
  }
  for (const h of ["Attendance today", "Applicants · open jobs", "Content overview", "Quick links"]) {
    await expect(page.getByRole("heading", { name: h })).toBeVisible()
  }
  await expect(page.getByText("No due payments right now.")).toBeVisible()
  await expect(page.getByRole("link", { name: "View public blog →" })).toHaveAttribute("href", `/o/${slug}/blog`)
  await expect(page.getByRole("link", { name: "View public jobs →" })).toHaveAttribute("href", `/o/${slug}/jobs`)
  await expect(page.getByRole("link", { name: "View public events →" })).toHaveAttribute("href", `/o/${slug}/events`)
  await page.getByRole("link", { name: "View payroll" }).click()
  await expect(page).toHaveURL(/\/manager\/payments$/)
})

test("sidebar reaches every manager page and highlights it", async () => {
  const sidebar = page.locator("aside").first()
  await page.goto("/manager/settings")
  for (const [label, url, heading] of NAV) {
    await sidebar.getByRole("link", { name: label, exact: true }).click()
    // The dashboard is server-rendered and fans out to many API calls, so allow it time.
    await expect(page).toHaveURL(new RegExp(`${url}$`), { timeout: 45_000 })
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible()
    await expect(sidebar.getByRole("link", { name: label, exact: true })).toHaveClass(/e78a53/)
  }
})

test("sidebar language toggle translates the nav", async () => {
  const sidebar = page.locator("aside").first()
  await sidebar.getByRole("button", { name: "አማ" }).click()
  await expect(sidebar.getByRole("link", { name: "ሰራተኞች" })).toBeVisible()
  await sidebar.getByRole("button", { name: "EN", exact: true }).click()
  await expect(sidebar.getByRole("link", { name: "Employees" })).toBeVisible()
})

test("mobile drawer opens, navigates and closes", async () => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/manager")
  await page.getByRole("button", { name: "Open menu" }).click()
  const drawer = page.locator("aside").nth(1)
  await expect(drawer).toBeInViewport()
  await page.getByRole("button", { name: "Close menu" }).click()
  await expect(drawer).not.toBeInViewport()
  await page.getByRole("button", { name: "Open menu" }).click()
  await drawer.getByRole("link", { name: "Payroll" }).click()
  await expect(page).toHaveURL(/\/manager\/payments$/)
  await expect(drawer).not.toBeInViewport()
  await page.setViewportSize({ width: 1440, height: 900 })
})

test("company profile: every field, logo/cover upload, save, persists, public page reflects it", async () => {
  const slug = need("orgSlug")
  const orgName = need("orgName")
  await page.goto("/manager/profile")
  await expect(page.getByRole("heading", { name: "Company profile" })).toBeVisible()
  await expect(page.getByRole("link", { name: /View public page/ })).toHaveAttribute("href", `/o/${slug}`)

  const field = (label: string) => page.locator("div", { has: page.getByText(label, { exact: true }) }).last().locator("input, textarea, select").first()
  const values: Record<string, string> = {
    Tagline: "People ops for Ethiopian teams",
    Industry: "Software",
    "Founded year": "2019",
    "Phone number": "+251 911 000 111",
    "Company email": `hello-${readState().run}@example.com`,
    Website: "https://example.com",
    Address: "Bole Rd 12",
    City: "Addis Ababa",
    Country: "Ethiopia",
    LinkedIn: "https://linkedin.com/company/e2e",
    "X / Twitter": "https://x.com/e2e",
    Facebook: "https://facebook.com/e2e",
    Instagram: "https://instagram.com/e2e",
  }
  for (const [label, value] of Object.entries(values)) await field(label).fill(value)
  await page.getByPlaceholder("We build…").fill("We build HR software for growing companies.")
  await field("Business type").selectOption("LLC")
  await field("Company size").selectOption("11-50")

  // Real uploads to object storage via the API.
  const [logoInput, coverInput] = [page.locator('input[type="file"]').nth(0), page.locator('input[type="file"]').nth(1)]
  await logoInput.setInputFiles(file("image.png"))
  await expect(page.getByRole("img", { name: "Logo" })).toBeVisible()
  await coverInput.setInputFiles(file("image.png"))
  await expect(page.getByRole("img", { name: "Cover image" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Save changes" })).toBeEnabled()

  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByText("Saved", { exact: true })).toBeVisible()

  await page.reload()
  await expect(field("City")).toHaveValue("Addis Ababa")
  await expect(field("Business type")).toHaveValue("LLC")
  await expect(field("Company size")).toHaveValue("11-50")
  expect(await page.getByPlaceholder("…or paste an image URL").first().inputValue()).toMatch(/^https?:\/\//)

  const pub = await page.context().newPage()
  // ISR: the public page may serve the pre-save profile for up to 60 s.
  await eventually(pub, `/o/${slug}`, () =>
    expect(pub.getByText("People ops for Ethiopian teams").first()).toBeVisible({ timeout: 2_000 }))
  await expect(pub.getByRole("heading", { name: orgName, level: 1 })).toBeVisible()
  await expect(pub.getByText("We build HR software for growing companies.")).toBeVisible()
  const companyEmail = `hello-${readState().run}@example.com`
  await expect(pub.getByRole("link", { name: companyEmail })).toHaveAttribute("href", `mailto:${companyEmail}`)
  for (const social of ["LinkedIn", "X", "Facebook", "Instagram"]) await expect(pub.getByRole("link", { name: social, exact: true })).toBeVisible()
  await expect(pub.getByRole("link", { name: "Visit website" })).toHaveAttribute("href", "https://example.com")
  await expect(pub.getByRole("link", { name: "Powered by Mahberix" })).toBeVisible()
  await pub.close()
})

test("company profile: pasted image URL and required company name", async () => {
  await page.goto("/manager/profile")
  const logoUrl = page.getByPlaceholder("…or paste an image URL").first()
  await logoUrl.fill("https://placehold.co/64.png")
  await expect(page.getByRole("img", { name: "Logo" })).toHaveAttribute("src", "https://placehold.co/64.png")
  const name = page.getByPlaceholder("Acme Inc.")
  await name.fill("")
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(name).toHaveJSProperty("validity.valueMissing", true)
  await page.reload() // discard
})

test("settings: OTP-gated password change (mismatch, bad code, resend, cancel, success)", async ({ browser }) => {
  const email = need("managerEmail")
  const newPassword = "E2e-Changed-9!"
  expireOtpCooldown(email) // a re-run may be inside the previous run's cooldown
  await page.goto("/manager/settings")
  await page.getByRole("button", { name: "Send verification code" }).click()
  await expect(page.getByRole("status")).toContainText("Code sent. Check your inbox.", { timeout: 45_000 })

  // Cancel returns to the send button.
  await page.getByRole("button", { name: "Cancel" }).click()
  await expect(page.getByRole("button", { name: "Send verification code" })).toBeVisible()
  // Resend inside the cooldown is refused.
  await page.getByRole("button", { name: "Send verification code" }).click()
  await expect(alert(page)).toContainText("Please wait a minute")
  expireOtpCooldown(email)
  await page.getByRole("button", { name: "Send verification code" }).click()
  await expect(page.getByLabel("Verification code")).toBeVisible({ timeout: 45_000 })
  expireOtpCooldown(email)
  await page.getByRole("button", { name: "Resend code" }).click()
  await expect(page.getByRole("status")).toContainText("Code sent", { timeout: 45_000 }) // email is sent synchronously

  const submit = page.getByRole("button", { name: "Change password" })
  await expect(submit).toBeDisabled()
  await page.getByLabel("Verification code").fill(OTP)
  await page.getByLabel("New password", { exact: true }).fill(newPassword)
  await page.getByLabel("Confirm new password").fill("different-123")
  await submit.click()
  await expect(alert(page)).toHaveText("Passwords do not match")

  await page.getByLabel("Confirm new password").fill(newPassword)
  await submit.click() // OTP hash not set yet → wrong code
  await expect(alert(page)).toBeVisible()

  setOtp(email)
  await submit.click()
  await expect(page.getByRole("status")).toContainText("Your password has been changed.")

  // The new password works; the old one does not.
  const probe = await browser.newPage()
  await probe.goto("/login")
  await probe.getByLabel("Email").fill(email)
  await probe.getByLabel("Password").fill(PASSWORD)
  await probe.getByRole("button", { name: "Sign in" }).click()
  await expect(alert(probe)).toHaveText("Invalid email or password")
  await login(probe, email, newPassword, /\/manager$/)
  await probe.close()
  setPassword("managers", email) // back to the shared password for later specs
})

// Regression: without app/manager/loading.tsx this navigation waited for the whole
// server-rendered dashboard and looked dead under load.
test("sidebar Dashboard link returns to the dashboard", async () => {
  await page.goto("/manager/settings")
  await page.locator("aside").first().getByRole("link", { name: "Dashboard", exact: true }).click()
  await expect(page).toHaveURL(/\/manager$/, { timeout: 45_000 })
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible()
})

test("log out ends the session (reachable on a 1280×720 screen)", async ({ browser }) => {
  const p = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
  await p.setViewportSize({ width: 1280, height: 720 })
  await expect(p.getByRole("button", { name: "Log out" })).toBeInViewport()
  await p.getByRole("button", { name: "Log out" }).click()
  await expect(p).toHaveURL(/\/login$/)
  await p.goto("/manager")
  await expect(p).toHaveURL(/\/login\?callbackUrl/)
  await p.context().close()
})
