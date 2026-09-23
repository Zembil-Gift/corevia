interface MultipartOptions {
  fields?: Record<string, string>
  fileFieldName?: string
  file?: File
  /** Extra file parts, e.g. one per application-form upload field. */
  files?: { fieldName: string; file: File }[]
}

function encodeChunk(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

function escapeHeaderValue(value: string): string {
  return value.replace(/"/g, '\\"')
}

export async function buildMultipartBody({
  fields = {},
  fileFieldName = "file",
  file,
  files = [],
}: MultipartOptions): Promise<{ contentType: string; body: Uint8Array }> {
  const boundary = `----afrodebab-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const chunks: Uint8Array[] = []

  for (const [key, rawValue] of Object.entries(fields)) {
    chunks.push(
      encodeChunk(`--${boundary}\r\n`),
      encodeChunk(`Content-Disposition: form-data; name="${escapeHeaderValue(key)}"\r\n\r\n`),
      encodeChunk(`${rawValue}\r\n`)
    )
  }

  const parts = file ? [{ fieldName: fileFieldName, file }, ...files] : files
  for (const { fieldName, file: part } of parts) {
    chunks.push(
      encodeChunk(`--${boundary}\r\n`),
      encodeChunk(
        `Content-Disposition: form-data; name="${escapeHeaderValue(fieldName)}"; filename="${escapeHeaderValue(part.name || "upload.bin")}"\r\n`
      ),
      encodeChunk(`Content-Type: ${part.type || "application/octet-stream"}\r\n\r\n`),
      new Uint8Array(await part.arrayBuffer()),
      encodeChunk("\r\n")
    )
  }

  chunks.push(encodeChunk(`--${boundary}--\r\n`))

  const totalLength = chunks.reduce((sum, part) => sum + part.length, 0)
  const body = new Uint8Array(totalLength)
  let offset = 0
  for (const part of chunks) {
    body.set(part, offset)
    offset += part.length
  }

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body,
  }
}
