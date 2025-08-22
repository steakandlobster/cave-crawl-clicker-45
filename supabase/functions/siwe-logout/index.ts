import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cookie',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
        }
      )
    }

    // Clear session cookie (must match cookie attributes used when setting it)
    const clearCookie = 'siwe-session=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/'

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: 'Logged out successfully' 
      }),
      { 
        headers: { 
          ...getCorsHeaders(req), 
          'Content-Type': 'application/json',
          'Set-Cookie': clearCookie
        } 
      }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: 'Failed to logout' 
      }),
      { 
        status: 500, 
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
      }
    )
  }
})
