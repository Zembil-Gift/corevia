import http from "node:http"
import https from "node:https"

interface RawPostOptions {
  url: string
  headers: Record<string, string>
  body: Uint8Array
}

export async function postRaw({
  url,
  headers,
  body,
}: RawPostOptions): Promise<{ status: number; bodyText: string; headers: http.IncomingHttpHeaders }> {
  const target = new URL(url)
  const client = target.protocol === "https:" ? https : http
  const payload = Buffer.from(body)

  let contentTypeHeader = headers["Content-Type"] ?? headers["content-type"] ?? ""
  if (contentTypeHeader.startsWith("multipart/form-data")) {
    contentTypeHeader = contentTypeHeader.replace(/;\s*charset=[^;]*/i, "").trim()
  }
  const sanitizedContentType = contentTypeHeader

  return new Promise((resolve, reject) => {
    const req = client.request(
      {
        method: "POST",
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (target.protocol === "https:" ? 443 : 80),
path: `${target.pathname}${target.search}`,
        headers: (() => {
          const { "content-type": _ct1, "Content-Type": _ct2, ...restHeaders } = headers
          const baseHeaders = sanitizedContentType
            ? { ...restHeaders, "Content-Type": sanitizedContentType }
            : restHeaders
          return { ...baseHeaders, "Content-Length": String(payload.length) }
        })(),
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 500,
            bodyText: Buffer.concat(chunks).toString("utf8"),
            headers: res.headers,
          })
        })
      }
    )

    req.on("error", reject)
    req.write(payload)
    req.end()
  })
}
