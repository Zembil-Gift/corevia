/** Format event date range for display (e.g. detail page). */
export function formatEventDate(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const sameDay =
    startDate.toDateString() === endDate.toDateString()
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  }
  if (sameDay) {
    return `${startDate.toLocaleDateString("en-US", options)} · ${startDate.toLocaleTimeString("en-US", timeOptions)} – ${endDate.toLocaleTimeString("en-US", timeOptions)}`
  }
  return `${startDate.toLocaleDateString("en-US", options)} – ${endDate.toLocaleDateString("en-US", options)}`
}

/** Format single event date for display (e.g. list cards). */
export function formatEventDateShort(start: string): string {
  return new Date(start).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
