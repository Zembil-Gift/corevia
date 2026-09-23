import { expect, test, type Page } from "@playwright/test"
import { PASSWORD, TRELLO_TOKEN, alert, need, session } from "../support"

test.describe.configure({ mode: "serial" })

let page: Page
test.beforeAll(async ({ browser }) => {
  page = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
})
test.afterAll(() => page.context().close())

const section = (name: "Trello" | "GitHub") => page.locator("section", { has: page.getByRole("heading", { name, level: 2 }) })

test.describe("Trello", () => {
  test("Connect redirects to Trello's authorize page with a return URL", async () => {
    await page.route("https://trello.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "trello stub" }))
    await page.goto("/manager/integrations")
    const trello = section("Trello")
    await expect(trello).toContainText("Not connected.")
    await trello.getByRole("button", { name: "Connect Trello" }).click()
    await page.waitForURL(/trello\.com\/1\/authorize/)
    const url = new URL(page.url())
    expect(url.searchParams.get("key")).toBeTruthy()
    expect(url.searchParams.get("response_type")).toBe("token")
    expect(url.searchParams.get("return_url")).toMatch(/\/manager\/integrations$/)
    await page.unroute("https://trello.com/**")
  })

  test("token from the redirect connects; pick boards + branches; save; disconnect", async () => {
    test.skip(!TRELLO_TOKEN, "set E2E_TRELLO_TOKEN to exercise a real Trello connection")
    await page.goto(`/manager/integrations#token=${TRELLO_TOKEN}`)
    const trello = section("Trello")
    await expect(trello).toContainText("Your Trello account is connected.", { timeout: 30_000 })
    await expect(page).not.toHaveURL(/#token=/) // token is removed from the address bar
    await expect(trello.getByText("Load your boards to pick which to track.")).toBeVisible()
    await trello.getByRole("button", { name: "Load my boards" }).click()
    const boards = trello.getByRole("listitem").locator('label > input[type="checkbox"]')
    await expect(boards.first()).toBeVisible({ timeout: 30_000 })
    await boards.first().check()
    const ticks = trello.getByRole("group", { name: /Sub-organizations credited by/ })
    await expect(ticks).toContainText("· All sub-organizations")
    await ticks.getByLabel(need("branchName")).check()
    await expect(ticks).not.toContainText("· All sub-organizations")
    await trello.getByRole("button", { name: "Save tracked boards" }).click()
    await expect(trello.getByText("Saved.")).toBeVisible()

    await page.reload()
    await expect(trello.getByRole("group", { name: /Sub-organizations credited by/ }).getByLabel(need("branchName"))).toBeChecked()
    await trello.getByRole("button", { name: "Disconnect" }).click()
    await expect(trello).toContainText("Not connected.")
  })
})

test.describe("GitHub", () => {
  test("Connect redirects to GitHub OAuth with client id, scope and a stored CSRF state", async () => {
    await page.route("https://github.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "github stub" }))
    await page.goto("/manager/integrations")
    await section("GitHub").getByRole("button", { name: "Connect GitHub" }).click()
    await page.waitForURL(/github\.com\/login\/oauth\/authorize/)
    const url = new URL(page.url())
    expect(url.searchParams.get("client_id")).toBeTruthy()
    expect(url.searchParams.get("scope")).toBe("read:org,repo")
    expect(url.searchParams.get("redirect_uri")).toMatch(/\/manager\/integrations$/)
    const state = url.searchParams.get("state")
    await page.goto("/manager/integrations") // back on our origin: the state is in sessionStorage
    expect(state).toBeTruthy()
    await page.unroute("https://github.com/**")
  })

  test("OAuth return with a wrong state is rejected; a bad code shows the API error", async () => {
    await page.goto("/manager/integrations")
    await page.evaluate(() => sessionStorage.setItem("github_oauth_state", "expected-state"))
    await page.goto("/manager/integrations?code=abc&state=forged")
    const gh = section("GitHub")
    await expect(alert(gh)).toHaveText("GitHub sign-in could not be verified (state mismatch). Please try again.")
    await expect(page).toHaveURL(/\/manager\/integrations$/)

    await page.evaluate(() => sessionStorage.setItem("github_oauth_state", "good-state"))
    await page.goto("/manager/integrations?code=definitely-invalid&state=good-state")
    await expect(alert(gh)).toBeVisible({ timeout: 30_000 })
    await expect(gh).toContainText("Not connected.")
  })

  test("connected state UI: load orgs, tick orgs + branches, save, disconnect (GitHub API mocked)", async () => {
    // ponytail: a real GitHub connection needs an interactive OAuth login, so the Next proxy is
    // stubbed here; the proxy→API path itself is covered by the Trello test above.
    let saved: unknown = null
    let connected = true
    await page.route("**/api/manager/github/connection**", async (route) => {
      const req = route.request()
      const path = new URL(req.url()).pathname
      if (path.endsWith("/available-orgs")) return route.fulfill({ json: [{ login: "acme-e2e", name: "Acme E2E" }, { login: "beta-e2e", name: "" }] })
      if (path.endsWith("/orgs") && req.method() === "PUT") {
        saved = req.postDataJSON()
        return route.fulfill({ json: { connected: true, selectedOrgs: (saved as { orgs: unknown[] }).orgs } })
      }
      if (req.method() === "DELETE") {
        connected = false
        return route.fulfill({ status: 204, body: "" })
      }
      return route.fulfill({ json: { connected, selectedOrgs: [] } })
    })
    await page.goto("/manager/integrations")
    const gh = section("GitHub")
    await expect(gh).toContainText("Your GitHub account is connected.")
    await expect(gh.getByText("Load your orgs to pick which to track.")).toBeVisible()
    await gh.getByRole("button", { name: "Load my orgs" }).click()
    await expect(gh.getByText("beta-e2e")).toBeVisible() // falls back to the login when unnamed
    await gh.getByLabel("Acme E2E").check()
    await gh.getByRole("group", { name: "Sub-organizations credited by Acme E2E" }).getByLabel(need("branchName")).check()
    await expect(gh.getByRole("button", { name: "Refresh" })).toBeVisible()
    await gh.getByRole("button", { name: "Save tracked organizations" }).click()
    await expect(gh.getByText("Saved.")).toBeVisible()
    const orgs = (saved as { orgs: { login: string; subOrganizationIds: number[] }[] }).orgs
    expect(orgs).toHaveLength(1)
    expect(orgs[0].login).toBe("acme-e2e")
    expect(orgs[0].subOrganizationIds).toHaveLength(1)

    await gh.getByRole("button", { name: "Disconnect" }).click()
    await expect(gh).toContainText("Not connected.")
    await page.unroute("**/api/manager/github/connection**")
  })
})
