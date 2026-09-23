import { expect, test, type Locator, type Page } from "@playwright/test"
import { PASSWORD, addDays, answerDialog, eventually, file, need, readState, row, session, writeState } from "../support"

test.describe.configure({ mode: "serial" })

let page: Page
test.beforeAll(async ({ browser }) => {
  page = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
})
test.afterAll(() => page.context().close())

const run = () => readState().run

/** Cover image widget (components/admin/image-upload.tsx) — both tabs. */
async function coverByUpload(d: Locator) {
  await d.getByRole("tab", { name: "Upload" }).click()
  const input = d.locator('input[type="file"]')
  await input.setInputFiles(file("notes.txt"))
  await expect(d.getByText("Only PNG, JPG, and WEBP files are allowed.")).toBeVisible()
  await input.setInputFiles(file("image.png"))
  await expect(d.getByRole("img", { name: "Cover preview" })).toHaveAttribute("src", /^https?:\/\//, { timeout: 30_000 })
}

async function coverByUrl(d: Locator, url: string) {
  await d.getByRole("tab", { name: "Image URL" }).click()
  await d.getByPlaceholder("https://...").last().fill("not a url")
  await d.getByRole("button", { name: "Use URL" }).click()
  await expect(d.getByText("Enter a valid http(s) image URL.")).toBeVisible()
  await d.getByPlaceholder("https://...").last().fill(url)
  await d.getByRole("button", { name: "Use URL" }).click()
  await expect(d.getByRole("img", { name: "Cover preview" })).toHaveAttribute("src", url)
}

test.describe("blog", () => {
  test("create published (uploaded cover) and draft posts; public list shows only published", async () => {
    const title = `E2E Launch Notes ${run()}`
    const slug = `e2e-launch-${run()}`
    await page.goto("/manager/blog")
    await expect(page.getByRole("heading", { name: "Blog", level: 1 })).toBeVisible()

    await page.getByRole("button", { name: "Create blog" }).click()
    const d = page.getByRole("dialog", { name: "Create new blog post" })
    await d.getByRole("button", { name: "Create post" }).click()
    await expect(d.getByLabel("Title")).toHaveJSProperty("validity.valueMissing", true)

    await d.getByLabel("Title").fill(title)
    await d.getByLabel("Slug").fill(slug)
    await d.getByLabel("Excerpt").fill("What we shipped this month")
    await d.getByLabel("Content").fill("We shipped the end-to-end suite.")
    await coverByUpload(d)
    // Removing the image returns to the picker.
    await d.getByRole("button", { name: "Remove image" }).click()
    await expect(d.getByRole("tab", { name: "Upload" })).toBeVisible()
    await coverByUpload(d)
    await expect(d.getByLabel("Status")).toHaveValue("PUBLISHED")
    await d.getByRole("button", { name: "Create post" }).click()
    await expect(d).toBeHidden()
    await expect(row(page, title)).toContainText("PUBLISHED")

    const draft = `E2E Draft ${run()}`
    await page.getByRole("button", { name: "Create blog" }).click()
    await d.getByLabel("Title").fill(draft)
    await d.getByLabel("Slug").fill(`e2e-draft-${run()}`)
    await d.getByLabel("Status").selectOption("DRAFT")
    await d.getByRole("button", { name: "Create post" }).click()
    await expect(d.getByLabel("Content")).toHaveJSProperty("validity.valueMissing", true)
    await d.getByLabel("Content").fill("Draft body")
    await d.getByRole("button", { name: "Create post" }).click()
    await expect(row(page, draft)).toContainText("DRAFT")
    await expect(row(page, draft).getByRole("link", { name: "View" })).toHaveCount(0)
    await expect(row(page, title).getByRole("link", { name: "View" })).toHaveAttribute("href", `/o/${need("orgSlug")}/blog/${slug}`)
    await expect(page.getByRole("link", { name: "View public blog" })).toHaveAttribute("href", `/o/${need("orgSlug")}/blog`)
    await expect(page.getByText("2 posts on this page")).toBeVisible()

    // A taken slug gets a numeric suffix instead of failing; then remove the extra post.
    const dup = `E2E Dup ${run()}`
    await page.getByRole("button", { name: "Create blog" }).click()
    await d.getByLabel("Title").fill(dup)
    await d.getByLabel("Slug").fill(slug)
    await d.getByLabel("Content").fill("Dup body")
    await d.getByRole("button", { name: "Create post" }).click()
    await expect(d).toBeHidden()
    await expect(row(page, dup).getByRole("link", { name: "View" })).toHaveAttribute("href", `/o/${need("orgSlug")}/blog/${slug}-2`)
    await page.getByRole("button", { name: `Delete ${dup}` }).click()
    await answerDialog(page, "Delete")
    await expect(row(page, dup)).toHaveCount(0)

    writeState({ blogTitle: title, blogSlug: slug })
  })

  test("edit a post and delete the draft", async () => {
    const title = need("blogTitle")
    await page.getByRole("button", { name: `Edit ${title}` }).click()
    const d = page.getByRole("dialog", { name: "Edit blog post" })
    await expect(d.getByLabel("Title")).toHaveValue(title)
    await expect(d.getByRole("img", { name: "Cover preview" })).toBeVisible()
    const edited = `${title} (edited)`
    await d.getByLabel("Title").fill(edited)
    await d.getByLabel("Content").fill("We shipped the end-to-end suite. Every UI feature is covered.")
    await d.getByRole("button", { name: "Save changes" }).click()
    await expect(d).toBeHidden()
    await expect(row(page, edited)).toBeVisible()
    writeState({ blogTitle: edited })

    const draft = `E2E Draft ${run()}`
    await page.getByRole("button", { name: `Delete ${draft}` }).click()
    await answerDialog(page, "Cancel")
    await expect(row(page, draft)).toBeVisible()
    await page.getByRole("button", { name: `Delete ${draft}` }).click()
    await answerDialog(page, "Delete")
    await expect(row(page, draft)).toHaveCount(0)
  })

  test("manager blog list paginates (10 per page)", async () => {
    // Bulk-create through the same proxy the create modal posts to.
    for (let i = 1; i <= 10; i++) {
      const res = await page.request.post("/api/admin/blogs", {
        data: { title: `E2E Filler ${i} ${run()}`, slug: `e2e-filler-${i}-${run()}`, excerpt: "", content: "Filler", coverImageUrl: "", status: "DRAFT" },
      })
      expect(res.ok()).toBeTruthy()
    }
    await page.goto("/manager/blog")
    const nav = page.getByRole("navigation", { name: "Blog pagination" })
    await expect(nav).toContainText("Page 1 of 2")
    await expect(page.getByText("10 posts on this page")).toBeVisible()
    await expect(nav.getByRole("button").first()).toBeDisabled()
    await nav.getByRole("button").last().click()
    await expect(nav).toContainText("Page 2 of 2")
    await expect(page.getByText("1 posts on this page")).toBeVisible()
    await expect(nav.getByRole("button").last()).toBeDisabled()
    await nav.getByRole("button").first().click()
    await expect(nav).toContainText("Page 1 of 2")
  })

  test("public blog list and article page", async () => {
    const slug = need("orgSlug")
    const pub = await page.context().newPage()
    const link = pub.getByRole("link", { name: new RegExp(need("blogTitle").replace(/[()]/g, "\\$&")) })
    await eventually(pub, `/o/${slug}/blog`, async () => {
      await expect(pub.getByRole("heading", { name: "Blog", level: 1 })).toBeVisible()
      await expect(link).toBeVisible({ timeout: 2_000 })
    })
    await expect(pub.getByText(`E2E Draft ${run()}`)).toHaveCount(0)
    await link.click()
    await expect(pub).toHaveURL(new RegExp(`/o/${slug}/blog/${need("blogSlug")}$`))
    await expect(pub.getByRole("heading", { name: need("blogTitle"), level: 1 })).toBeVisible()
    await expect(pub.getByText("What we shipped this month")).toBeVisible()
    await expect(pub.getByText("Every UI feature is covered.")).toBeVisible()
    await pub.getByRole("link", { name: /Back to/ }).click()
    await expect(pub).toHaveURL(new RegExp(`/o/${slug}#blog$`))
    await pub.close()
  })
})

test.describe("events", () => {
  test("create online (URL cover, registration link) and in-person draft events; edit", async () => {
    const title = `E2E Meetup ${run()}`
    const slug = `e2e-meetup-${run()}`
    await page.goto("/manager/events")
    await page.getByRole("button", { name: "Create event" }).click()
    const d = page.getByRole("dialog", { name: "Create event" })
    await d.getByLabel("Title").fill(title)
    await d.getByLabel("Slug").fill(slug)
    await d.getByLabel("Description").fill("Monthly engineering meetup.")
    await d.getByLabel("Event type").selectOption("ONLINE")
    await d.getByLabel("Location").fill("Online (Zoom)")
    await d.getByLabel("Start date & time").fill(`${addDays(14)}T18:00`)
    await d.getByLabel("End date & time").fill(`${addDays(14)}T20:00`)
    await d.getByLabel("Registration URL").fill("https://example.com/register")
    await coverByUrl(d, "https://placehold.co/600x300.png")
    await d.getByLabel("Status").selectOption("PUBLISHED")
    await d.getByRole("button", { name: "Create event" }).click()
    await expect(d).toBeHidden()
    await expect(row(page, title)).toContainText("Online")
    await expect(row(page, title)).toContainText("Published")

    const draft = `E2E Workshop ${run()}`
    await page.getByRole("button", { name: "Create event" }).click()
    await d.getByLabel("Title").fill(draft)
    await d.getByLabel("Slug").fill(`e2e-workshop-${run()}`)
    await d.getByLabel("Event type").selectOption("IN_PERSON")
    await d.getByLabel("Location").fill("Addis Ababa")
    await d.getByLabel("Start date & time").fill(`${addDays(20)}T09:00`)
    await d.getByLabel("End date & time").fill(`${addDays(20)}T12:00`)
    await d.getByLabel("Status").selectOption("DRAFT")
    await d.getByRole("button", { name: "Create event" }).click()
    await expect(d.getByLabel("Description")).toHaveJSProperty("validity.valueMissing", true)
    await d.getByLabel("Description").fill("Hands-on workshop.")
    await d.getByRole("button", { name: "Create event" }).click()
    await expect(row(page, draft)).toContainText("In-person")
    await expect(row(page, draft)).toContainText("Draft")
    await expect(page.getByRole("link", { name: "View public events" })).toHaveAttribute("href", `/o/${need("orgSlug")}/events`)

    await page.getByRole("button", { name: `Edit ${title}` }).click()
    const e = page.getByRole("dialog", { name: "Edit event" })
    await expect(e.getByLabel("Title")).toHaveValue(title)
    await e.getByLabel("Location").fill("Online (Google Meet)")
    await e.getByRole("button", { name: "Save changes" }).click()
    await expect(e).toBeHidden()
    writeState({ eventTitle: title, eventSlug: slug })
  })

  test("public events list and event page with register link", async () => {
    const slug = need("orgSlug")
    const pub = await page.context().newPage()
    const link = pub.getByRole("link", { name: new RegExp(need("eventTitle")) })
    await eventually(pub, `/o/${slug}/events`, () => expect(link).toBeVisible({ timeout: 2_000 }))
    await expect(pub.getByText(`E2E Workshop ${run()}`)).toHaveCount(0)
    await link.click()
    await expect(pub.getByRole("heading", { name: need("eventTitle"), level: 1 })).toBeVisible()
    await expect(pub.getByText("Online (Google Meet)")).toBeVisible()
    await expect(pub.getByText("Monthly engineering meetup.")).toBeVisible()
    await expect(pub.getByRole("link", { name: "Register" })).toHaveAttribute("href", "https://example.com/register")
    await pub.close()
  })
})

test.describe("jobs + application form builder", () => {
  test("form builder: add/reorder/remove fields, file types, char limit, validation", async () => {
    const title = `E2E Engineer ${run()}`
    const slug = `e2e-engineer-${run()}`
    await page.goto("/manager/jobs")
    await page.getByRole("button", { name: "Create job" }).click()
    const d = page.getByRole("dialog", { name: "Create job" })
    await d.getByLabel("Title").fill(title)
    await d.getByLabel("Slug").fill(slug)
    await d.getByLabel("Department").fill("Engineering")
    await d.getByLabel("Employment type").selectOption("FULL_TIME")
    await d.getByLabel("Location").fill("Remote")
    await d.getByLabel("Description").fill("Build and test the platform end to end.")
    await d.getByLabel("Experience level").selectOption("Senior")
    await d.getByLabel(/Salary range/).fill("ETB 60,000 – 80,000 / month")
    await d.getByLabel(/Application deadline/).fill(addDays(30))

    const form = d.getByRole("group", { name: "Application form" })
    await form.getByRole("button", { name: "Link", exact: true }).click()
    await form.getByRole("button", { name: "File upload", exact: true }).click()
    await form.getByRole("button", { name: "Written answer", exact: true }).click()
    await form.getByRole("button", { name: "Link", exact: true }).click() // 4th, removed below
    const titles = form.getByLabel("Field title")
    await expect(titles).toHaveCount(4)

    // Empty field titles block saving.
    await d.getByLabel("Status").selectOption("OPEN")
    await d.getByRole("button", { name: "Create job" }).click()
    await expect(d.getByText("Application field 1 needs a title.")).toBeVisible()

    await titles.nth(0).fill("Portfolio")
    await form.getByLabel("Instructions for applicants (optional)").nth(0).fill("Link to your best work")
    await titles.nth(1).fill("Cover letter")
    await titles.nth(2).fill("Why us?")
    await form.getByRole("button", { name: "Remove Link" }).click()
    await expect(titles).toHaveCount(3)

    // Portfolio is optional.
    await form.getByLabel("Required").nth(0).uncheck()
    // Cover letter: PDF only (DOCX toggled off), then no types → validation error, then PDF back.
    await form.getByRole("button", { name: "Word (.docx)" }).click()
    await expect(form.getByRole("button", { name: "Word (.docx)" })).toHaveAttribute("aria-pressed", "false")
    await form.getByRole("button", { name: "PDF", exact: true }).click()
    await d.getByRole("button", { name: "Create job" }).click()
    await expect(d.getByText('"Cover letter" needs at least one allowed file type.')).toBeVisible()
    await form.getByRole("button", { name: "PDF", exact: true }).click()
    // Written answer character limit bounds.
    const limit = form.getByLabel("Character limit")
    await limit.fill("6000")
    await d.getByRole("button", { name: "Create job" }).click()
    await expect(limit).toHaveJSProperty("validity.rangeOverflow", true) // native max=5000
    await limit.fill("300")

    // Reorder: move "Why us?" up to 2nd, then "Portfolio" down.
    await form.getByRole("button", { name: "Move up" }).nth(2).click()
    await expect(titles.nth(1)).toHaveValue("Why us?")
    await expect(form.getByRole("button", { name: "Move up" }).first()).toBeDisabled()
    await expect(form.getByRole("button", { name: "Move down" }).last()).toBeDisabled()

    await d.getByRole("button", { name: "Create job" }).click()
    await expect(d).toBeHidden()
    const r = row(page, title)
    await expect(r).toContainText("Engineering")
    await expect(r).toContainText("Full-time")
    await expect(r).toContainText("Open")
    await expect(r.getByRole("link", { name: "Applicants" })).toHaveAttribute("href", /\/manager\/jobs\/\d+\/applicants$/)
    await expect(r.getByRole("link", { name: "View" })).toHaveAttribute("href", `/o/${need("orgSlug")}/jobs/${slug}`)
    await expect(r).toContainText("--") // no hires yet → no "Send Rejections"
    const jobId = Number((await r.getByRole("link", { name: "Applicants" }).getAttribute("href"))!.match(/jobs\/(\d+)/)![1])
    writeState({ jobTitle: title, jobSlug: slug, jobId })
  })

  test("closed job, edit job (fields persisted)", async () => {
    const closed = `E2E Closed Role ${run()}`
    await page.getByRole("button", { name: "Create job" }).click()
    const d = page.getByRole("dialog", { name: "Create job" })
    await d.getByLabel("Title").fill(closed)
    await d.getByLabel("Slug").fill(`e2e-closed-${run()}`)
    await d.getByLabel("Department").fill("Ops")
    await d.getByLabel("Employment type").selectOption("CONTRACT")
    await d.getByLabel("Location").fill("Addis Ababa")
    await d.getByLabel("Status").selectOption("CLOSED")
    await d.getByRole("button", { name: "Create job" }).click()
    await expect(d.getByLabel("Description")).toHaveJSProperty("validity.valueMissing", true)
    await d.getByLabel("Description").fill("Filled.")
    await d.getByRole("button", { name: "Create job" }).click()
    await expect(row(page, closed)).toContainText("Closed")
    writeState({ closedJobSlug: `e2e-closed-${run()}` })

    await page.getByRole("button", { name: `Edit ${need("jobTitle")}` }).click()
    const e = page.getByRole("dialog", { name: "Edit job" })
    await expect(e.getByLabel("Experience level")).toHaveValue("Senior")
    await expect(e.getByLabel("Field title")).toHaveCount(3)
    await expect(e.getByLabel("Field title").nth(1)).toHaveValue("Why us?")
    await e.getByLabel(/Salary range/).fill("ETB 70,000 – 90,000 / month")
    await e.getByRole("button", { name: "Save changes" }).click()
    await expect(e).toBeHidden()
  })

  test("public jobs: list shows only open roles, detail shows facts; closed role can't be applied to", async () => {
    const slug = need("orgSlug")
    const pub = await page.context().newPage()
    const link = pub.getByRole("link", { name: new RegExp(need("jobTitle")) })
    await eventually(pub, `/o/${slug}/jobs`, () => expect(link).toBeVisible({ timeout: 2_000 }))
    await expect(pub.getByRole("heading", { name: "Open positions" })).toBeVisible()
    await expect(pub.getByText(`E2E Closed Role ${run()}`)).toHaveCount(0)
    await link.click()
    await expect(pub.getByRole("heading", { name: need("jobTitle"), level: 1 })).toBeVisible()
    await expect(pub.getByText("Senior")).toBeVisible()
    await expect(pub.getByText("ETB 70,000 – 90,000 / month")).toBeVisible()
    await expect(pub.getByText(/Apply by/)).toBeVisible()
    await expect(pub.getByRole("button", { name: "Apply" })).toBeVisible()
    await pub.getByRole("link", { name: "View all open roles" }).click()
    await expect(pub).toHaveURL(new RegExp(`/o/${slug}/jobs$`))

    await pub.goto(`/o/${slug}/jobs/${need("closedJobSlug")}`)
    await expect(pub.getByText("This role is no longer accepting applications.")).toBeVisible()
    await expect(pub.getByRole("button", { name: "Apply" })).toHaveCount(0)
    await pub.close()
  })

  test("org profile shows jobs, blogs and events sections with in-page nav", async () => {
    const slug = need("orgSlug")
    const pub = await page.context().newPage()
    await eventually(pub, `/o/${slug}`, () => expect(pub.locator("#events")).toContainText(need("eventTitle"), { timeout: 2_000 }))
    await expect(pub.getByRole("link", { name: /1 open role/ })).toHaveAttribute("href", "#jobs")
    for (const [id, h] of [["jobs", "Open positions"], ["blog", "Blogs"], ["events", "Events"]]) {
      await expect(pub.locator(`#${id}`).getByRole("heading", { name: h })).toBeVisible()
    }
    await expect(pub.locator("#jobs")).toContainText(need("jobTitle"))
    await expect(pub.locator("#blog")).toContainText(need("blogTitle"))
    await expect(pub.locator("#events")).toContainText(need("eventTitle"))
    await pub.locator('nav a[href="#events"]').click()
    await expect(pub).toHaveURL(/#events$/)
    const jobLink = pub.locator("#jobs").getByRole("link", { name: new RegExp(need("jobTitle")) })
    await expect(jobLink).toHaveAttribute("href", `/o/${slug}/jobs/${need("jobSlug")}`)
    await jobLink.click()
    await expect(pub).toHaveURL(new RegExp(`/o/${slug}/jobs/${need("jobSlug")}$`))
    await pub.close()
  })

  test("dashboard counts reflect the new content", async () => {
    await page.goto("/manager")
    const openJobs = page.getByRole("link").filter({ hasText: "total postings" })
    await expect(openJobs).toContainText("1")
    await expect(openJobs).toContainText("2 total postings")
  })
})
