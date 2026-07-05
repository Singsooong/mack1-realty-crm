import { createClient } from 'jsr:@supabase/supabase-js@2'

// SignWell sends its HMAC-SHA256 signature in this header.
// Confirm the exact header name in your SignWell dashboard under
// Webhook settings → "Signing secret" — update this constant if different.
const SIGNWELL_SIGNATURE_HEADER = 'x-signwell-signature'

// Events we act on
const EVENT_DOCUMENT_COMPLETED = 'document_completed'

Deno.serve(async (req) => {
  // Always return 200 quickly — SignWell retries on non-2xx.
  // We do all work synchronously here; if something non-critical fails
  // we still return 200 to avoid replay storms.

  try {
    // ── Read raw body first (HMAC needs exact bytes) ──────────
    const rawBody = await req.text()

    // ── Signature verification ────────────────────────────────
    // Strategy: if SIGNWELL_WEBHOOK_SECRET is set, verify HMAC.
    // If not set, fall back to a shared token check via ?secret= query param.
    // If neither is configured, log a warning and allow through (dev only).
    const webhookSecret = Deno.env.get('SIGNWELL_WEBHOOK_SECRET')
    const url = new URL(req.url)

    if (webhookSecret) {
      const incomingSignature = req.headers.get(SIGNWELL_SIGNATURE_HEADER)
      if (incomingSignature) {
        const valid = await verifyHmac(rawBody, webhookSecret, incomingSignature)
        if (!valid) {
          console.warn('[signwell-webhook] HMAC mismatch — rejecting')
          return new Response('Unauthorized', { status: 401 })
        }
      } else {
        // SignWell doesn't send a signature header — use ?secret= token check
        const tokenParam = url.searchParams.get('secret')
        if (tokenParam !== webhookSecret) {
          console.warn('[signwell-webhook] Missing or invalid secret param — rejecting')
          return new Response('Unauthorized', { status: 401 })
        }
      }
    } else {
      console.warn('[signwell-webhook] No secret configured — skipping verification (set SIGNWELL_WEBHOOK_SECRET for production)')
    }

    // ── Parse event ───────────────────────────────────────────
    const event = JSON.parse(rawBody) as SignWellEvent
    const eventType: string = event.event?.type ?? event.event_type ?? ''
    const swDocId: string | undefined = event.data?.object?.id ?? event.data?.document?.id
    const eventTime: number = event.event?.time ?? Date.now()
    const eventId: string = `${eventType}-${swDocId}-${eventTime}`

    console.log('[signwell-webhook] received event:', JSON.stringify({ eventType, swDocId, eventId }))

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── Idempotency: insert-or-ignore on event ID ─────────────
    const { error: insertErr } = await serviceClient
      .from('webhook_events')
      .insert({
        signwell_event_id: eventId,
        event_type: eventType,
        payload: event as unknown as Record<string, unknown>,
      })

    if (insertErr) {
      if (insertErr.code === '23505') {
        // Unique constraint violation — already processed
        console.log(`[esign-webhook] Duplicate event ${eventId} — skipping`)
        return ok()
      }
      throw insertErr
    }

    // ── Handle document_completed ─────────────────────────────
    if (eventType === EVENT_DOCUMENT_COMPLETED && swDocId) {
      await handleDocumentCompleted(serviceClient, swDocId, event)
    }

    return ok()
  } catch (err) {
    console.error('[esign-webhook] Unhandled error:', err)
    // Still return 200 — don't cause unnecessary retries for transient failures
    return ok()
  }
})

// ── Event handler ─────────────────────────────────────────────

async function handleDocumentCompleted(
  client: ReturnType<typeof createClient>,
  swDocId: string,
  _event: SignWellEvent,
) {
  // Look up our row by SignWell document ID
  const { data: doc, error: findErr } = await client
    .from('documents')
    .select('id, agent_id, title, client_name')
    .eq('signwell_id', swDocId)
    .single()

  if (findErr || !doc) {
    console.warn(`[signwell-webhook] No row found for signwell_id=${swDocId}`, findErr)
    return
  }

  console.log(`[signwell-webhook] Found document ${doc.id} — marking completed`)

  // Fetch the completed PDF download URL from SignWell
  const apiKey = Deno.env.get('SIGNWELL_API_KEY')
  let pdfUrl: string | null = null

  if (apiKey) {
    const pdfRes = await fetch(
      `https://www.signwell.com/api/v1/documents/${swDocId}/completed_pdf?url_only=true`,
      { headers: { 'X-Api-Key': apiKey } },
    )
    if (pdfRes.ok) {
      const body = await pdfRes.json() as { file_url?: string }
      pdfUrl = body.file_url ?? null
    } else {
      console.warn(`[signwell-webhook] Could not fetch PDF URL: ${pdfRes.status}`)
    }
  }

  // Update status to completed — store direct SignWell PDF URL in download_url
  const { error: updateErr } = await client
    .from('documents')
    .update({
      status: 'signed',
      download_url: pdfUrl,
      completed_at: new Date().toISOString(),
    })
    .eq('id', doc.id)

  if (updateErr) {
    console.error(`[signwell-webhook] Failed to update document:`, updateErr)
    return
  }

  console.log(`[signwell-webhook] Document ${doc.id} marked as completed`)

  // ── Create an in-app notification for the sending agent ──────
  // Non-critical: never let a notification failure break the webhook response.
  await createSignedNotification(client, doc)
}

async function createSignedNotification(
  client: ReturnType<typeof createClient>,
  doc: { id: string; agent_id: string | null; title: string | null; client_name: string | null },
) {
  try {
    // Resolve the agent's auth user id (the notification recipient). When the
    // document has no agent, recipient stays null → visible to admins only.
    let recipientId: string | null = null
    if (doc.agent_id) {
      const { data: agent } = await client
        .from('agents')
        .select('user_id')
        .eq('id', doc.agent_id)
        .single()
      recipientId = (agent?.user_id as string | undefined) ?? null
    }

    const { error } = await client.from('notifications').insert({
      recipient_id: recipientId,
      type: 'esign_status',
      document_id: doc.id,
      status: 'signed',
      document_title: doc.title,
      client_name: doc.client_name,
    })

    if (error) console.error('[signwell-webhook] Failed to insert notification:', error)
    else console.log(`[signwell-webhook] Notification created for document ${doc.id}`)
  } catch (err) {
    console.error('[signwell-webhook] Notification insert threw:', err)
  }
}

// ── HMAC helper ───────────────────────────────────────────────

export async function verifyHmac(
  rawBody: string,
  secret: string,
  incomingHex: string,
): Promise<boolean> {
  const encoder = new TextEncoder()
  const keyBytes = encoder.encode(secret)
  const bodyBytes = encoder.encode(rawBody)

  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  // Convert incoming hex signature to bytes
  let incomingBytes: Uint8Array
  try {
    incomingBytes = hexToBytes(incomingHex)
  } catch {
    return false
  }

  return crypto.subtle.verify('HMAC', key, incomingBytes, bodyBytes)
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string')
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function ok() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── SignWell event shape (partial — extend as needed) ─────────

interface SignWellEvent {
  event_type?: string
  event?: {
    type: string
    time: number
    hash?: string
    related_signer?: { id: string; name: string; email: string }
  }
  data?: {
    object?: { id: string; status?: string }
    document?: { id: string; status?: string }
    account_id?: string
    workspace_id?: string
  }
}
