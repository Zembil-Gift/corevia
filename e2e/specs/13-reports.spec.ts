import { expect, test, type Page } from "@playwright/test"
import { PASSWORD, need, row, session } from "../support"

test.describe.configure({ mode: "serial" })

let page: Page
test.beforeAll(async ({ browser }) => {
  page = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
  await page.goto("/manager/metrics")
})
test.afterAll(() => page.context().close())

const month = () => new Date().toISOString().slice(0, 7)

test("load the monthly report with branch / department / role filters", async () => {
  await expect(page.getByRole("heading", { name: "Metrics Report" })).toBeVisible()
  await page.locator('input[type="month"]').fill(month())
  await page.getByRole("button", { name: "Load report" }).click()
  await expect(row(page, need("emp1").name)).toBeVisible()
  await expect(row(page, need("emp2").name)).toContainText(need("branchName"))
  await expect(page.getByText("Employees in report")).toBeVisible()

  await page.locator("select").first().selectOption({ label: need("branchName") })
  await page.getByRole("button", { name: "Load report" }).click()
  await expect(row(page, need("emp1").name)).toHaveCount(0)
  await expect(row(page, need("emp2").name)).toBeVisible()
  await page.locator("select").first().selectOption({ label: "All Sub-Organizations" })

  await page.getByPlaceholder("e.g. ENGINEERING").fill("NO_SUCH_DEPARTMENT")
  await page.getByRole("button", { name: "Load report" }).click()
  await expect(page.getByText("No metrics data yet. Pick a period and load the report.")).toBeVisible()
  await page.getByPlaceholder("e.g. ENGINEERING").fill("")
  await page.getByPlaceholder("e.g. DEVELOPER").fill("")
  await page.getByRole("button", { name: "Load report" }).click()
  await expect(row(page, need("emp1").name)).toBeVisible()
})

test("employee detail: scores, snapshot refresh, GitHub/Trello, time spent, peer reviews", async () => {
  await row(page, need("emp1").name).getByRole("button", { name: "View" }).click()
  const d = page.getByRole("dialog", { name: "Employee Report" })
  await expect(d.getByText(need("emp1").name)).toBeVisible()
  for (const label of ["Overall", "Leadership", "Attendance", "Task"]) await expect(d.getByText(label, { exact: true }).first()).toBeVisible()
  await d.getByRole("button", { name: "Refresh snapshot" }).click()
  await expect(d.getByText("Strength")).toBeVisible()

  // emp1 connected GitHub/Trello usernames in spec 11.
  await expect(d.getByRole("heading", { name: "Github Stats" })).toBeVisible()
  await expect(d.getByRole("heading", { name: "Trello Stats" })).toBeVisible()
  await d.getByRole("button", { name: "Reload" }).first().click()

  await expect(d.getByRole("heading", { name: "Time Spent" })).toBeVisible()
  await d.locator('input[type="date"]').fill(new Date(Date.now() - 86_400_000).toISOString().slice(0, 10))
  await d.getByRole("button", { name: "Reload" }).last().click()
  await expect(d.getByText(/Worked: \d/).first()).toBeVisible()
  await expect(d.getByRole("heading", { name: "Peer Reviews" })).toBeVisible()
  await d.getByRole("button", { name: "Close" }).click()
  await expect(d).toBeHidden()

  // An employee without connected accounts gets the "not connected" notes.
  await row(page, need("emp2").name).getByRole("button", { name: "View" }).click()
  await expect(d.getByText("GitHub is not connected for this employee.")).toBeVisible()
  await expect(d.getByText("Trello is not connected for this employee.")).toBeVisible()
  // Reviews count towards the month they were submitted in, whatever the review period (spec 12).
  await expect(d.getByText(/EXCEEDS THE BAR/).first()).toBeVisible()
  await expect(d.getByText("Leadership", { exact: true }).locator("..")).not.toContainText("—")
  await d.getByRole("button", { name: "Close" }).click()
})

test("sync GitHub / Trello buttons show the API's result", async () => {
  for (const [name, api, fallback] of [
    ["Sync GitHub", "**/api/admin/github/sync", "GitHub sync triggered"],
    ["Sync Trello", "**/api/admin/trello/sync", "Trello sync triggered"],
  ] as const) {
    const [res] = await Promise.all([
      page.waitForResponse(api, { timeout: 90_000 }),
      page.getByRole("button", { name }).click(),
    ])
    const body = await res.json().catch(() => ({}))
    // Success shows the message (+count); failure (e.g. nothing connected) shows the API error.
    const shown = res.ok() ? (body.message ?? fallback) : (body.error ?? `Failed to ${name.toLowerCase()}`)
    await expect(page.getByText(shown).first()).toBeVisible()
  }
})
