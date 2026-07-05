/** Quotes a CSV cell when it contains a comma, quote, or newline (RFC 4180). */
function escapeCell(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Turns a header row + data rows into a CSV string and triggers a browser
 * download. Pure client-side — no server round-trip.
 */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]): void {
  const lines = [header, ...rows].map((row) => row.map(escapeCell).join(','))
  const csv = lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
