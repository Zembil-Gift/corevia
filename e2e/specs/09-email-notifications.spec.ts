import { expect, test, type Page } from "@playwright/test"
import { PASSWORD, file, need, orgId, q, readState, row, session, sql } from "../support"

test.describe.configure({ mode: "serial" })

let page: Page
test.beforeAll(async ({ browser }) => {
  page = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
  await page.goto("/manager/email-notifications")
})
test.afterAll(() => page.context().close())

const tab = (name: string) => page.getByRole("tab", { name })

test("tabs switch between builder, schedule and failed deliveries", async () => {
  await expect(tab("Email builder")).toHaveAttribute("aria-selected", "true")
  await tab("Schedule").click()
  await expect(page.getByRole("heading", { name: "Sending schedule" })).toBeVisible()
  await tab("Failed deliveries").click()
  await expect(page.getByText("Retry emails that could not be delivered.")).toBeVisible()
  await tab("Email builder").click()
  await expect(page.getByRole("navigation", { name: "Email types" })).toBeVisible()
})

test("builder: template groups, edit + live preview, placeholders, save, test send, reset", async () => {
  const nav = page.getByRole("navigation", { name: "Email types" })
  for (const g of ["Sent to employees", "Sent to candidates", "Sent to managers", "Sent to vice managers"]) {
    await expect(nav.getByRole("heading", { name: g })).toBeVisible()
  }
  await nav.getByRole("button", { name: "Salary payment received" }).click()
  await expect(page.getByRole("heading", { name: "Salary payment received", level: 2 })).toBeVisible()
  const save = page.getByRole("button", { name: "Save", exact: true })
  await expect(save).toBeDisabled()
  await expect(page.getByRole("button", { name: "Reset to default" })).toBeDisabled()

  const subject = `Your salary has landed ${readState().run}`
  await page.getByLabel("Subject").fill(subject)
  await page.getByLabel("Heading").fill("Payday!")
  const preview = page.getByRole("region", { name: "Inbox preview" })
  await expect(preview).toContainText(subject) // debounced server-rendered preview
  await expect(page.frameLocator('iframe[title="Email preview"]').getByText("Payday!")).toBeVisible()

  // Placeholder chips insert at the caret of the focused field (default: message).
  const message = page.getByLabel("Message")
  await message.fill("Hello ")
  await message.focus()
  const chip = page.getByRole("button", { name: /^\{\{.+\}\}$/ }).first()
  const token = (await chip.textContent())!
  await chip.click()
  await expect(message).toHaveValue(`Hello ${token}`)

  // Device width toggle.
  await page.getByRole("button", { name: "Mobile width" }).click()
  await expect(page.getByRole("button", { name: "Mobile width" })).toHaveAttribute("aria-pressed", "true")
  await expect(page.locator('iframe[title="Email preview"]')).toHaveAttribute("style", /375px/)
  await page.getByRole("button", { name: "Desktop width" }).click()

  await expect(save).toBeEnabled()
  await save.click()
  await expect(page.getByText("Template saved.")).toBeVisible()
  await expect(nav.getByRole("button", { name: /Salary payment received/ })).toContainText("Custom")
  await expect(save).toBeDisabled()

  // Persisted across reloads.
  await page.reload()
  await nav.getByRole("button", { name: /Salary payment received/ }).click()
  await expect(page.getByLabel("Subject")).toHaveValue(subject)

  await page.getByRole("button", { name: "Send test to me" }).click()
  await expect(page.getByText(`Test email sent to ${need("managerEmail")}.`)).toBeVisible({ timeout: 45_000 })

  await page.getByRole("button", { name: "Reset to default" }).click()
  await expect(page.getByText("Template reset to default.")).toBeVisible()
  await expect(nav.getByRole("button", { name: /Salary payment received/ })).not.toContainText("Custom")
  await expect(page.getByLabel("Subject")).not.toHaveValue(subject)
})

test("builder: email logo upload and removal", async () => {
  await expect(page.getByText("Using: Company profile logo or default")).toBeVisible()
  await page.locator('input[type="file"]').setInputFiles(file("image.png"))
  await expect(page.getByText("Email logo updated.")).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText("Using: Email logo")).toBeVisible()
  await page.getByRole("button", { name: "Remove" }).click()
  await expect(page.getByText("Email logo removed.")).toBeVisible()
  await expect(page.getByText("Using: Company profile logo or default")).toBeVisible()
})

test("schedule: send time, timezone, reminder interval (validation + save)", async () => {
  await tab("Schedule").click()
  const save = page.getByRole("button", { name: "Save schedule" })
  await expect(save).toBeDisabled() // nothing changed yet
  await page.getByLabel("Daily send time").fill("07:15")
  await page.getByLabel("Timezone").selectOption("UTC")
  const useMine = page.getByRole("button", { name: /Use my timezone/ })
  const zone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
  if (zone !== "UTC") {
    await useMine.click()
    await expect(page.getByLabel("Timezone")).toHaveValue(zone)
    await page.getByLabel("Timezone").selectOption("UTC")
  }
  await page.getByLabel("Payroll reminder every (days)").fill("0")
  await expect(page.getByLabel("Payroll reminder every (days)")).toHaveAttribute("aria-invalid", "true")
  await expect(save).toBeDisabled()
  await page.getByLabel("Payroll reminder every (days)").fill("5")
  await expect(page.getByText("Save to see the updated times.")).toBeVisible()
  await save.click()
  await expect(page.getByText("Schedule saved.")).toBeVisible()
  const saved = page.getByRole("region", { name: "Saved schedule" })
  await expect(saved).toContainText("07:15 UTC")
  await expect(saved).toContainText("every 5 days")
  await expect(saved).toContainText("Next email send")
  await expect(save).toBeDisabled()
})

test("failed deliveries: list, retry (sent → leaves the list), retry limit error, pagination", async () => {
  const org = orgId(need("orgSlug"))
  const run = readState().run
  const ok = `e2e-${run}-retry-ok@example.com`
  const capped = `e2e-${run}-retry-capped@example.com`
  const payload = q(JSON.stringify({ candidateName: "Retry Candidate", jobTitle: "E2E Role", companyName: "E2E" }))
  sql(`INSERT INTO email_notifications (type, status, recipient_email, subject, payload, attempt_count, last_error, organization_id) VALUES
       ('HIRING_REJECTED_PRE_INTERVIEW', 'FAILED', ${q(ok)}, 'Your application', ${payload}, 1, 'Simulated outage', ${org}),
       ('HIRING_REJECTED_PRE_INTERVIEW', 'FAILED', ${q(capped)}, 'Your application', ${payload}, 99, 'Simulated outage', ${org})`)

  await tab("Failed deliveries").click()
  const r = row(page, ok)
  await expect(r).toContainText("HIRING_REJECTED_PRE_INTERVIEW")
  await expect(r).toContainText("Simulated outage")
  await expect(page.getByText("Page 1 of 1")).toBeVisible()
  await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled()
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled()

  await row(page, capped).getByRole("button", { name: "Retry" }).click()
  await expect(page.getByText("Retry limit reached")).toBeVisible()

  await r.getByRole("button", { name: "Retry" }).click()
  await expect(row(page, ok)).toHaveCount(0, { timeout: 45_000 })
})

// Regression: the list used to read payload.page.totalPages from a plain Spring Page and
// was stuck on "Page 1 of 1".
test("failed deliveries paginate beyond 10", async () => {
  const org = orgId(need("orgSlug"))
  const run = readState().run
  const payload = q(JSON.stringify({ candidateName: "Retry Candidate", jobTitle: "E2E Role", companyName: "E2E" }))
  // 10 more failures (+1 capped from the previous test) → two pages of 10.
  sql(`INSERT INTO email_notifications (type, status, recipient_email, subject, payload, attempt_count, last_error, organization_id)
       SELECT 'HIRING_REJECTED_PRE_INTERVIEW', 'FAILED', 'e2e-${run}-bulk-' || g || '@example.com', 'Bulk', ${payload}, 99, 'Simulated outage', ${org}
       FROM generate_series(1, 10) g`)
  await tab("Schedule").click()
  await tab("Failed deliveries").click()
  await expect(page.getByText("Page 1 of 2")).toBeVisible()
  await page.getByRole("button", { name: "Next" }).click()
  await expect(page.getByText("Page 2 of 2")).toBeVisible()
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled()
  await page.getByRole("button", { name: "Previous" }).click()
  await expect(page.getByText("Page 1 of 2")).toBeVisible()
})
