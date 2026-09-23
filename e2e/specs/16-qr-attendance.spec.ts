import { execFileSync } from "node:child_process"
import { chromium, expect, test, type Browser, type Page } from "@playwright/test"
import { FILES, OFFICE, PASSWORD, file, login, need, session } from "../support"

// Real QR scanning: the employee's own attendance QR is screenshotted, turned into a looping
// fake webcam feed (ffmpeg → .y4m) and fed to a Chromium launched with a fake camera.
test.describe.configure({ mode: "serial" })

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000"
let camera: Browser

test.beforeAll(async ({ browser }) => {
  const emp = await session(browser, need("emp1").email, PASSWORD, /\/employee\/reports$/)
  await emp.locator("button:has(svg.lucide-qr-code)").click()
  const qr = emp.locator("div.fixed svg").last()
  await expect(qr).toBeVisible()
  await qr.screenshot({ path: file("qr.png"), animations: "disabled" })
  await emp.context().close()
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-loop", "1", "-i", file("qr.png"),
    "-vf", "scale=360:360,pad=640:480:(ow-iw)/2:(oh-ih)/2:white,format=yuv420p",
    "-t", "3", "-r", "10", file("qr.y4m"),
  ])
  camera = await chromium.launch({
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-video-capture=${file("qr.y4m")}`,
    ],
  })
  void FILES
})
test.afterAll(() => camera?.close())

async function cameraPage(withLocation: boolean) {
  const context = await camera.newContext({
    baseURL: BASE,
    viewport: { width: 1440, height: 900 },
    permissions: withLocation ? ["geolocation", "camera"] : ["camera"],
    geolocation: withLocation ? OFFICE : undefined,
  })
  return context.newPage()
}

async function scan(page: Page, action: string, scope = page.locator("body")) {
  await scope.getByRole("button", { name: action, exact: true }).click()
  const scanner = page.locator("div.fixed", { has: page.getByRole("heading", { name: "Scan QR Code" }) }).last()
  await scanner.getByRole("button", { name: "Start Scanning" }).click()
  await expect(scanner).toHaveCount(0, { timeout: 30_000 }) // closes once a code is decoded
}

test("employee portal: Clock In by scanning the QR code", async () => {
  const page = await cameraPage(true)
  await login(page, need("emp1").email, PASSWORD, /\/employee\/reports$/)
  await page.getByRole("button", { name: "Attendance", exact: true }).click()
  const panel = page.locator("div.fixed", { has: page.getByRole("heading", { name: "Attendance", level: 3 }) }).last()
  await scan(page, "Clock In", panel)
  await expect(panel.getByText("Clock in recorded successfully!")).toBeVisible({ timeout: 30_000 })
  await page.context().close()
})

test("kiosk page: lunch in, lunch out, clock out; a second clock-in is refused", async () => {
  const page = await cameraPage(true)
  await page.goto("/attendance")
  await expect(page.getByRole("heading", { name: "Attendance", level: 1 })).toBeVisible()
  for (const [action, message] of [
    ["Lunch Break In", "Lunch break start recorded successfully!"],
    ["Lunch Break Out", "Lunch break end recorded successfully!"],
    ["Clock Out", "Clock out recorded successfully!"],
  ]) {
    await scan(page, action)
    await expect(page.getByText(message)).toBeVisible({ timeout: 30_000 })
  }
  await scan(page, "Clock In")
  const msg = page.locator("section p").first()
  await expect(msg).toBeVisible({ timeout: 30_000 })
  await expect(msg).not.toHaveText("Clock in recorded successfully!")
  await page.context().close()
})

test("kiosk without location permission explains why it can't record", async () => {
  const page = await cameraPage(false)
  await page.goto("/attendance")
  await scan(page, "Clock Out")
  await expect(page.getByText("Location access is required to record attendance.")).toBeVisible({ timeout: 30_000 })
  await page.context().close()
})

test("manager sees today's scanned attendance", async ({ browser }) => {
  const emp1 = need("emp1")
  const page = await session(browser, need("managerEmail"), PASSWORD, /\/manager$/)
  await expect(page.getByText("Clocked out today")).toBeVisible()
  await page.goto("/manager/employees")
  await page.getByRole("button", { name: `View attendance for ${emp1.name}` }).click()
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  const record = page.locator("div", { hasText: today }).filter({ hasText: "In:" }).last()
  await expect(record).toBeVisible()
  await expect(record).not.toContainText("Out: -")
  await page.context().close()
})
