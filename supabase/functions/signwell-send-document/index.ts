import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// The kinds of field an agent can drop. Mirrors FieldType in src/types/index.ts.
type FieldType = 'signature' | 'date' | 'checkbox'

// A field the agent placed on the PDF. Ratios are 0–1 from the page top-left;
// signerIndex is 0-based and points at the signer the field belongs to.
interface PlacedField {
  signerIndex: number
  type: FieldType
  page: number
  xRatio: number
  yRatio: number
}

interface Signer {
  name: string
  email: string
  phone?: string | null
}

// One physical page of the uploaded PDF. `page` is 1-based (SignWell numbers pages from 1).
// width/height are in PDF points (1/72"); a US-Letter page is ~612 x 792.
interface PageDims {
  page: number
  width: number
  height: number
}

// A SignWell field. Coordinates are 96-DPI pixels from the page's TOP-LEFT corner.
interface SignWellField {
  recipient_id: string
  api_id: string
  type: FieldType
  page: number
  x: number
  y: number
  w?: number
  h?: number
  required?: boolean
  value?: boolean | string
  lock_sign_date?: boolean
  date_format?: string
}

// SignWell interprets field x/y as 96-DPI pixels, but pdf-lib reports page geometry in
// 72-DPI points. Without converting, every coordinate renders at 72/96 = 0.75x of its
// intended physical position. Multiply point-space dimensions by this to get SignWell px.
const PT_TO_SW = 96 / 72

// Default box size (SignWell px) per field type. The agent's click anchors the box's
// top-left; these sizes are what the placer previews on screen.
const FIELD_SIZE: Record<FieldType, { w: number; h: number }> = {
  signature: { w: 140, h: 36 },
  date: { w: 110, h: 28 },
  checkbox: { w: 18, h: 18 },
}

// Reads page geometry from the uploaded PDF so we know the real page count and each
// page's dimensions (needed to convert click ratios into absolute SignWell pixels).
async function readPageDims(fileBase64: string): Promise<PageDims[]> {
  const bytes = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0))
  const pdf = await PDFDocument.load(bytes)
  return pdf.getPages().map((p: { getSize: () => { width: number; height: number } }, i: number) => {
    const { width, height } = p.getSize()
    return { page: i + 1, width, height }
  })
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), Math.max(min, max))
}

// Converts a placed field's 0–1 click into an absolute SignWell-px box that fits on the page.
function fieldBox(field: PlacedField, page: PageDims): { page: number; x: number; y: number; w: number; h: number } {
  const size = FIELD_SIZE[field.type]
  const pw = page.width * PT_TO_SW
  const ph = page.height * PT_TO_SW
  const x = clamp(field.xRatio * pw, 0, Math.max(0, pw - size.w))
  const y = clamp(field.yRatio * ph, 0, Math.max(0, ph - size.h))
  return { page: page.page, x, y, w: size.w, h: size.h }
}

// Returns the SignWell type + type-specific flags for a placed field. The geometry
// (page/x/y/w/h/recipient) is handled by fieldBox()/assembleFields(); this decides
// ONLY the behaviour of each field type:
//   • signature → a required signature box.
//   • date      → a MANUALLY-fillable date the client types. SignWell auto-stamps the
//                 signing date when lock_sign_date is true, so we set it false and give
//                 a date_format the client fills in themselves.
//   • checkbox  → a box the client selects, starting unchecked. required:true forces a
//                 checkmark (acknowledgement); flip to false for an optional selection.
function typeProps(type: FieldType): Partial<SignWellField> {
  switch (type) {
    case 'signature':
      return { type: 'signature', required: true }
    case 'date':
      return { type: 'date', required: true, lock_sign_date: false, date_format: 'MM/DD/YYYY' }
    case 'checkbox':
      return { type: 'checkbox', required: true, value: false }
  }
}

// SignWell px offset between a placed signature and its auto-stamped date companion.
// Negative pulls the date UP into the signature box (overlapping the lower portion of
// the stroke) instead of leaving a gap below it, so the date reads as sitting right on
// the signature line rather than floating underneath.
const SIGNATURE_DATE_GAP = -10

// Turns every placed field into SignWell's 2-D fields array (one sub-array per file;
// we always send a single file, so one inner array). Every signature also gets a
// companion date field directly below it that the client never touches -- SignWell
// fills it with the actual signing timestamp (lock_sign_date: true), unlike the
// agent-placed 'date' field type which stays manually-fillable (see typeProps()).
function assembleFields(fields: PlacedField[], pages: PageDims[]): SignWellField[][] {
  const file0: SignWellField[] = []
  fields.forEach((f, i) => {
    const page = pages.find(p => p.page === f.page) ?? pages[0]
    const box = fieldBox(f, page)
    file0.push({
      recipient_id: String(f.signerIndex + 1), // SignWell recipient ids are 1-based strings
      api_id: `field_${i}`,
      ...box,
      ...typeProps(f.type),
    })

    if (f.type === 'signature') {
      const pw = page.width * PT_TO_SW
      const ph = page.height * PT_TO_SW
      const dateSize = FIELD_SIZE.date
      file0.push({
        recipient_id: String(f.signerIndex + 1),
        api_id: `field_${i}_signdate`,
        page: box.page,
        // Center under the signature box's midpoint rather than sharing its left edge --
        // the date box (110px) is narrower than the signature box (140px), so reusing
        // box.x would leave it hugging the left side instead of centered underneath.
        x: clamp(box.x + (box.w - dateSize.w) / 2, 0, Math.max(0, pw - dateSize.w)),
        y: clamp(box.y + box.h + SIGNATURE_DATE_GAP, 0, Math.max(0, ph - dateSize.h)),
        w: dateSize.w,
        h: dateSize.h,
        type: 'date',
        required: true,
        lock_sign_date: true,
        date_format: 'MM/DD/YYYY',
      })
    }
  })
  return [file0]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) return json({ error: 'Unauthorized' }, 401)

  let body: {
    title?: string
    property?: string
    signers?: Signer[]
    file_base64?: string
    file_name?: string
    agent_id?: string
    fields?: PlacedField[]
    subject?: string
    message?: string
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { title, property, file_base64, file_name, agent_id } = body
  const signers = (body.signers ?? []).filter(s => s?.name?.trim() && s?.email?.trim())
  const fields = body.fields ?? []

  if (!title || !file_base64 || !file_name) {
    return json({ error: 'title, file_base64, and file_name are required' }, 400)
  }
  if (signers.length === 0) {
    return json({ error: 'At least one signer (name + email) is required' }, 400)
  }

  // SignWell rejects any recipient that has no field assigned. Guard here so a
  // misconfigured request fails with a clear message instead of a raw API error.
  const signersWithoutField = signers
    .map((_, i) => i)
    .filter(i => !fields.some(f => f.signerIndex === i))
  if (signersWithoutField.length > 0) {
    const names = signersWithoutField.map(i => signers[i].name).join(', ')
    return json({ error: `Every signer needs at least one field. Missing for: ${names}` }, 400)
  }

  const signwellApiKey = Deno.env.get('SIGNWELL_API_KEY')
  if (!signwellApiKey) return json({ error: 'SignWell not configured' }, 500)

  // Place fields explicitly (instead of appending a separate signature page) so the
  // agent's chosen positions and field types are honoured.
  let signwellFields: SignWellField[][]
  let pages: PageDims[]
  try {
    pages = await readPageDims(file_base64)
    signwellFields = assembleFields(fields, pages)
  } catch (e) {
    console.error('Field placement error:', e)
    return json({ error: `Could not place fields: ${e instanceof Error ? e.message : 'invalid PDF'}` }, 400)
  }

  // Custom email to the clients: agent-supplied subject/message override the defaults.
  const emailSubject = body.subject?.trim() || (property ? `${title} — ${property}` : title)
  const emailMessage = body.message?.trim()
    || 'Please review and sign this document at your earliest convenience.'

  // The "[Name] says" line in SignWell's email defaults to the API key's account user
  // (e.g. "Gwen Dagatan"). Override it with the company identity so every document reads
  // as coming from the brand, not the individual whose key signed the request.
  const requesterName = Deno.env.get('SIGNWELL_REQUESTER_NAME')?.trim() || undefined
  const requesterEmail = Deno.env.get('SIGNWELL_REQUESTER_EMAIL')?.trim() || undefined

  const signwellPayload = {
    name: title,
    subject: emailSubject,
    message: emailMessage,
    ...(requesterName ? { custom_requester_name: requesterName } : {}),
    ...(requesterEmail ? { custom_requester_email: requesterEmail } : {}),
    draft: false,
    // false = all recipients can sign in parallel (simultaneously) rather than in turn.
    apply_signing_order: false,
    files: [{ name: file_name, file_base64 }],
    fields: signwellFields,
    recipients: signers.map((s, i) => ({
      id: String(i + 1),
      name: s.name,
      email: s.email,
    })),
    expires_in: 30,
  }

  console.log('Sending to SignWell:', JSON.stringify({ ...signwellPayload, files: '[redacted]' }))

  const signwellRes = await fetch('https://www.signwell.com/api/v1/documents', {
    method: 'POST',
    headers: {
      'X-Api-Key': signwellApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(signwellPayload),
  })

  if (!signwellRes.ok) {
    const errText = await signwellRes.text()
    console.error('SignWell API error', signwellRes.status, errText)
    return json({ error: `SignWell API error (${signwellRes.status}): ${errText}` }, 502)
  }

  const swDoc = await signwellRes.json() as {
    id: string
    status?: string
    signing_links?: { id?: string; name?: string; url?: string; signing_url?: string }[]
    fields?: unknown
  }

  console.log('SignWell response:', JSON.stringify(swDoc))

  // With multiple recipients SignWell returns a signing link per signer. We surface the
  // first (the primary signer) for the agent's quick-preview, matching the single-signer UI.
  const primary = signers[0]
  const signingUrl = swDoc.signing_links?.[0]?.url
    ?? swDoc.signing_links?.[0]?.signing_url
    ?? null

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { data: doc, error: insertError } = await supabase
    .from('documents')
    .insert({
      title,
      property: property || null,
      // Index 0 mirrors the legacy client_* columns so existing reads keep working.
      client_name: primary.name,
      client_email: primary.email,
      client_phone: primary.phone || null,
      recipients: signers.map(s => ({ name: s.name, email: s.email, phone: s.phone || null })),
      agent_id: agent_id || null,
      signwell_id: swDoc.id,
      status: 'sent',
      signing_url: signingUrl,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (insertError) {
    console.error('DB insert error:', insertError)
    return json({ error: insertError.message }, 500)
  }

  return json(doc)
})
