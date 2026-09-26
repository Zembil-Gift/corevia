import { getTokenRole } from "@/lib/auth"

/**
 * Vice managers share the /manager UI but may only act on their own branch through the API's
 * /vice-manager/** routes. Each call the manager pages make is mapped to its branch-scoped
 * twin; anything unmapped (org-level pages, other writes) still goes to /manager and gets a 403.
 * Entries: [methods, path pattern, replacement].
 */
const ANY = ["GET", "POST", "PUT", "PATCH", "DELETE"]
const VICE_MANAGER_ROUTES: [string[], RegExp, string][] = [
  [["GET"], /^\/manager\/me(?=$|\?)/, "/vice-manager/me"],
  [["GET"], /^\/manager\/sub-organizations(?=$|\?)/, "/vice-manager/sub-organizations"],
  [["GET"], /^\/manager\/employees\/(connected-accounts)(?=$|\?)/, "/vice-manager/employees/$1"],
  [["GET"], /^\/manager\/employees(?=$|\?)/, "/vice-manager/employees"],
  [["GET"], /^\/manager\/employees\/(\d+)(\/attendance)?(?=$|\?)/, "/vice-manager/employees/$1$2"],
  [["GET"], /^\/manager\/metrics\/employees(?=$|\?|\/\d+(?:$|\?|\/time-spent\/))/, "/vice-manager/metrics/employees"],
  [["POST"], /^\/manager\/metrics\/employees\/(\d+)\/snapshot(?=$|\?)/, "/vice-manager/metrics/employees/$1/snapshot"],
  [["GET"], /^\/manager\/metrics\/peer-reviews(?=$|\?|\/summary(?:$|\?))/, "/vice-manager/metrics/peer-reviews"],
  [["GET"], /^\/manager\/metrics\/peer-reviews\/periods(?=$|\?|\/\d+\/(?:results|comments\/\d+)(?:$|\?))/,
    "/vice-manager/metrics/peer-reviews/periods"],
  [["GET"], /^\/manager\/(github|trello)\/report\//, "/vice-manager/trackers/$1/report/"],
  [["POST"], /^\/manager\/(github|trello)\/sync(?=$|\?)/, "/vice-manager/trackers/$1/sync"],
  [ANY, /^\/manager\/(github|trello|google)\/connection(?=$|\?|\/)/, "/vice-manager/$1/connection"],
  [["GET"], /^\/manager\/payments\/(due|paid|paid\/filter)(?=$|\?)/, "/vice-manager/payments/$1"],
  [["POST"], /^\/manager\/payments\/(\d+)\/mark-paid(?=$|\?)/, "/vice-manager/payments/$1/mark-paid"],
  [["GET", "POST"], /^\/manager\/(broadcasts|notifications)(?=$|\?|\/)/, "/vice-manager/$1"],
  [ANY, /^\/manager\/google\/sheets(?=$|\?|\/)/, "/vice-manager/google/sheets"],
]

export function viceManagerPath(path: string, method = "GET"): string {
  const verb = method.toUpperCase()
  for (const [methods, pattern, replacement] of VICE_MANAGER_ROUTES) {
    if (methods.includes(verb) && pattern.test(path)) return path.replace(pattern, replacement)
  }
  return path
}

/** fetch() for CMS API calls made with the caller's own token. */
export function cmsFetch(token: string, url: string, init?: RequestInit): Promise<Response> {
  if (getTokenRole(token) !== "VICE_MANAGER") return fetch(url, init)
  const target = new URL(url)
  const rewritten = viceManagerPath(target.pathname + target.search, init?.method ?? "GET")
  return fetch(target.origin + rewritten, init)
}
