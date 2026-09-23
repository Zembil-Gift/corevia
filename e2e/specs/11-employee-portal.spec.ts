import { expect, test, type Page } from "@playwright/test"
import { PASSWORD, file, login, need, readState, row, session, setPassword } from "../support"

test.describe.configure({ mode: "serial" })

let page: Page
test.beforeAll(async ({ browser }) => {
  page = await session(browser, need("emp1").email, PASSWORD, /\/employee\/reports$/)
})
test.afterAll(() => page.context().close())

const modal = (title: string) => page.locator("div.fixed", { has: page.getByRole("heading", { name: title, level: 3 }) }).last()

test("profile header shows the employee's details", async () => {
  const emp1 = need("emp1")
  await expect(page.getByRole("heading", { name: "Employee Portal" })).toBeVisible()
  await expect(page.getByRole("heading", { name: emp1.name, level: 2 })).toBeVisible()
  await expect(page.getByText("Senior Backend Engineer")).toBeVisible()
  await expect(page.getByText(/Gross salary: 30,000\.00 ETB • Due \d{4}-\d{2}-\d{2}/)).toBeVisible()
  await expect(page.getByText("Office Days: MONDAY, TUESDAY, WEDNESDAY, FRIDAY")).toBeVisible()
  await expect(page.getByText(emp1.email)).toBeVisible()
  await expect(page.getByText("0911223344")).toBeVisible()
})

test("tabs navigate between report, payments, peer review and my review", async () => {
  for (const [label, url] of [["Payments", "/employee/payments"], ["Peer Review", "/employee/peer-reviews"], ["My Review", "/employee/my-review"], ["Report", "/employee/reports"]]) {
    await page.getByRole("link", { name: label, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${url}$`))
  }
  await page.goto("/employee")
  await expect(page).toHaveURL(/\/employee\/reports$/)
})

test("language toggle", async () => {
  await page.getByRole("button", { name: "አማ" }).click()
  await expect(page.getByRole("heading", { name: "የሰራተኛ ፖርታል" })).toBeVisible()
  await page.getByRole("button", { name: "EN" }).click()
})

test("report: load a month and change the time-spent date", async () => {
  await expect(page.getByRole("heading", { name: "Performance Report" })).toBeVisible()
  await page.locator('input[type="month"]').fill(new Date().toISOString().slice(0, 7))
  await page.getByRole("button", { name: "Load report" }).click()
  await expect(page.getByText("Overall", { exact: true })).toBeVisible()
  await expect(page.getByText("Attendance", { exact: true }).last()).toBeVisible()
  await expect(page.getByRole("heading", { name: "Time Spent" })).toBeVisible()
  await page.locator('input[type="date"]').fill(new Date(Date.now() - 86_400_000).toISOString().slice(0, 10))
  // Yesterday's manual attendance (spec 06) counts towards time worked.
  await expect(page.getByText(/Worked: \d/).first()).toBeVisible()
})

test("payments: all/paid tabs show the salary the manager marked paid", async () => {
  await page.getByRole("link", { name: "Payments", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Payments" })).toBeVisible()
  const r = row(page, `TX-${readState().run}`)
  await expect(r).toContainText("PAID")
  await page.getByRole("button", { name: "Paid", exact: true }).click()
  await expect(r).toBeVisible()
  await page.getByRole("button", { name: "All", exact: true }).click()
  await expect(page.getByText("Tax = income tax + your 7% pension.")).toBeVisible()
})

test("change password: wrong current password, success, sign in with the new one", async ({ browser }) => {
  const email = need("emp1").email
  await page.getByRole("button", { name: "Password" }).click()
  const m = modal("Change Password")
  await m.getByRole("button", { name: "Cancel" }).click()
  await expect(m).toHaveCount(0)

  await page.getByRole("button", { name: "Password" }).click()
  await m.getByLabel("Current password").fill("not-my-password")
  await m.getByLabel("New password").fill("Emp-Changed-77!")
  await m.getByRole("button", { name: "Update password" }).click()
  await expect(m.locator("p.text-red-400, p[class*='red']").first()).toBeVisible()

  await m.getByLabel("Current password").fill(PASSWORD)
  await m.getByRole("button", { name: "Update password" }).click()
  await expect(m.getByText("Password changed successfully.")).toBeVisible()
  await expect(m).toHaveCount(0, { timeout: 5_000 })

  const probe = await browser.newPage()
  await login(probe, email, "Emp-Changed-77!", /\/employee\/reports$/)
  await probe.close()
  setPassword("employees", email)
})

test("connected accounts: save GitHub/Trello usernames, then the update warning", async () => {
  const run = readState().run
  await page.getByRole("button", { name: "Connect" }).click()
  const m = modal("Connected Accounts")
  await expect(m.getByText("Updating your connected accounts will reset")).toHaveCount(0)
  await m.getByLabel("GitHub username").fill(`e2e-gh-${run}`)
  await m.getByLabel("Trello username").fill(`e2etrello${run}`)
  await m.getByRole("button", { name: "Connect" }).click()
  await expect(m.getByText("Connected accounts saved.")).toBeVisible()
  await expect(m).toHaveCount(0, { timeout: 5_000 })

  await page.getByRole("button", { name: "Connect" }).click()
  await expect(m.getByLabel("GitHub username")).toHaveValue(`e2e-gh-${run}`)
  await expect(m.getByText("Updating your connected accounts will reset")).toBeVisible()
  await expect(m.getByRole("button", { name: "Update" })).toBeVisible()
  await m.getByRole("button", { name: "Cancel" }).click()

  // The report now has GitHub and Trello sections with reload buttons.
  await page.goto("/employee/reports")
  await expect(page.getByRole("heading", { name: "Github Stats" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Trello Stats" })).toBeVisible()
  await page.getByRole("button", { name: "Reload" }).first().click()
})

test("profile photo: open editor, preview, upload", async () => {
  // The avatar has a hover transition, so Playwright never sees it "stable".
  await page.getByRole("img", { name: need("emp1").name }).click({ force: true })
  const m = modal("Edit Photo")
  await expect(m.getByRole("button", { name: "Upload photo" })).toBeDisabled()
  await m.getByLabel(/Change photo|Upload photo/).setInputFiles(file("image.png"))
  await expect(m.getByRole("img", { name: "Profile preview" })).toBeVisible()
  await m.getByRole("button", { name: "Upload photo" }).click()
  await expect(m.getByText("Photo updated.")).toBeVisible({ timeout: 30_000 })
})

test("attendance QR code modal shows the employee's QR", async () => {
  await page.locator("button:has(svg.lucide-qr-code)").click()
  const m = modal("Attendance QR")
  await expect(m.locator("svg").last()).toBeVisible()
  await m.getByRole("button").first().click()
  await expect(m).toHaveCount(0)
})

test("attendance panel: actions open the QR scanner; close", async () => {
  await page.getByRole("button", { name: "Attendance", exact: true }).click()
  const panel = modal("Attendance")
  for (const a of ["Clock In", "Lunch Break In", "Lunch Break Out", "Clock Out"]) await expect(panel.getByRole("button", { name: a })).toBeVisible()
  await expect(panel.getByText("Select an action, then scan the QR code.")).toBeVisible()
  await panel.getByRole("button", { name: "Clock In" }).click()
  const scanner = page.locator("div.fixed", { has: page.getByRole("heading", { name: "Scan QR Code" }) }).last()
  await expect(scanner.getByRole("button", { name: "Start Scanning" })).toBeVisible()
  await scanner.getByRole("button").first().click()
  await expect(scanner).toHaveCount(0)
})

test("log out", async () => {
  await page.keyboard.press("Escape")
  await page.goto("/employee/reports")
  await page.getByRole("button", { name: "Log out" }).click()
  await expect(page).toHaveURL(/\/login$/)
})
