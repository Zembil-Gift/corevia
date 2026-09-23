import { expect, test, type Page } from "@playwright/test"
import { need, row, session } from "../support"

test.describe.configure({ mode: "serial" })

let page: Page
test.beforeAll(async ({ browser }) => {
  page = await session(browser, need("viceEmail"), need("vicePassword"), /\/manager$/)
})
test.afterAll(() => page.context().close())

const HIDDEN = ["Company Profile", "Branches & Sub-Orgs", "Vice Managers", "Blog", "Jobs", "Events", "Email Notifications", "Settings"]
const SHOWN = ["Dashboard", "Employees", "Reports", "Peer Reviews", "Payroll", "Integrations"]

test("nav hides org-level pages", async () => {
  const sidebar = page.locator("aside").first()
  for (const label of SHOWN) await expect(sidebar.getByRole("link", { name: label, exact: true })).toBeVisible()
  for (const label of HIDDEN) await expect(sidebar.getByRole("link", { name: label, exact: true })).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible()
})

for (const path of ["/manager/jobs", "/manager/profile", "/manager/sub-organizations", "/manager/vice-managers", "/manager/blog", "/manager/events", "/manager/email-notifications"]) {
  test(`${path} redirects a vice manager to employees`, async () => {
    await page.goto(path)
    await expect(page).toHaveURL(/\/manager\/employees$/)
  })
}

test("employees: read-only, only their branch, attendance viewable", async () => {
  await page.goto("/manager/employees")
  await expect(page.getByText("Branch Manager View")).toBeVisible()
  await expect(page.getByRole("button", { name: "Add employee" })).toHaveCount(0)
  await expect(row(page, need("emp2").email)).toBeVisible()
  await expect(row(page, need("hired").email)).toBeVisible()
  await expect(row(page, need("emp1").email)).toHaveCount(0)
  await expect(page.getByRole("button", { name: `Edit ${need("emp2").name}` })).toHaveCount(0)
  await expect(page.getByRole("button", { name: `Delete ${need("emp2").name}` })).toHaveCount(0)
  await page.getByRole("button", { name: `View attendance for ${need("emp2").name}` }).click()
  await expect(page.getByText("No attendance records found")).toBeVisible()
})

test("reports: only branch employees", async () => {
  await page.goto("/manager/metrics")
  await page.getByRole("button", { name: "Load report" }).click()
  await expect(row(page, need("emp2").name)).toBeVisible()
  await expect(row(page, need("emp1").name)).toHaveCount(0)
})

test("peer reviews: no period creation; branch results viewable", async () => {
  await page.goto("/manager/peer-reviews")
  await expect(page.getByRole("button", { name: "Create review period" })).toHaveCount(0)
  await row(page, need("periodName")).click()
  await expect(row(page, need("emp2").name)).toBeVisible()
})

test("payroll and integrations load for the branch", async () => {
  await page.goto("/manager/payments")
  await expect(page.getByRole("heading", { name: "Payroll", level: 1 })).toBeVisible()
  await expect(page.getByText(/No due payments found\.|Mark Paid/).first()).toBeVisible()
  await page.goto("/manager/integrations")
  await expect(page.getByRole("button", { name: "Connect Trello" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Connect GitHub" })).toBeVisible()
})

test("a deactivated vice manager cannot sign in", async ({ browser }) => {
  // Deactivate via the manager UI, try to log in, re-activate.
  const manager = await session(browser, need("managerEmail"), "E2e-Passw0rd!", /\/manager$/)
  await manager.goto("/manager/vice-managers")
  const vm = row(manager, need("viceEmail"))
  await vm.getByRole("button", { name: "Edit" }).click()
  const edit = manager.getByRole("dialog", { name: "Edit Vice Manager" })
  await edit.getByLabel("Account Active (allowed to login)").uncheck()
  await edit.getByRole("button", { name: "Save Changes" }).click()
  await expect(vm).toContainText("Inactive")

  const probe = await browser.newPage()
  await probe.goto("/login")
  await probe.getByLabel("Email").fill(need("viceEmail"))
  await probe.getByLabel("Password").fill(need("vicePassword"))
  await probe.getByRole("button", { name: "Sign in" }).click()
  await expect(probe.getByText("Invalid email or password")).toBeVisible()
  await probe.close()

  await vm.getByRole("button", { name: "Edit" }).click()
  await edit.getByLabel("Account Active (allowed to login)").check()
  await edit.getByRole("button", { name: "Save Changes" }).click()
  await expect(vm).toContainText("Active")
  await manager.context().close()
})
