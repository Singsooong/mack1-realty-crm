import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Verify the caller is an admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Extract user ID from JWT token
  let userId: string | null = null
  try {
    const token = authHeader.replace('Bearer ', '')
    const parts = token.split('.')
    if (parts.length === 3) {
      const decoded = JSON.parse(atob(parts[1]))
      userId = decoded.sub
      console.log('JWT decoded:', { userId, hasRole: !!decoded.role })
    }
  } catch (err) {
    console.error('JWT decode error:', err)
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!userId) {
    console.error('No userId found in token')
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: callerAgent, error: callerError } = await supabaseAdmin
    .from('agents')
    .select('role')
    .eq('user_id', userId)
    .single()

  console.log('Agent lookup:', { userId, callerAgent, callerError: callerError?.message })

  if (callerError) {
    console.error('Agent lookup failed:', callerError)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (callerAgent?.role !== 'admin') {
    console.error('User is not admin:', { userId, role: callerAgent?.role })
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Parse request body
  let body: { name?: string; email?: string; phone?: string; specialty?: string; status?: string; role?: string; avatar_url?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const { name, email, phone, specialty, status, role, avatar_url, password } = body

  if (!name || !email) {
    return new Response(JSON.stringify({ error: 'name and email are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Use provided password or generate a random one
  const agentPassword = password || crypto.randomUUID()

  // Create Supabase Auth user with the password
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: agentPassword,
    email_confirm: true,
  })

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Insert agents row
  const { data: agent, error: agentError } = await supabaseAdmin
    .from('agents')
    .insert({
      user_id: authData.user.id,
      name,
      email,
      phone: phone || null,
      specialty: specialty || null,
      status: status || 'active',
      role: role || 'agent',
      avatar_url: avatar_url || null,
      listings: 0,
      sales: 0,
      revenue: '$0',
      rating: 0,
    })
    .select()
    .single()

  if (agentError) {
    // Rollback: remove the auth user so it doesn't become orphaned
    const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    if (rollbackError) {
      console.error('Rollback failed — orphaned auth user:', authData.user.id, rollbackError.message)
    }
    return new Response(JSON.stringify({ error: agentError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const responseData = { ...agent, password: agentPassword }
  console.log('Creating agent response:', {
    agentId: agent.id,
    agentPassword,
    responseDataKeys: Object.keys(responseData),
    hasPassword: 'password' in responseData,
    jsonString: JSON.stringify(responseData).substring(0, 100)
  })
  return new Response(JSON.stringify(responseData), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
