import { removePlatformAdmin } from "./support"

// ponytail: only the known-password platform admin is removed; the uniquely named E2E
// org and its data stay behind for inspection (they never collide with the next run).
export default async function globalTeardown() {
  removePlatformAdmin()
}
