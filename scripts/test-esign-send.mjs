// Calibration harness for custom signature placement.
//
// With no PDF_PATH it sends TWO generated PDFs — a standard Letter page and a
// large page — each with a visible target box drawn at the SAME click ratio.
// Comparing where SignWell renders the signature on each reveals whether the
// error scales with page size (the unit/scale hypothesis).
//
// Run:
//   TEST_EMAIL=you@example.com TEST_PASSWORD=secret TEST_RECIPIENT=you@example.com \
//     node --env-file=.env scripts/test-esign-send.mjs
//
// (--env-file=.env supplies VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.)
// Optional: PDF_PATH=/abs/file.pdf CLICK_X=0.5 CLICK_Y=0.5 to probe your own PDF.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
const email = process.env.TEST_EMAIL
const password = process.env.TEST_PASSWORD
const recipient = process.env.TEST_RECIPIENT || email
const pdfPath = process.env.PDF_PATH
const clickX = process.env.CLICK_X ? Number(process.env.CLICK_X) : 0.5
const clickY = process.env.CLICK_Y ? Number(process.env.CLICK_Y) : 0.5

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY. Run with: node --env-file=.env scripts/test-esign-send.mjs')
  process.exit(1)
}
if (!email || !password) {
  console.error('Missing TEST_EMAIL / TEST_PASSWORD env vars.')
  process.exit(1)
}

// We aim every send at this ratio (0–1 from top-left) and draw the target there.
const AIM_X = 0.30
const AIM_Y = 0.80

// Draws a page of the given point size with a visible target box + crosshair at
// the AIM ratio, so we can see exactly where we aimed vs where SignWell places it.
async function buildPdfBase64(pageW, pageH, label) {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([pageW, pageH])
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  // pdf-lib draws from bottom-left; AIM_Y is from the top, so flip it.
  const tx = AIM_X * pageW
  const ty = (1 - AIM_Y) * pageH

  page.drawText(`${label} (${pageW}x${pageH})`, { x: 36, y: pageH - 48, size: 16, font })
  page.drawText('AIM HERE >', { x: tx - 90, y: ty - 4, size: 12, font, color: rgb(0.8, 0, 0) })
  page.drawCircle({ x: tx, y: ty, size: 4, color: rgb(0.8, 0, 0) })
  page.drawRectangle({ x: tx, y: ty - 30, width: 120, height: 30, borderColor: rgb(0.8, 0, 0), borderWidth: 1 })

  const bytes = await pdf.save()
  return Buffer.from(bytes).toString('base64')
}

async function send(supabase, { fileBase64, fileName, xRatio, yRatio, note }) {
  console.log(`\n→ ${note}  (aim x=${xRatio.toFixed(3)}, y=${yRatio.toFixed(3)})`)
  const { data, error } = await supabase.functions.invoke('signwell-send-document', {
    body: {
      title: `Calibration ${note} ${new Date().toISOString()}`,
      client_name: 'Calibration Tester',
      client_email: recipient,
      file_base64: fileBase64,
      file_name: fileName,
      signature_placement: { mode: 'custom', page: 1, xRatio, yRatio },
    },
  })
  if (error) {
    const body = await error.context?.json?.().catch(() => null)
    console.error('   ✗ Send failed:', body?.error ?? error.message)
    return
  }
  console.log('   ✅ signing_url:', data.signing_url)
  console.log('   _debug:', JSON.stringify(data._debug))
}

async function main() {
  const supabase = createClient(url, anonKey)
  console.log(`Signing in as ${email}…`)
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signInErr) { console.error('Sign-in failed:', signInErr.message); process.exit(1) }

  if (pdfPath) {
    const fileBase64 = readFileSync(pdfPath).toString('base64')
    await send(supabase, { fileBase64, fileName: pdfPath.split('/').pop(), xRatio: clickX, yRatio: clickY, note: 'your PDF' })
  } else {
    await send(supabase, { fileBase64: await buildPdfBase64(612, 792, 'STANDARD'),  fileName: 'cal-standard.pdf', xRatio: AIM_X, yRatio: AIM_Y, note: 'STANDARD 612x792' })
    await send(supabase, { fileBase64: await buildPdfBase64(1224, 1584, 'LARGE'),    fileName: 'cal-large.pdf',    xRatio: AIM_X, yRatio: AIM_Y, note: 'LARGE 1224x1584' })
  }

  console.log('\nOpen each signing_url. For each, does the signature box land on the red "AIM HERE" box?')
  console.log('Paste both _debug lines back, plus where each box landed.')
}

main()
