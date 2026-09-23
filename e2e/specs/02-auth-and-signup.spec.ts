import { expect, test } from "@playwright/test"
import { initState, OTP, PASSWORD, PLATFORM_EMAIL, alert, expireOtpCooldown, login, setOtp, writeState } from "../support"

test.describe("route protection", () => {
  for (const path of ["/platform", "/manager", "/manager/employees", "/employee", "/employee/payments"]) {
    test(`${path} redirects anonymous users to /login with a callback`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(`/login\\?callbackUrl=${encodeURIComponent(path).replace(/%2F/g, "(%2F|/)")}`))
    })
  }
})

test.describe("login page", () => {
  test("rejects bad credentials with an alert", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill("nobody-e2e@example.com")
    await page.getByLabel("Password").fill("wrong-password")
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(alert(page)).toHaveText("Invalid email or password")
    await expect(page).toHaveURL(/\/login/)
  })

  test("requires both fields (native validation)", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page.getByLabel("Email")).toHaveJSProperty("validity.valueMissing", true)
    await expect(page).toHaveURL(/\/login$/)
  })

  test("back-to-home and start-trial links", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("link", { name: "Start your free trial" }).click()
    await expect(page).toHaveURL(/\/signup$/)
    await page.goto("/login")
    await page.getByRole("link", { name: "Back to home" }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test("honours callbackUrl for the matching role, redirects /login when signed in, signs out", async ({ page }) => {
    await page.goto("/platform/organizations")
    await expect(page).toHaveURL(/callbackUrl=/)
    await page.getByLabel("Email").fill(PLATFORM_EMAIL)
    await page.getByLabel("Password").fill(PASSWORD)
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page).toHaveURL(/\/platform\/organizations$/)

    await page.goto("/login")
    await expect(page).toHaveURL(/\/platform$/)

    await page.getByRole("button", { name: "Sign out" }).click()
    await expect(page).toHaveURL(/\/login/)
    await page.goto("/platform")
    await expect(page).toHaveURL(/\/login\?callbackUrl/)
  })

  test("login page language toggle", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: "አማ" }).click()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("እንኳን ደህና ተመለሱ")
    await page.getByRole("button", { name: "EN" }).click()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back")
  })
})

test.describe.serial("self-serve signup with email OTP", () => {
  test("details → code → edit → resend → wrong code → right code → request received", async ({ page }) => {
    const run = Date.now().toString(36)
    initState({ run }) // every full run provisions a brand-new org and users
    const company = `E2E Org ${run}`
    const email = `e2e-${run}-manager@example.com`

    await page.goto("/signup")
    await page.getByLabel("Company name").fill(company)
    await page.getByLabel("Your name").fill("Eden Tester")
    await page.getByLabel("Work email").fill(email)
    await page.getByLabel("Phone").fill("+251 911 234 567")
    await page.getByLabel("Industry").fill("Software")
    await page.getByLabel("Website").fill("https://example.com")

    await page.getByRole("button", { name: "Continue" }).click()
    // Terms checkbox is required.
    await expect(page.locator("#terms")).toHaveJSProperty("validity.valueMissing", true)
    await page.locator("#terms").check()
    await page.getByRole("button", { name: "Continue" }).click()

    await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible()
    await expect(page.getByText(email)).toBeVisible()

    // Edit details goes back with the form still filled in.
    await page.getByRole("button", { name: "Edit details" }).click()
    await expect(page.getByLabel("Company name")).toHaveValue(company)
    await page.locator("#terms").check() // the details form remounts, so terms must be re-accepted
    await page.getByRole("button", { name: "Continue" }).click()
    // A second code within a minute is refused.
    await expect(alert(page)).toHaveText("Please wait a minute before requesting another code")
    expireOtpCooldown(email)
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible()
    expireOtpCooldown(email)
    await page.getByRole("button", { name: "Resend code" }).click()
    await expect(alert(page)).toHaveCount(0)

    const submit = page.getByRole("button", { name: "Request your workspace" })
    const code = page.getByLabel(/Verification code/)
    await code.fill("12ab")
    await expect(code).toHaveValue("12") // digits only
    await expect(submit).toBeDisabled()

    await code.fill("000000")
    await submit.click()
    await expect(alert(page)).toBeVisible()

    setOtp(email)
    await code.fill(OTP)
    await submit.click()
    await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible()
    await expect(page.getByText(company)).toBeVisible()
    writeState({ orgName: company, managerEmail: email })

    await page.getByRole("link", { name: "Go to sign in" }).click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test("signup sign-in link", async ({ page }) => {
    await page.goto("/signup")
    await page.getByRole("link", { name: "Sign in", exact: true }).click()
    await expect(page).toHaveURL(/\/login$/)
  })
})

test("platform admin can sign in via the shared login form", async ({ page }) => {
  await login(page, PLATFORM_EMAIL, PASSWORD, /\/platform$/)
})
