import fs from "node:fs"
import path from "node:path"
import { API_URL, FILES, STATE_FILE, initState, seedPlatformAdmin, sql } from "./support"

// 64×64 gradient PNG used for every image upload (logo, cover, photos).
const PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABAEAIAAAB1mzrKAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRP///////wlY99wAAAAHdElNRQfqCRYXGSC6bsRTAAAA70lEQVR42u3bURGDMBQAQXgTIa2A6sAD/g2Agn4gYj+4VcBM5l1IaPff7zyPYwuy5p7Zvvox3mvNNbN99GO8VxOArb0FoEoQtuae2ZsA5tkDmgDmSVATwPQWhJUgrAnA2gOwEoR1DsBKEFaCsN6CsC7jsCYAawGwEoStvXMAVYKwEoQ1AVgLgJUgrAnAuozD1lydA6QShJUgrAnA+iSJlSCsBGGdhLF+F4T1FyWsBGFtwlgLgJUgrAnAeg3FShBWgrAu47Cuo7EShJUgrARhnQOwEoS1CWPtAdjzRawEMSUI6zIOawKwzgFYCcJKEPYHp5hHmuxZ10YAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjYtMDktMjJUMjM6MjU6MzIrMDA6MDAIQ9gnAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDI2LTA5LTIyVDIzOjI1OjMyKzAwOjAweR5gmwAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyNi0wOS0yMlQyMzoyNTozMiswMDowMC4LQUQAAAAASUVORK5CYII="

// Smallest valid one-page PDF with a line of text (resume / answer attachments).
const PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 88>>stream
BT /F1 14 Tf 72 720 Td (E2E Candidate - 5 years TypeScript, React, Java, Spring Boot) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF
`

export default async function globalSetup() {
  // Fail early with an actionable message instead of 40 confusing timeouts.
  const api = await fetch(`${API_URL}/v3/api-docs`).catch(() => null)
  if (!api?.ok) throw new Error(`API not reachable at ${API_URL} (set E2E_API_URL)`)
  const web = process.env.E2E_BASE_URL ?? "http://localhost:3000"
  const app = await fetch(`${web}/login`).catch(() => null)
  if (!app?.ok) throw new Error(`Next app not reachable at ${web} — start it with \`pnpm dev\` in frontend/ (or set E2E_BASE_URL)`)
  sql("SELECT 1")

  fs.mkdirSync(FILES, { recursive: true })
  fs.writeFileSync(path.join(FILES, "image.png"), Buffer.from(PNG, "base64"))
  fs.writeFileSync(path.join(FILES, "resume.pdf"), PDF)
  fs.writeFileSync(path.join(FILES, "notes.txt"), "not an image")

  seedPlatformAdmin()
  // A new run (fresh org/users) starts in the signup spec; keeping the file lets a single
  // later spec be re-run against the org the last full run created.
  if (!fs.existsSync(STATE_FILE)) initState({ run: Date.now().toString(36) })
}
