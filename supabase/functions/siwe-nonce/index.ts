import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { generateNonce } from 'https://esm.sh/siwe@2.1.4'

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
  const requestedHeaders = req.headers.get('access-control-request-headers') || 'authorization, x-client-info, apikey, content-type, cookie';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': requestedHeaders,
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
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate a new nonce for SIWE authentication
    const nonce = generateNonce()

    return new Response(
      JSON.stringify({ nonce }),
      { 
        headers: { 
          ...getCorsHeaders(req), 
          'Content-Type': 'application/json',
          // Store nonce in an HttpOnly cookie for server-side validation (5 min expiry)
          'Set-Cookie': `siwe-nonce=${encodeURIComponent(nonce)}; HttpOnly; Secure; SameSite=None; Max-Age=300; Path=/`
        } 
      }
    )
  } catch (error) {
    console.error('Nonce generation error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate nonce' }),
      { 
        status: 500, 
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
      }
    )
  }
})
