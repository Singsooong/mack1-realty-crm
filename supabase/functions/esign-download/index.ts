import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Plain-text error responses MUST also carry CORS headers — otherwise the browser
// reports a misleading "No 'Access-Control-Allow-Origin' header" CORS error and hides
// the real status (e.g. 404), making the actual failure impossible to diagnose client-side.
function errorResponse(message: string, status: number) {
  return new Response(message, { status, headers: CORS_HEADERS })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const url = new URL(req.url)
    const documentId = url.searchParams.get('document_id')
    const token = url.searchParams.get('token')
    // 'inline' lets a browser tab render the PDF for viewing; default 'attachment' triggers a download.
    const disposition = url.searchParams.get('disposition') === 'inline' ? 'inline' : 'attachment'

    if (!documentId) {
      return errorResponse('Missing document_id', 400)
    }

    // Verify the caller is authenticated
    const authHeader = token ? `Bearer ${token}` : (req.headers.get('Authorization') ?? '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return errorResponse('Unauthorized', 401)
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // documents.agent_id references public.agents.id — NOT auth.users.id.
    // Resolve the caller's agent record so we can compare against the document's owner.
    const { data: agent, error: agentErr } = await serviceClient
      .from('agents')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (agentErr || !agent) {
      return errorResponse('No agent profile for this user', 403)
    }

    // Load the document. Admins may download any document; agents only their own.
    let query = serviceClient
      .from('documents')
      .select('id, agent_id, signwell_id, client_name, download_url')
      .eq('id', documentId)

    if (agent.role !== 'admin') {
      query = query.eq('agent_id', agent.id)
    }

    const { data: doc, error: docErr } = await query.single()

    if (docErr || !doc) {
      return errorResponse('Document not found', 404)
    }

    if (!doc.signwell_id) {
      return errorResponse('No SignWell document ID', 400)
    }

    const apiKey = Deno.env.get('SIGNWELL_API_KEY')!

    // audit_page=false drops the "Completed Document Audit Report" page — we want the
    // signed document only. url_only=true returns a SignWell-hosted link to that PDF.
    const pdfRes = await fetch(
      `https://www.signwell.com/api/v1/documents/${doc.signwell_id}/completed_pdf?url_only=true&audit_page=false`,
      { headers: { 'X-Api-Key': apiKey } },
    )

    if (!pdfRes.ok) {
      return errorResponse(`Failed to get PDF from SignWell: ${pdfRes.status}`, 502)
    }

    const { file_url } = await pdfRes.json() as { file_url: string }

    // Viewing: redirect the browser tab to the SignWell-hosted PDF URL so the user lands
    // on a real signwell.com link (top-level navigation isn't subject to CORS/X-Frame).
    if (disposition === 'inline') {
      return new Response(null, {
        status: 302,
        headers: { ...CORS_HEADERS, Location: file_url },
      })
    }

    // Downloading: stream the bytes back so we control the filename (and avoid the
    // browser fetch hitting SignWell's cross-origin restrictions directly).
    const download = await fetch(file_url)
    if (!download.ok) {
      return errorResponse('Failed to download PDF', 502)
    }

    const filename = `signed-${doc.client_name.replace(/\s+/g, '-')}.pdf`

    return new Response(download.body, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[esign-download]', err)
    return new Response('Internal error', { status: 500, headers: CORS_HEADERS })
  }
})
