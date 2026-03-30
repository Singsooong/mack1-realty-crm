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

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: callerAgent } = await supabaseAdmin
    .from('agents')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (callerAgent?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Parse request body
  const { name, email, phone, specialty, status, role, avatar_url } = await req.json()

  if (!name || !email) {
    return new Response(JSON.stringify({ error: 'name and email are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Create Supabase Auth user with a random temporary password
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
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
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return new Response(JSON.stringify({ error: agentError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(agent), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
