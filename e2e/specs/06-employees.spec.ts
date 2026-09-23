import { expect, test, type Page } from "@playwright/test"
import { PASSWORD, addDays, answerDialog, file, need, readState, row, session, setPassword, writeState } from "../support"

test.describe.configure({ mode: "serial" })

let page: Page
test.beforeAll(async ({ browser }) => {
  page = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
  await page.goto("/manager/employees")
})
test.afterAll(() => page.context().close())

const dialog = () => page.getByRole("dialog")

async function createEmployee(opts: {
  name: string
  email: string
  phone: string
  position: string
  branch?: string
  salary?: string
  salaryDate?: string
  days?: string[]
  photo?: boolean
}) {
  await page.getByRole("button", { name: "Add employee" }).click()
  const d = page.getByRole("dialog", { name: "Create employee" })
  await expect(d.locator("#employee-suborg")).toHaveValue(/\d+/) // defaults to the main branch
  if (opts.branch) await d.locator("#employee-suborg").selectOption({ label: opts.branch })
  await d.getByLabel("Name").fill(opts.name)
  await d.getByLabel("Email").fill(opts.email)
  await d.getByLabel("Phone").fill(opts.phone)
  await d.getByLabel("Position").fill(opts.position)
  await d.getByLabel("LinkedIn URL").fill("https://linkedin.com/in/e2e")
  if (opts.salaryDate) await d.getByLabel("Salary date").fill(opts.salaryDate)
  if (opts.salary) await d.getByLabel("Gross salary amount").fill(opts.salary)
  for (const day of opts.days ?? []) await d.getByLabel(day, { exact: true }).check()
  if (opts.photo) {
    const input = d.locator('input[type="file"]')
    await input.setInputFiles(file("notes.txt"))
    await expect(d.getByText("Only PNG, JPG, GIF, and WEBP files are allowed.")).toBeVisible()
    await input.setInputFiles(file("image.png"))
    await expect(d.getByRole("img", { name: "Employee photo preview" })).toBeVisible()
    await d.getByRole("button", { name: "Remove image" }).click()
    await expect(d.getByText("Click to upload one photo")).toBeVisible()
    await input.setInputFiles(file("image.png"))
  }
  await d.getByRole("button", { name: "Create employee" }).click()
  await expect(d).toBeHidden()
  await expect(row(page, opts.email)).toBeVisible()
}

test("create-employee modal: cancel, close button, required fields, bad salary", async () => {
  await page.getByRole("button", { name: "Add employee" }).click()
  const d = page.getByRole("dialog", { name: "Create employee" })
  await d.getByRole("button", { name: "Cancel" }).click()
  await expect(d).toBeHidden()
  await page.getByRole("button", { name: "Add employee" }).click()
  await d.getByRole("button", { name: "Close" }).click()
  await expect(d).toBeHidden()

  await page.getByRole("button", { name: "Add employee" }).click()
  await d.getByRole("button", { name: "Create employee" }).click()
  await expect(d.getByLabel("Name")).toHaveJSProperty("validity.valueMissing", true)
  await d.getByLabel("Gross salary amount").fill("-5")
  await expect(d.getByLabel("Gross salary amount")).toHaveJSProperty("validity.rangeUnderflow", true)
  await d.getByRole("button", { name: "Cancel" }).click()
})

test("create employees in different branches (with photo, salary, schedule)", async () => {
  const run = readState().run
  const emp1 = { name: `Abebe One ${run}`, email: `e2e-${run}-emp1@example.com` }
  const emp2 = { name: `Sara Two ${run}`, email: `e2e-${run}-emp2@example.com` }
  await createEmployee({
    ...emp1, phone: "0911223344", position: "Backend Engineer",
    // First payment is due salary date + 30 days, so this makes it due tomorrow.
    salary: "30000", salaryDate: addDays(-29), days: ["MON", "TUE", "WED"], photo: true,
  })
  await createEmployee({
    ...emp2, phone: "0922334455", position: "Designer", branch: need("branchName"),
    salary: "25000.50", salaryDate: addDays(20), days: ["THU"],
  })
  const r1 = row(page, emp1.email)
  await expect(r1).toContainText(emp1.name)
  await expect(r1).toContainText(need("mainBranchName"))
  await expect(r1).toContainText("Backend Engineer")
  await expect(r1).toContainText("30,000.00 ETB")
  await expect(r1).toContainText("MON, TUE, WED")
  await expect(r1).toContainText("Active")
  await expect(row(page, emp2.email)).toContainText(need("branchName"))
  await expect(row(page, emp2.email)).toContainText("25,000.50 ETB")

  // Duplicate email is refused inline.
  await page.getByRole("button", { name: "Add employee" }).click()
  const d = page.getByRole("dialog", { name: "Create employee" })
  await d.getByLabel("Name").fill("Dup")
  await d.getByLabel("Email").fill(emp1.email)
  await d.getByLabel("Phone").fill("0933445566")
  await d.getByLabel("Position").fill("Dup")
  await d.getByRole("button", { name: "Create employee" }).click()
  await expect(d.locator("p.text-red-400")).toBeVisible()
  await d.getByRole("button", { name: "Cancel" }).click()

  setPassword("employees", emp1.email)
  setPassword("employees", emp2.email)
  writeState({ emp1, emp2 })
})

test("branch filter narrows the list", async () => {
  const filter = page.locator("select").first()
  await filter.selectOption({ label: need("branchName") })
  await expect(row(page, need("emp2").email)).toBeVisible()
  await expect(row(page, need("emp1").email)).toHaveCount(0)
  await expect(page.getByText("1 employees")).toBeVisible()
  await filter.selectOption({ label: "All Sub-Organizations" })
  await expect(row(page, need("emp1").email)).toBeVisible()
})

test("edit employee: fields, email-change warning, deactivate/reactivate", async () => {
  const emp1 = need("emp1")
  await page.getByRole("button", { name: `Edit ${emp1.name}` }).click()
  const d = page.getByRole("dialog", { name: "Edit employee" })
  await expect(d.getByLabel("Name")).toHaveValue(emp1.name)
  await expect(d.getByLabel("Gross salary amount")).toHaveValue("30000")
  await expect(d.getByLabel("MON", { exact: true })).toBeChecked()
  await expect(d.getByText("Current photo is shown. Upload a new one to replace it.")).toBeVisible()

  await d.getByLabel("Email").fill("changed@example.com")
  await expect(d.getByText("Changing the email resets the password")).toBeVisible()
  await d.getByLabel("Email").fill(emp1.email)
  await expect(d.getByText("Changing the email resets the password")).toHaveCount(0)

  await d.getByLabel("Position").fill("Senior Backend Engineer")
  await d.getByLabel("FRI", { exact: true }).check()
  await d.getByLabel("Active employee").uncheck()
  await d.getByRole("button", { name: "Save changes" }).click()
  await expect(d).toBeHidden()
  const r = row(page, emp1.email)
  await expect(r).toContainText("Senior Backend Engineer")
  await expect(r).toContainText("Inactive")
  await expect(r).toContainText("FRI")

  await page.getByRole("button", { name: `Edit ${emp1.name}` }).click()
  await d.getByLabel("Active employee").check()
  await d.locator('input[type="file"]').setInputFiles(file("image.png")) // replace photo
  await d.getByRole("button", { name: "Save changes" }).click()
  await expect(d).toBeHidden()
  await expect(r).toContainText("Active")
})

test("attendance modal: add a record, cancel the form, close", async () => {
  const emp1 = need("emp1")
  await page.getByRole("button", { name: `View attendance for ${emp1.name}` }).click()
  const modal = page.locator("div.fixed", { has: page.getByRole("heading", { name: "Attendance" }) }).last()
  await expect(modal.getByText(emp1.name)).toBeVisible()
  await expect(modal.getByText("No attendance records found")).toBeVisible()

  await modal.getByRole("button", { name: "Add Attendance" }).click()
  await modal.getByRole("button", { name: "Cancel" }).click()
  await expect(modal.getByRole("heading", { name: "Add/Update Attendance" })).toHaveCount(0)

  await modal.getByRole("button", { name: "Add Attendance" }).click()
  await modal.getByLabel("Date").fill(addDays(-1))
  await modal.getByLabel("Clock In").fill("08:10")
  await modal.getByLabel("Clock Out").fill("17:05")
  await modal.getByLabel("Lunch Break In").fill("12:30")
  await modal.getByLabel("Lunch Break Out").fill("13:15")
  await modal.getByRole("button", { name: "Save" }).click()
  await expect(modal.getByText(addDays(-1))).toBeVisible()
  await expect(modal.getByText("In: 08:10")).toBeVisible()
  await expect(modal.getByText("Out: 17:05")).toBeVisible()
  await expect(modal.getByText("Lunch: 12:30 - 13:15")).toBeVisible()

  await modal.getByRole("button").first().click() // X
  await expect(page.getByRole("heading", { name: "Attendance" })).toHaveCount(0)
})

test("delete an employee (cancel keeps, confirm soft-deletes)", async () => {
  const run = readState().run
  const temp = { name: `Temp Three ${run}`, email: `e2e-${run}-emp3@example.com` }
  await createEmployee({ ...temp, phone: "0944556677", position: "Intern", days: ["MON"] })
  await page.getByRole("button", { name: `Delete ${temp.name}` }).click()
  await answerDialog(page, "Cancel")
  await expect(row(page, temp.email)).toBeVisible()
  await page.getByRole("button", { name: `Delete ${temp.name}` }).click()
  await answerDialog(page, "Delete")
  // Delete is a soft delete: the employee stays listed as Inactive (and can't sign in).
  await expect(row(page, temp.email)).toContainText("Inactive")
})

test("branch card shows the employee count", async () => {
  await page.goto("/manager/sub-organizations")
  await expect(page.locator("div.rounded-2xl", { has: page.getByRole("heading", { name: need("branchName") }) })).toContainText("1 employee")
})

test("office days are required on create and edit", async () => {
  const run = readState().run
  const email = `e2e-${run}-nodays@example.com`
  await page.goto("/manager/employees")
  await page.getByRole("button", { name: "Add employee" }).click()
  const d = page.getByRole("dialog", { name: "Create employee" })
  await d.getByLabel("Name").fill(`No Days ${run}`)
  await d.getByLabel("Email").fill(email)
  await d.getByLabel("Phone").fill("0955667788")
  await d.getByLabel("Position").fill("Intern")
  await d.getByRole("button", { name: "Create employee" }).click()
  await expect(d.getByText("Select at least one office day")).toBeVisible()
  await expect(row(page, email)).toHaveCount(0)
  await d.getByLabel("MON", { exact: true }).check()
  await d.getByRole("button", { name: "Create employee" }).click()
  await expect(d).toBeHidden()
  await expect(row(page, email)).toContainText("MON")

  await page.getByRole("button", { name: `Edit No Days ${run}` }).click()
  const e = page.getByRole("dialog", { name: "Edit employee" })
  await e.getByLabel("MON", { exact: true }).uncheck()
  await e.getByRole("button", { name: "Save changes" }).click()
  await expect(e.getByText("Select at least one office day")).toBeVisible()
  await e.getByRole("button", { name: "Cancel" }).click()
  await expect(row(page, email)).toContainText("MON")
})
