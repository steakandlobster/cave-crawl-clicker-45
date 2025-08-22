import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { generateNonce } from 'https://esm.sh/siwe@2.1.4'

function getAllowedOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (origin) return origin;
  const referer = req.headers.get('referer');
  try {
    if (referer) return new URL(referer).origin;
  } catch {}
  return 'https://preview--cave-crawl-clicker-45.lovable.app';
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
    return new Response('ok', { headers: getCorsHeaders(req) })
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
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
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
