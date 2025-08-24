import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

function getAllowedOrigin(req: Request) {
  const rawOrigin = req.headers.get('origin');
  let origin = rawOrigin;
  if (!origin) {
    const referer = req.headers.get('referer');
    try {
      if (referer) origin = new URL(referer).origin;
    } catch {}
  }
  const allowedOrigins = [
    'https://preview--cave-crawl-clicker-45.lovable.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://cave-crawl-clicker-45.lovable.app',
  ];
  const isAllowedPattern = (o: string) => o.endsWith('.lovable.app') || o.endsWith('.sandbox.lovable.dev');
  if (origin && (allowedOrigins.includes(origin) || isAllowedPattern(origin))) return origin;
  return allowedOrigins[0];
}
function getCorsHeaders(req: Request) {
  const allowedOrigin = getAllowedOrigin(req);
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cookie',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
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
