import { expect, test } from "@playwright/test"

test.describe("marketing landing page", () => {
  test("renders every section and the header/hero/footer links work", async ({ page }) => {
    await page.goto("/")
    for (const id of ["showcase", "features", "faq"]) await expect(page.locator(`#${id}`)).toBeAttached()

    const nav = page.getByRole("navigation", { name: "Primary" })
    for (const [label, anchor] of [["Features", "#features"], ["Tour", "#showcase"], ["FAQ", "#faq"]]) {
      await nav.getByRole("link", { name: label }).click()
      await expect(page).toHaveURL(new RegExp(`${anchor}$`))
      await expect(page.locator(anchor)).toBeInViewport()
    }

    await page.getByRole("banner").getByRole("link", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto("/")
    await page.getByRole("banner").getByRole("link", { name: /start|free/i }).first().click()
    await expect(page).toHaveURL(/\/signup/)
  })

  test("FAQ items expand and collapse", async ({ page }) => {
    await page.goto("/#faq")
    const items = page.locator("#faq details")
    await expect(items).toHaveCount(5)
    const first = items.first()
    await first.locator("summary").click()
    await expect(first).toHaveAttribute("open", "")
    await first.locator("summary").click()
    await expect(first).not.toHaveAttribute("open", "")
  })

  test("language toggle switches to Amharic, persists across reloads, and back", async ({ page }) => {
    await page.goto("/")
    const toggle = page.getByRole("group", { name: "Language" }).first()
    await toggle.getByRole("button", { name: "አማ" }).click()
    await expect(toggle.getByRole("button", { name: "አማ" })).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator("#faq")).toContainText("የኩባንያዬ መረጃ")
    await page.reload()
    await expect(page.locator("#faq")).toContainText("የኩባንያዬ መረጃ")
    await page.getByRole("group", { name: "Language" }).first().getByRole("button", { name: "EN", exact: true }).click()
    await expect(page.locator("#faq")).toContainText("Is my company's data isolated")
  })

  test("mobile menu opens, navigates and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")
    await page.getByRole("button", { name: "Open menu" }).click()
    const mobile = page.getByRole("navigation", { name: "Mobile" })
    await expect(mobile).toBeVisible()
    await mobile.getByRole("link", { name: "FAQ" }).click()
    await expect(mobile).toBeHidden()
    await expect(page).toHaveURL(/#faq$/)
  })

  test("footer links point at real pages", async ({ page }) => {
    await page.goto("/")
    const footer = page.getByRole("contentinfo")
    for (const [label, url] of [["Sign in", /\/login$/], ["Start free", /\/signup$/]] as const) {
      await footer.getByRole("link", { name: label }).click()
      await expect(page).toHaveURL(url)
      await page.goto("/")
    }
  })
})

test.describe("other public pages", () => {
  test("about page and its gallery lightbox", async ({ page }) => {
    await page.goto("/about")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    const thumb = page.locator("button:has(img)").first()
    if (await thumb.count()) {
      await thumb.click()
      // The whole backdrop is the close button; the image itself swallows clicks.
      await page.getByRole("button", { name: "Close gallery" }).click({ position: { x: 5, y: 5 } })
      await expect(page.getByRole("button", { name: "Close gallery" })).toBeHidden()
    }
  })

  test("unknown org public profile is a 404", async ({ page }) => {
    // ponytail: dev-mode streaming sends notFound() with HTTP 200, so assert the rendered page.
    await page.goto("/o/definitely-not-an-org-e2e")
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible()
  })
})
