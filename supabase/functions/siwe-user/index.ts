import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cookie',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get session from cookie
    const cookies = req.headers.get('cookie') || ''
    const sessionMatch = cookies.match(/siwe-session=([^;]+)/)
    
    if (!sessionMatch) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'No session found' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    try {
      const sessionData = JSON.parse(decodeURIComponent(sessionMatch[1]))
      
      // Check if session is expired
      if (sessionData.expirationTime && new Date() > new Date(sessionData.expirationTime)) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: 'Session expired' 
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          ok: true, 
          user: sessionData 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Invalid session data' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error) {
    console.error('User auth check error:', error)
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: 'Failed to check authentication status' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})