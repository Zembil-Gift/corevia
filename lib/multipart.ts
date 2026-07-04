interface MultipartOptions {
  fields?: Record<string, string>
  fileFieldName?: string
  file?: File
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

  if (file) {
    chunks.push(
      encodeChunk(`--${boundary}\r\n`),
      encodeChunk(
        `Content-Disposition: form-data; name="${escapeHeaderValue(fileFieldName)}"; filename="${escapeHeaderValue(file.name || "upload.bin")}"\r\n`
      ),
      encodeChunk(`Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`),
      new Uint8Array(await file.arrayBuffer()),
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
