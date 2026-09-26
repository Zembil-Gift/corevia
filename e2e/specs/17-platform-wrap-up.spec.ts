import { expect, test } from "@playwright/test"
import { PASSWORD, PLATFORM_EMAIL, need, session } from "../support"

test("platform stats reflect the org's activity", async ({ browser }) => {
  const page = await session(browser, PLATFORM_EMAIL, PASSWORD, /\/platform$/)
  const orgRow = page.locator("tr", { hasText: `/${need("orgSlug")}` })
  await expect(orgRow).toContainText(need("orgName"))
  await expect(orgRow).toContainText("Active")
  await expect(orgRow).toContainText("(1 open)")
  await page.getByRole("link", { name: "Organizations" }).click()
  const card = page.locator("div.rounded-xl", { has: page.getByRole("heading", { name: need("orgName"), level: 2 }) })
  await expect(card.getByText("Hired", { exact: true })).toBeVisible()
  await expect(card).toContainText("1/11") // blogs published/total (10 drafts from the pagination test)
  await page.context().close()
})

test("deleting a principle already used in reviews deactivates it instead", async ({ browser }) => {
  const page = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
  const name = need("principleA")
  await page.goto("/manager/peer-reviews")
  await page.getByRole("button", { name: /^Show/ }).click()
  await page.getByRole("button", { name: `Delete ${name}` }).click()
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
  const item = page.getByRole("listitem").filter({ hasText: name })
  await expect(item.getByText(name)).toHaveClass(/line-through/)
  await expect(item.getByRole("button", { name: "Activate" })).toBeVisible()
  await page.context().close()
})

test("platform default principles are templates: deleting one removes it outright", async ({ browser }) => {
  const page = await session(browser, PLATFORM_EMAIL, PASSWORD, /\/platform$/)
  const name = need("principleA")
  await page.goto("/platform/principles")
  await page.getByRole("button", { name: `Delete ${name}` }).click()
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
  await expect(page.getByText(name, { exact: true })).toHaveCount(0)
  await page.context().close()
})
