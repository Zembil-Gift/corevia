import { expect, test, type Page } from "@playwright/test"
import { PASSWORD, addDays, alert, file, need, q, readState, row, session, setPassword, sql, writeState } from "../support"

test.describe.configure({ mode: "serial" })

const run = () => readState().run
const applicants = () => ({
  hire: { name: `Hana Hire ${run()}`, email: `e2e-${run()}-hana@example.com`, phone: "0911 111 222" },
  reject: { name: `Bereket Reject ${run()}`, email: `e2e-${run()}-bereket@example.com`, phone: "+251 922 333 444" },
  review: { name: `Chala Review ${run()}`, email: `e2e-${run()}-chala@example.com`, phone: "0733 444 555" },
})

async function openApply(page: Page) {
  await page.goto(`/o/${need("orgSlug")}/jobs/${need("jobSlug")}`)
  await page.getByRole("button", { name: "Apply" }).click()
  const d = page.getByRole("dialog", { name: `Apply for ${need("jobTitle")}` })
  await expect(d).toBeVisible()
  return d
}

async function apply(page: Page, a: { name: string; email: string; phone: string }, github?: string) {
  const d = await openApply(page)
  await d.getByLabel("Full name").fill(a.name)
  await d.getByLabel("Email").fill(a.email)
  await d.getByLabel("Phone number").fill(a.phone)
  if (github) await d.getByLabel(/GitHub/).fill(github)
  await d.locator("#apply-cv").setInputFiles(file("resume.pdf"))
  await d.getByLabel(/Portfolio/).fill("https://example.com/portfolio")
  await d.getByLabel(/Why us\?/).fill(`I love building HR tools. (${a.name})`)
  await d.locator('input[type="file"]').nth(1).setInputFiles(file("resume.pdf"))
  await d.getByRole("button", { name: "Submit application" }).click()
  await expect(d.getByRole("status")).toContainText("Application submitted", { timeout: 45_000 })
  await expect(d).toBeHidden({ timeout: 10_000 }) // auto-closes after 2s
}

test.describe("public application form", () => {
  test("client-side validation of every field", async ({ page }) => {
    const d = await openApply(page)
    await expect(d.getByText("(optional)")).toHaveCount(1) // Portfolio
    await expect(d.getByText("Link to your best work")).toBeVisible()
    await expect(d.getByText("PDF, Word (.doc), Word (.docx) · max 10 MB")).toBeVisible()
    await expect(d.getByText("PDF · max 10 MB")).toBeVisible() // cover letter: PDF only

    await d.getByRole("button", { name: "Submit application" }).click()
    await expect(alert(d)).toHaveText("Please fix the highlighted fields.")
    for (const msg of ["Full name is required", "Email is required", "Phone number is required", "CV / resume is required", "This file is required", "This field is required"]) {
      await expect(d.getByText(msg, { exact: true })).toBeVisible()
    }
    await expect(d.getByLabel("Full name")).toBeFocused()

    await d.getByLabel("Full name").fill("x")
    await expect(d.getByText("Full name is required")).toHaveCount(0) // clears as you type
    await d.getByLabel("Phone number").fill("12345")
    await d.getByLabel(/Portfolio/).fill("not-a-link")
    await d.locator("#apply-cv").setInputFiles(file("notes.txt"))
    await expect(d.getByText("Allowed: PDF, Word (.doc), Word (.docx)")).toBeVisible()
    await d.locator("#apply-cv").setInputFiles(file("resume.pdf"))
    await expect(d.getByText("resume.pdf")).toBeVisible()
    await d.getByLabel(/Why us\?/).fill("abc")
    await expect(d.getByText("3 / 300")).toBeVisible()
    await d.getByRole("button", { name: "Submit application" }).click()
    await expect(d.getByText("Enter an Ethiopian number, e.g. 0911 234 567 or +251 911 234 567")).toBeVisible()
    await expect(d.getByText("Enter a full link starting with https://")).toBeVisible()

    await d.getByRole("button", { name: "Cancel" }).click()
    await expect(d).toBeHidden()
    // Re-opening starts clean.
    const again = await openApply(page)
    await expect(again.getByLabel("Full name")).toHaveValue("")
    await again.getByRole("button", { name: "Close" }).click()
  })

  test("three candidates apply (real CV upload); duplicate email and phone are refused", async ({ page }) => {
    const a = applicants()
    await apply(page, a.hire, "hana-e2e")
    await apply(page, a.reject)
    await apply(page, a.review, "https://github.com/chala-e2e")

    const d = await openApply(page)
    await d.getByLabel("Full name").fill("Dup")
    await d.getByLabel("Email").fill(a.hire.email)
    await d.getByLabel("Phone number").fill("0977 000 111")
    await d.locator("#apply-cv").setInputFiles(file("resume.pdf"))
    await d.getByLabel(/Why us\?/).fill("dup")
    await d.locator('input[type="file"]').nth(1).setInputFiles(file("resume.pdf"))
    await d.getByRole("button", { name: "Submit application" }).click()
    await expect(alert(d)).toHaveText("You have already applied for this job with this email")
    await d.getByLabel("Email").fill(`e2e-${run()}-dup@example.com`)
    await d.getByLabel("Phone number").fill(a.reject.phone)
    await d.getByRole("button", { name: "Submit application" }).click()
    await expect(alert(d)).toHaveText("You have already applied for this job with this phone number")
  })
})

test.describe("manager hiring pipeline", () => {
  let page: Page
  test.beforeAll(async ({ browser }) => {
    page = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
  })
  test.afterAll(() => page.context().close())

  const applicantsUrl = () => `/manager/jobs/${need("jobId")}/applicants`

  test("dashboard counts new applicants on open jobs", async () => {
    await page.goto("/manager")
    await expect(page.getByRole("link").filter({ hasText: "total on open jobs" })).toContainText("3")
    await page.getByRole("link", { name: new RegExp(need("jobTitle")) }).click()
    await expect(page).toHaveURL(new RegExp(`${applicantsUrl()}$`))
  })

  test("applicant list: details, answers, resume and GitHub links", async () => {
    const a = applicants()
    await page.goto(applicantsUrl())
    await expect(page.getByRole("heading", { name: "Applicants" })).toBeVisible()
    const r = row(page, a.hire.name)
    await expect(r).toContainText(a.hire.email)
    await expect(r).toContainText("APPLIED")
    await expect(r.getByRole("link", { name: "View resume" })).toHaveAttribute("href", /^https?:\/\//)
    await expect(r.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/hana-e2e")
    await r.getByText("Answers (3)").click()
    await expect(r.getByText(`I love building HR tools. (${a.hire.name})`)).toBeVisible()
    await expect(r.getByRole("link", { name: "https://example.com/portfolio" })).toBeVisible()
    await expect(r.getByRole("link", { name: "resume.pdf" })).toHaveAttribute("href", /^https?:\/\//)
    await expect(row(page, a.reject.name).getByRole("link", { name: "GitHub" })).toHaveCount(0)
  })

  test("AI overview: score button opens the breakdown modal; pending/failed states", async () => {
    const a = applicants()
    const job = need("jobId")
    // ponytail: the Gemini job runs async and may not be done; seed a deterministic overview.
    const overview = JSON.stringify({
      matchScore: 87,
      strengths: ["Strong TypeScript", "Owns testing"],
      weaknesses: ["Little mobile experience"],
      overallAssessment: "Good fit for the platform team.",
    })
    sql(`UPDATE job_applications SET ai_overview_status='COMPLETED', ai_overview_text=${q(overview)}, ai_overview_completed_at=now(), ai_overview_attempt_count=99
         WHERE job_id=${job} AND email=${q(a.hire.email)};
         UPDATE job_applications SET ai_overview_status='FAILED', ai_overview_attempt_count=99 WHERE job_id=${job} AND email=${q(a.reject.email)};
         UPDATE job_applications SET ai_overview_status='PENDING', ai_overview_attempt_count=99 WHERE job_id=${job} AND email=${q(a.review.email)};`)
    await page.goto(applicantsUrl())
    await expect(row(page, a.reject.name)).toContainText("Failed")
    await expect(row(page, a.review.name)).toContainText("Pending")
    await row(page, a.hire.name).getByRole("button", { name: "87%" }).click()
    const modal = page.getByRole("dialog", { name: "AI overview" })
    await expect(modal.getByText(a.hire.name)).toBeVisible()
    await expect(modal.getByText(need("jobTitle"))).toBeVisible()
    await expect(modal.getByText("Strong TypeScript")).toBeVisible()
    await expect(modal.getByText("Little mobile experience")).toBeVisible()
    await expect(modal.getByText("Good fit for the platform team.")).toBeVisible()
    await expect(modal.getByText(/Disclaimer: This is AI generated/)).toBeVisible()
    await modal.getByRole("button", { name: "Close" }).click()
    await expect(modal).toBeHidden()
  })

  test("status filter, mark under review, select for interview", async () => {
    const a = applicants()
    const filter = page.getByLabel("Filter applicants by status")
    await filter.selectOption("HIRED")
    await expect(page.getByText("No applicants found with status HIRED.")).toBeVisible()
    await filter.selectOption("APPLIED")
    await expect(page.locator("tbody tr")).toHaveCount(3)
    await filter.selectOption("ALL")

    await row(page, a.review.name).getByRole("button", { name: "Mark Under Review" }).click()
    await expect(row(page, a.review.name)).toContainText("UNDER_REVIEW")
    await expect(row(page, a.review.name).getByRole("button", { name: "Mark Under Review" })).toBeDisabled()

    const select = page.getByRole("button", { name: /Select for Interview/ })
    await expect(select).toHaveText("Select for Interview (0)")
    await expect(select).toBeDisabled()
    await page.getByLabel(`Select ${a.hire.name}`).check()
    await page.getByLabel(`Select ${a.reject.name}`).check()
    await expect(select).toHaveText("Select for Interview (2)")
    await select.click()
    await expect(row(page, a.hire.name)).toContainText("SELECTED_FOR_INTERVIEW")
    await expect(row(page, a.reject.name)).toContainText("SELECTED_FOR_INTERVIEW")
    await expect(page.getByLabel(`Select ${a.hire.name}`)).toBeDisabled()
    await expect(row(page, a.review.name).getByRole("button", { name: "Hire" })).toBeDisabled()
  })

  test("hire a candidate into a branch (cancel, validation, success)", async () => {
    const a = applicants()
    await row(page, a.hire.name).getByRole("button", { name: "Hire" }).click()
    await expect(page.getByPlaceholder("Phone")).toHaveValue(/911/)
    await page.getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByPlaceholder("Position")).toHaveCount(0)

    await row(page, a.hire.name).getByRole("button", { name: "Hire" }).click()
    await page.getByPlaceholder("Position").fill("QA Engineer")
    await page.getByLabel("Sub-organization").selectOption({ label: need("branchName") })
    await page.locator('form input[type="date"]').fill(addDays(25))
    await page.getByPlaceholder("Salary amount").fill("0")
    await page.getByRole("button", { name: `Hire ${a.hire.name}` }).click()
    await expect(page.getByPlaceholder("Salary amount")).toHaveJSProperty("validity.rangeUnderflow", true)
    await page.getByPlaceholder("Salary amount").fill("40000")
    await page.getByRole("button", { name: `Hire ${a.hire.name}` }).click()
    await expect(row(page, a.hire.name)).toContainText("HIRED")
    await expect(page.getByPlaceholder("Position")).toHaveCount(0)
  })

  test("send rejections from the jobs list, then everyone not hired is rejected", async () => {
    const a = applicants()
    await page.goto("/manager/jobs")
    await row(page, need("jobTitle")).getByRole("button", { name: "Send Rejections" }).click()
    await page.getByRole("link", { name: "Applicants" }).first().click()
    await page.goto(applicantsUrl())
    await expect(row(page, a.reject.name)).toContainText("REJECTED")
    await expect(row(page, a.review.name)).toContainText("REJECTED")
    await expect(row(page, a.hire.name)).toContainText("HIRED")
    await page.getByRole("link", { name: "Back to jobs" }).click()
    await expect(page).toHaveURL(/\/manager\/jobs$/)
  })

  test("the hire is now an employee in the chosen branch", async () => {
    const a = applicants()
    await page.goto("/manager/employees")
    const r = row(page, a.hire.email)
    await expect(r).toContainText(a.hire.name)
    await expect(r).toContainText("QA Engineer")
    await expect(r).toContainText(need("branchName"))
    await expect(r).toContainText("40,000.00 ETB")
    setPassword("employees", a.hire.email)
    writeState({ hired: { name: a.hire.name, email: a.hire.email } })
  })
})
