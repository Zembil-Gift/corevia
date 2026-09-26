import { expect, test, type Page } from "@playwright/test"
import { PASSWORD, PLATFORM_EMAIL, alert, answerDialog, need, q, readState, session, sql, writeState } from "../support"

test.describe.configure({ mode: "serial" })

let page: Page
test.beforeAll(async ({ browser }) => {
  page = await session(browser, PLATFORM_EMAIL, PASSWORD, /\/platform$/)
})
test.afterAll(() => page.context().close())

const card = (name: string) => page.locator("div.rounded-xl", { has: page.getByRole("heading", { name, level: 2 }) })
const request = (company: string) => page.getByRole("listitem").filter({ hasText: company })

test("overview shows platform stats, charts and the org table", async () => {
  await expect(page.getByRole("heading", { name: "Platform overview" })).toBeVisible()
  for (const label of ["Organizations", "Managers", "Employees", "Jobs", "Applicants", "Content"]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
  }
  await expect(page.getByText("Employees by organization")).toBeVisible()
  await expect(page.getByText("Applicants by organization")).toBeVisible()
  await page.getByRole("link", { name: "View all" }).click()
  await expect(page).toHaveURL(/\/platform\/organizations$/)
})

test("sidebar navigation reaches every platform page", async () => {
  const nav = page.getByRole("navigation", { name: "Platform" })
  for (const [label, url, heading] of [
    ["Organizations", /\/platform\/organizations$/, "Organizations"],
    ["Signup requests", /\/platform\/requests$/, "Signup requests"],
    ["Leadership principles", /\/platform\/principles$/, "Leadership principles"],
    ["Register organization", /\/platform\/register$/, "Register organization"],
    ["Overview", /\/platform$/, "Platform overview"],
  ] as const) {
    await nav.getByRole("link", { name: label }).click()
    await expect(page).toHaveURL(url)
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible()
  }
  await page.getByRole("button", { name: "አማ" }).click()
  await expect(nav.getByRole("link", { name: "ድርጅቶች" })).toBeVisible()
  await page.getByRole("button", { name: "EN", exact: true }).click()
})

test("signup request → Register (prefilled) → organization created → request approved", async () => {
  const company = need("orgName")
  const email = need("managerEmail")
  await page.goto("/platform/requests")
  const item = request(company)
  await expect(item).toContainText("Pending")
  await expect(item).toContainText(email)
  await expect(item).toContainText("Software")
  await item.getByRole("button", { name: "Register" }).click()

  await expect(page).toHaveURL(/\/platform\/register\?requestId=/)
  await expect(page.getByText(/Prefilled from signup request #\d+/)).toBeVisible()
  await expect(page.getByLabel("Organization name")).toHaveValue(company)
  await expect(page.getByLabel("Manager name")).toHaveValue("Eden Tester")
  await expect(page.getByLabel("Manager email")).toHaveValue(email)
  const slug = await page.getByLabel("Slug").inputValue()
  expect(slug).toMatch(/^e2e-org-/)

  await page.getByRole("button", { name: "Create organization & email credentials" }).click()
  await expect(page.getByRole("heading", { name: "Organization created" })).toBeVisible()
  await expect(page.getByText(`(/${slug})`)).toBeVisible()
  writeState({ orgSlug: slug })

  await page.getByRole("link", { name: "Back to requests" }).click()
  await expect(request(company)).toContainText("Approved")
  await expect(request(company).getByRole("button", { name: "Register" })).toHaveCount(0)
})

test("reject a signup request (cancel keeps it pending, confirm rejects)", async () => {
  const company = `E2E Reject ${readState().run}`
  sql(`INSERT INTO signup_requests (company_name, contact_name, email, message, status)
       VALUES (${q(company)}, 'Rita Reject', 'e2e-reject-${readState().run}@example.com', 'Please reject me', 'PENDING')`)
  await page.goto("/platform/requests")
  await expect(page.getByText(/\d+ pending/)).toBeVisible()
  const item = request(company)
  await expect(item).toContainText("Please reject me")
  await item.getByRole("button", { name: "Reject" }).click()
  await answerDialog(page, "Cancel")
  await expect(item).toContainText("Pending")
  await item.getByRole("button", { name: "Reject" }).click()
  await answerDialog(page, "Reject")
  await expect(item).toContainText("Rejected")
})

test("register an organization directly (slug auto-fills and is validated)", async () => {
  const run = readState().run
  const name = `E2E Direct ${run}`
  await page.goto("/platform/register")
  await expect(page.getByText("Creates a new tenant and its first manager account in one step.")).toBeVisible()
  await page.getByLabel("Organization name").fill(name)
  await expect(page.getByLabel("Slug")).toHaveValue(`e2e-direct-${run}`)
  await expect(page.getByText(`/public/e2e-direct-${run}/jobs`)).toBeVisible()

  await page.getByLabel("Slug").fill("Bad Slug!")
  await page.getByLabel("Manager name").fill("Dawit Direct")
  await page.getByLabel("Manager email").fill(`e2e-${run}-direct@example.com`)
  await page.getByRole("button", { name: "Create organization & email credentials" }).click()
  await expect(page.getByLabel("Slug")).toHaveJSProperty("validity.patternMismatch", true)

  await page.getByLabel("Slug").fill(`e2e-direct-${run}`)
  await page.getByRole("button", { name: "Create organization & email credentials" }).click()
  await expect(page.getByRole("heading", { name: "Organization created" })).toBeVisible()
  writeState({ directOrgName: name })

  // Same slug again is rejected by the API and shown inline.
  await page.goto("/platform/register")
  await page.getByLabel("Organization name").fill(name)
  await page.getByLabel("Manager name").fill("Dup")
  await page.getByLabel("Manager email").fill(`e2e-${run}-dup@example.com`)
  await page.getByRole("button", { name: "Create organization & email credentials" }).click()
  await expect(alert(page)).toBeVisible()
})

test("organizations: metrics, public-site link, suspend and re-activate", async () => {
  const name = need("directOrgName")
  const slug = `e2e-direct-${readState().run}`
  await page.goto("/platform/organizations")
  const org = card(name)
  await expect(org).toContainText(`/${slug}`)
  for (const metric of ["Managers", "Employees", "Open jobs", "Applicants", "Hired", "Blogs"]) {
    await expect(org.getByText(metric, { exact: true })).toBeVisible()
  }
  await expect(org.getByRole("link", { name: "View public site" })).toHaveAttribute("href", `/o/${slug}`)

  await org.getByRole("button", { name: "Suspend" }).click()
  await expect(org.getByText("Suspended")).toBeVisible()
  // A suspended org has no public profile.
  const other = await page.context().newPage()
  await other.goto(`/o/${slug}`)
  await expect(other.getByRole("heading", { name: "404" })).toBeVisible()
  await other.close()

  await org.getByRole("button", { name: "Activate" }).click()
  await expect(org.getByText("Active", { exact: true })).toBeVisible()
  await expect(org.getByRole("button", { name: "Suspend" })).toBeVisible()
})

test("leadership principles: add, edit (cancel/save), deactivate/activate, delete", async () => {
  const run = readState().run
  const a = `E2E Ownership ${run}`
  const b = `E2E Bias ${run}`
  await page.goto("/platform/principles")
  const add = page.getByRole("button", { name: "Add" })
  await expect(add).toBeDisabled()

  for (const [name, desc] of [[a, "Acts on behalf of the company"], [b, "Speed matters"]]) {
    await page.getByLabel("New principle").fill(name)
    await page.getByLabel("Description").fill(desc)
    await add.click()
    await expect(page.getByText(name, { exact: true })).toBeVisible()
    await expect(page.getByLabel("New principle")).toHaveValue("")
  }

  await page.getByRole("button", { name: `Edit ${b}` }).click()
  await page.getByLabel("Principle name").fill("should not stick")
  await page.getByRole("button", { name: "Cancel" }).click()
  await expect(page.getByText(b, { exact: true })).toBeVisible()

  const renamed = `${b} Renamed`
  await page.getByRole("button", { name: `Edit ${b}` }).click()
  await page.getByLabel("Principle name").fill(renamed)
  await page.getByLabel("Principle description").fill("Calculated risk taking")
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.getByText(renamed, { exact: true })).toBeVisible()
  await expect(page.getByText("Calculated risk taking")).toBeVisible()

  const itemB = page.getByRole("listitem").filter({ hasText: renamed })
  await itemB.getByRole("button", { name: "Deactivate" }).click()
  await expect(itemB.getByText(renamed)).toHaveClass(/line-through/)
  await itemB.getByRole("button", { name: "Activate" }).click()
  await expect(itemB.getByText(renamed)).not.toHaveClass(/line-through/)

  await page.getByRole("button", { name: `Delete ${renamed}` }).click()
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click()
  await expect(page.getByText(renamed, { exact: true })).toBeVisible()
  await page.getByRole("button", { name: `Delete ${renamed}` }).click()
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
  await expect(page.getByText(renamed, { exact: true })).toHaveCount(0)
  writeState({ principleA: a })
})
