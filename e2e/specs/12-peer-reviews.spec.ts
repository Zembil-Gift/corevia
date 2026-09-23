import { expect, test, type Page } from "@playwright/test"
import { PASSWORD, addDays, need, readState, row, session, writeState } from "../support"

test.describe.configure({ mode: "serial" })

let manager: Page
test.beforeAll(async ({ browser }) => {
  manager = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
})
test.afterAll(() => manager.context().close())

const comment = () => `Great collaborator ${readState().run}`
const feedback = () => `Keep raising the design bar ${readState().run}`

test("manager creates a review period (modal cancel, validation, success)", async () => {
  const name = `E2E Q ${readState().run}`
  await manager.goto("/manager/peer-reviews")
  await expect(manager.getByText("No periods have been initiated yet.")).toBeVisible()
  await expect(manager.getByText("Select a period to load results.")).toBeVisible()

  const open = manager.getByRole("button", { name: "Create review period" })
  await expect(open).toBeEnabled() // platform has active principles (spec 03)
  await open.click()
  const form = manager.locator("form", { has: manager.getByPlaceholder("2026 Q2") })
  await form.getByRole("button", { name: "Cancel" }).click()
  await expect(form).toHaveCount(0)

  await open.click()
  await form.getByRole("button", { name: "Create period" }).click()
  await expect(manager.getByPlaceholder("2026 Q2")).toHaveJSProperty("validity.valueMissing", true)
  await manager.getByPlaceholder("2026 Q2").fill(name)
  await form.locator('input[type="date"]').nth(0).fill(addDays(-1))
  await form.locator('input[type="date"]').nth(1).fill(addDays(30))
  await form.getByRole("button", { name: "Create period" }).click()
  await expect(manager.getByText("Period created")).toBeVisible()
  await expect(manager.getByText(`${name} · ${addDays(-1)} → ${addDays(30)}`)).toBeVisible()

  await manager.getByRole("button", { name: "Refresh" }).first().click()
  await row(manager, name).click()
  // Every employee is listed; nobody has ratings yet.
  const results = manager.locator("section", { has: manager.getByRole("heading", { name: "Period results" }) })
  await expect(results.getByText(name)).toBeVisible()
  await expect(results.locator("div", { has: manager.getByText("Total ratings", { exact: true }) }).last()).toContainText("0")
  writeState({ periodName: name })
})

test("employee submits an anonymous peer review", async ({ browser }) => {
  const page = await session(browser, need("emp1").email, PASSWORD, /\/employee\/reports$/)
  await page.goto("/employee/peer-reviews")
  await expect(page.getByText(/^New \(\d+\)$/)).toBeVisible()
  const form = page.locator("form")
  await form.locator("select").first().selectOption({ label: need("periodName") })
  const reviewee = form.locator("select").nth(1)
  await expect(reviewee.locator("option", { hasText: need("emp2").name })).toHaveCount(1)
  await expect(reviewee.locator("option", { hasText: need("emp1").name })).toHaveCount(0) // can't review yourself
  const emp2Value = await reviewee.locator("option", { hasText: need("emp2").name }).getAttribute("value")
  await reviewee.selectOption(emp2Value!)

  // One rating select per active principle.
  const ratings = form.locator("select").filter({ has: page.locator('option[value="MEETS_THE_BAR"]') })
  const n = await ratings.count()
  expect(n).toBeGreaterThan(0)
  for (let i = 0; i < n; i++) await ratings.nth(i).selectOption("EXCEEDS_THE_BAR")
  await form.getByPlaceholder("Write your overall review comment here (optional)...").fill(comment())
  await form.getByRole("button", { name: "Submit review" }).click()
  await expect(page.getByText("Peer review submitted successfully.")).toBeVisible()
  // emp2 is no longer offered for this period.
  await expect(reviewee.locator("option", { hasText: need("emp2").name })).toHaveCount(0)
  await page.context().close()
})

test("manager sees results, reads comments and gives feedback; branch tabs filter", async () => {
  const emp2 = need("emp2")
  await manager.goto("/manager/peer-reviews")
  await row(manager, need("periodName")).click()
  const results = manager.locator("section", { has: manager.getByRole("heading", { name: "Period results" }) })
  await expect(results.getByText("Employees reviewed")).toBeVisible()
  const r = row(results, emp2.name)
  await expect(r).toContainText(need("branchName"))

  const tabs = manager.getByRole("group", { name: "Filter results by sub-organization" })
  await tabs.getByRole("button", { name: new RegExp(need("mainBranchName")) }).click()
  await expect(row(results, emp2.name)).toHaveCount(0)
  await tabs.getByRole("button", { name: new RegExp(need("branchName")) }).click()
  await expect(row(results, emp2.name)).toBeVisible()
  await tabs.getByRole("button", { name: /All sub-organizations/ }).click()

  await r.getByRole("button", { name: "View" }).click()
  const details = manager.getByRole("dialog", { name: "Employee peer review" })
  await expect(details.getByText("No admin feedback yet.")).toBeVisible()
  await expect(details.getByRole("button", { name: "Give feedback" })).toBeVisible()
  await expect(details.getByText(/Average rating:/).first()).toBeVisible()

  await details.getByRole("button", { name: "Comments (1)" }).click()
  const comments = manager.getByRole("dialog", { name: "Peer review comments" })
  await expect(comments.getByText(comment())).toBeVisible()
  await comments.getByRole("button", { name: "Close" }).click()

  await details.getByRole("button", { name: "Give feedback" }).click()
  await details.getByRole("button", { name: "Cancel" }).click()
  await details.getByRole("button", { name: "Give feedback" }).click()
  await details.locator("select").selectOption("NEEDS_IMPROVEMENT")
  await details.getByPlaceholder("Write feedback...").fill(feedback())
  await details.getByRole("button", { name: "Save feedback" }).click()
  await expect(details.getByText(feedback())).toBeVisible()
  await expect(details.getByRole("button", { name: "Edit feedback" })).toBeVisible()
  await details.getByRole("button", { name: "Close" }).first().click()
})

test("reviewed employee sees scores, peer comments and manager feedback", async ({ browser }) => {
  const page = await session(browser, need("emp2").email, PASSWORD, /\/employee\/reports$/)
  await page.goto("/employee/my-review")
  await expect(page.getByText(/^My scores \(1\)$/)).toBeVisible()
  const period = page.locator("div", { hasText: need("periodName") }).filter({ has: page.getByRole("button", { name: "View" }) }).last()
  await expect(period).toContainText("1 review received")
  await period.getByRole("button", { name: "View" }).click()
  const results = page.getByRole("dialog", { name: "Peer review results" })
  await expect(results.getByText(feedback())).toBeVisible()
  await results.getByRole("button", { name: "Comments (1)" }).first().click()
  await expect(page.getByText(comment())).toBeVisible()
  await expect(page.getByText("Anonymous Peer Reviewer").first()).toBeVisible()
  await page.context().close()
})
