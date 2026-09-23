import { expect, test, type Page } from "@playwright/test"
import { PASSWORD, need, readState, row, session } from "../support"

test.describe.configure({ mode: "serial" })

let page: Page
test.beforeAll(async ({ browser }) => {
  page = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
})
test.afterAll(() => page.context().close())

const thisMonth = () => new Date().toISOString().slice(0, 7)

test("dashboard lists the upcoming salary (due tomorrow)", async () => {
  const emp1 = need("emp1")
  await page.goto("/manager")
  const card = page.locator("div.rounded-xl", { has: page.getByRole("heading", { name: "Upcoming payroll" }) })
  await expect(card).toContainText(emp1.name)
  await expect(card).toContainText("Total due")
  await expect(page.getByRole("link").filter({ hasText: "due payments" })).toContainText("1 due payments")
})

test("due tab: breakdown columns, branch filter, tx-ref required, mark paid", async () => {
  const emp1 = need("emp1")
  await page.goto("/manager/payments")
  await expect(page.getByRole("heading", { name: "Payroll", level: 1 })).toBeVisible()
  const r = row(page, emp1.name)
  await expect(r).toContainText(need("mainBranchName"))
  await expect(r).toContainText("PENDING")
  for (const col of ["Gross", "Income tax", "Pension 7%", "Employer 11%", "Retirement", "Net"]) {
    await expect(page.getByRole("columnheader", { name: col, exact: true })).toBeVisible()
  }

  const branch = page.locator("select").first()
  await branch.selectOption({ label: need("branchName") })
  await expect(row(page, emp1.name)).toHaveCount(0)
  await branch.selectOption({ label: "All Sub-Organizations" })
  await expect(r).toBeVisible()

  await r.getByRole("button", { name: "Mark Paid" }).click()
  await expect(page.getByText(`Transaction reference is required for ${emp1.name}`)).toBeVisible()

  await r.getByPlaceholder("Transaction reference").fill(`TX-${readState().run}`)
  await r.getByPlaceholder("Paid amount (minor)").fill("2500000")
  await r.getByRole("button", { name: "Mark Paid" }).click()
  await expect(row(page, emp1.name)).toHaveCount(0)
})

test("paid tab: shows the payment, month filter and clear", async () => {
  const emp1 = need("emp1")
  await page.getByRole("button", { name: "Paid", exact: true }).click()
  const r = row(page, emp1.name)
  await expect(r).toContainText(`TX-${readState().run}`)
  await expect(r).toContainText("PAID")
  await expect(r).toContainText("25,000")

  const month = page.getByLabel("Month")
  await month.fill("2020-01")
  await expect(page.getByText("No paid payrolls found.")).toBeVisible()
  await month.fill(thisMonth())
  await expect(r).toBeVisible()
  await page.getByRole("button", { name: "Clear" }).click()
  await expect(month).toHaveValue("")
  await expect(r).toBeVisible()

  await page.getByRole("button", { name: "Due", exact: true }).click()
  await expect(page.getByText("No due payments found.")).toBeVisible()
})
