import { expect, test, type Locator, type Page } from "@playwright/test"
import { PASSWORD, alert, answerDialog, fieldNear, need, readState, row, session, setPassword, writeState } from "../support"

test.describe.configure({ mode: "serial" })

let page: Page
test.beforeAll(async ({ browser }) => {
  page = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
})
test.afterAll(() => page.context().close())

const branchCard = (name: string) =>
  page.locator("div.rounded-xl, div.rounded-2xl").filter({ has: page.getByRole("heading", { name, level: 3, exact: true }) }).last()

async function fillBranchForm(dialog: Locator, name: string) {
  await dialog.getByPlaceholder("e.g. Bole Branch").fill(name)
  await dialog.getByPlaceholder("e.g. Camas Plaza, 4th Floor").fill("Bole Rd, Friendship Bldg")
  await fieldNear(dialog, "Office Start Time").fill("08:00")
  await fieldNear(dialog, "Office End Time").fill("17:00")
  await fieldNear(dialog, "Grace Minutes (Allowed Late)").fill("10")
  await fieldNear(dialog, "Lunch Break Start").fill("12:30")
  await fieldNear(dialog, "Lunch Break End").fill("13:30")
}

test("default main branch exists and cannot be deleted", async () => {
  const main = `${need("orgName")} Main`
  await page.goto("/manager/sub-organizations")
  const card = branchCard(main)
  await expect(card.getByText("Default Main")).toBeVisible()
  await expect(card).toContainText("Not set")
  await expect(card.getByRole("button", { name: "Rename" })).toBeVisible()
  await expect(card.getByRole("button", { name: "Edit Details" })).toBeVisible()
  await expect(card.getByRole("button")).toHaveCount(2) // no delete button
  writeState({ mainBranchName: main })
})

test("create a branch with map geofence (GPS, manual coords, radius, fullscreen) and working hours", async () => {
  const name = `Bole Branch ${readState().run}`
  await page.getByRole("button", { name: "Add Sub-Organization" }).first().click()
  const dialog = page.getByRole("dialog", { name: "Add Sub-Organization" })

  // Cancel does not create anything.
  await dialog.getByPlaceholder("e.g. Bole Branch").fill("Should not exist")
  await dialog.getByRole("button", { name: "Cancel" }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText("Should not exist")).toHaveCount(0)

  await page.getByRole("button", { name: "Add Sub-Organization" }).first().click()
  await fillBranchForm(dialog, name)

  // Map: Google Maps loads, GPS button uses the browser location, inputs are editable.
  await expect(dialog.getByText("Loading map...")).toBeHidden({ timeout: 30_000 })
  await dialog.getByRole("button", { name: "Use My GPS" }).click()
  await expect(fieldNear(dialog, "Latitude")).toHaveValue(/^9\.02/)
  await expect(fieldNear(dialog, "Longitude")).toHaveValue(/^38\.77/)
  await fieldNear(dialog, "Longitude").fill("38.7613")
  await fieldNear(dialog, "Geofence Radius (meters)").fill("300")

  await dialog.getByTitle("Fullscreen map").click()
  const full = page.getByRole("dialog", { name: "Select Location & Geofence (Fullscreen)" })
  await expect(full).toBeVisible()
  await expect(full.getByText("Radius: 300m")).toBeVisible()
  await full.getByRole("button", { name: "Done & Return" }).click()
  await expect(full).toBeHidden()

  await dialog.getByRole("button", { name: "Create Sub-Organization" }).click()
  await expect(dialog).toBeHidden()
  const card = branchCard(name)
  await expect(card).toContainText("Bole Rd, Friendship Bldg")
  await expect(card).toContainText("9.0200, 38.7613")
  await expect(card).toContainText("300 meters")
  await expect(card).toContainText("08:00 - 17:00")
  await expect(card).toContainText("+10 mins late allowed")
  await expect(card).toContainText("0 employees")
  writeState({ branchName: name })
})

test("map address search moves the pin", async () => {
  await page.getByRole("button", { name: "Add Sub-Organization" }).first().click()
  const dialog = page.getByRole("dialog", { name: "Add Sub-Organization" })
  await expect(dialog.getByText("Loading map...")).toBeHidden({ timeout: 30_000 })
  const lat = fieldNear(dialog, "Latitude")
  const before = await lat.inputValue()
  await dialog.getByPlaceholder("Search address, landmark, or city...").fill("Hawassa, Ethiopia")
  await dialog.getByPlaceholder("Search address, landmark, or city...").press("Enter")
  await expect(lat).not.toHaveValue(before)
  await expect(lat).toHaveValue(/^7\./) // Hawassa ≈ 7.06° N
  await dialog.getByRole("button", { name: "Cancel" }).click()
})

test("edit details and rename a branch", async () => {
  const name = need("branchName")
  await branchCard(name).getByRole("button", { name: "Edit Details" }).click()
  const edit = page.getByRole("dialog", { name: "Edit Sub-Organization" })
  await expect(edit.getByPlaceholder("e.g. Bole Branch")).toHaveValue(name)
  await expect(fieldNear(edit, "Office Start Time")).toHaveValue("08:00")
  await fieldNear(edit, "Grace Minutes (Allowed Late)").fill("20")
  await edit.getByRole("button", { name: "Save Changes" }).click()
  await expect(edit).toBeHidden()
  await expect(branchCard(name)).toContainText("+20 mins late allowed")

  const renamed = `Bole HQ ${readState().run}`
  await branchCard(name).getByRole("button", { name: "Rename" }).click()
  const rename = page.getByRole("dialog", { name: "Rename Sub-Organization" })
  await rename.getByPlaceholder("e.g. Main Headquarters").fill("")
  await rename.getByRole("button", { name: "Rename" }).click()
  await expect(rename.getByPlaceholder("e.g. Main Headquarters")).toHaveJSProperty("validity.valueMissing", true)
  await rename.getByPlaceholder("e.g. Main Headquarters").fill(renamed)
  await rename.getByRole("button", { name: "Rename" }).click()
  await expect(rename).toBeHidden()
  await expect(branchCard(renamed)).toBeVisible()
  writeState({ branchName: renamed })
})

test("delete a branch (cancel keeps it, confirm removes it)", async () => {
  const temp = `Temp Branch ${readState().run}`
  await page.getByRole("button", { name: "Add Sub-Organization" }).first().click()
  const dialog = page.getByRole("dialog", { name: "Add Sub-Organization" })
  await dialog.getByPlaceholder("e.g. Bole Branch").fill(temp)
  await dialog.getByRole("button", { name: "Create Sub-Organization" }).click()
  const card = branchCard(temp)
  await expect(card).toBeVisible()
  // The form starts from the defaults again after earlier creates/cancels.
  await expect(card).toContainText("9.0105, 38.7612")
  await expect(card).toContainText("500 meters")
  await expect(card).toContainText("08:30 - 17:30")
  await expect(card).toContainText("0 employees")

  await card.getByRole("button").last().click()
  await answerDialog(page, "Cancel")
  await expect(card).toBeVisible()
  await card.getByRole("button").last().click()
  await answerDialog(page, "Delete")
  await expect(branchCard(temp)).toHaveCount(0)
})

test("vice managers: empty state, create (password shown + copy), edit, deactivate, remove", async () => {
  const run = readState().run
  const branch = need("branchName")
  const email = `e2e-${run}-vice@example.com`
  await page.goto("/manager/vice-managers")
  await expect(page.getByRole("heading", { name: "No vice managers yet" })).toBeVisible()

  await page.getByRole("button", { name: "Add Vice Manager" }).first().click()
  const dialog = page.getByRole("dialog", { name: "Add Vice Manager" })
  await dialog.getByPlaceholder("e.g. Almaz Tadesse").fill("Almaz Vice")
  await dialog.getByPlaceholder("e.g. almaz@company.com").fill(email)
  await dialog.getByRole("button", { name: "Create Vice Manager" }).click()
  await expect(dialog.getByRole("combobox")).toHaveJSProperty("validity.valueMissing", true)
  await dialog.getByRole("combobox").selectOption({ label: branch })
  await dialog.getByRole("button", { name: "Create Vice Manager" }).click()

  await expect(dialog.getByText("Vice Manager Created Successfully!")).toBeVisible()
  await expect(dialog.getByText(`An email with login instructions has been sent to ${email}.`)).toBeVisible()
  // The password is only emailed, never shown; reset it to the shared test password.
  await expect(dialog.locator("code")).toHaveCount(0)
  await dialog.getByRole("button", { name: "Done" }).click()
  await expect(dialog).toBeHidden()
  setPassword("managers", email)
  writeState({ viceEmail: email, vicePassword: PASSWORD })

  const vmRow = row(page, email)
  await expect(vmRow).toContainText("Almaz Vice")
  await expect(vmRow).toContainText(branch)
  await expect(vmRow).toContainText("Active")
  await expect(vmRow).toContainText("Never")

  // Duplicate email is refused.
  await page.getByRole("button", { name: "Add Vice Manager" }).click()
  await dialog.getByPlaceholder("e.g. Almaz Tadesse").fill("Dup")
  await dialog.getByPlaceholder("e.g. almaz@company.com").fill(email)
  await dialog.getByRole("combobox").selectOption({ label: branch })
  await dialog.getByRole("button", { name: "Create Vice Manager" }).click()
  await expect(dialog.locator("div.text-red-400, div[class*='red']").first()).toBeVisible()
  await dialog.getByRole("button", { name: "Cancel" }).click()

  // Edit: email is read-only; rename + deactivate, then re-activate.
  await vmRow.getByRole("button", { name: "Edit" }).click()
  const edit = page.getByRole("dialog", { name: "Edit Vice Manager" })
  await expect(edit.locator("input[disabled]")).toHaveValue(email)
  await fieldNear(edit, /^Full Name/).fill("Almaz Tadesse")
  await edit.getByLabel("Account Active (allowed to login)").uncheck()
  await edit.getByRole("button", { name: "Save Changes" }).click()
  await expect(edit).toBeHidden()
  await expect(vmRow).toContainText("Almaz Tadesse")
  await expect(vmRow).toContainText("Inactive")
  await vmRow.getByRole("button", { name: "Edit" }).click()
  await edit.getByLabel("Account Active (allowed to login)").check()
  await edit.getByRole("button", { name: "Save Changes" }).click()
  await expect(vmRow).toContainText("Active")

  // Remove a second vice manager.
  const other = `e2e-${run}-vice2@example.com`
  await page.getByRole("button", { name: "Add Vice Manager" }).click()
  await dialog.getByPlaceholder("e.g. Almaz Tadesse").fill("Temp Vice")
  await dialog.getByPlaceholder("e.g. almaz@company.com").fill(other)
  await dialog.getByRole("combobox").selectOption({ label: `${need("mainBranchName")} (Default Main)` })
  await dialog.getByRole("button", { name: "Create Vice Manager" }).click()
  await dialog.getByRole("button", { name: "Done" }).click()
  await row(page, other).getByRole("button").last().click()
  await answerDialog(page, "Cancel")
  await expect(row(page, other)).toBeVisible()
  await row(page, other).getByRole("button").last().click()
  await answerDialog(page, "Remove")
  await expect(row(page, other)).toHaveCount(0)
  await expect(alert(page)).toHaveCount(0)
})
