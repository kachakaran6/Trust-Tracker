import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: jsonData, access_token } = await req.json()

    // 1. Validate payload size (approx 1MB limit for safety)
    const sizeInBytes = new TextEncoder().encode(JSON.stringify(jsonData)).length
    if (sizeInBytes > 1024 * 1024 * 2) { // 2MB
      return new Response(JSON.stringify({ error: "Payload too large (Max 2MB)" }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Set expiry (30 mins from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    // 3. Save to database
    const { data: session, error } = await supabase
      .from('temporary_analytics')
      .insert({
        session_data: jsonData,
        expires_at: expiresAt,
        access_token: access_token || null
      })
      .select('id')
      .single()

    if (error) throw error

    // 4. Return the session ID and URL
    const publicUrl = Deno.env.get('APP_URL') || 'https://trusttracker.live'
    const sessionUrl = `${publicUrl}/session/${session.id}`

    return new Response(
      JSON.stringify({ 
        session_id: session.id,
        url: sessionUrl,
        expires_at: expiresAt
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
