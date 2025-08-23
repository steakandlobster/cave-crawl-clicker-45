import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SiweMessage } from 'npm:siwe';
import { createClient } from 'npm:@supabase/supabase-js@2';

// CORS helpers
function getAllowedOrigin(req) {
  const origin = req.headers.get('origin');
  if (origin) return origin;
  const referer = req.headers.get('referer');
  try {
    if (referer) return new URL(referer).origin;
  } catch  {}
  return '*';
}

function getCorsHeaders(req) {
  const allowedOrigin = getAllowedOrigin(req);
  const requestedHeaders = req.headers.get('access-control-request-headers') || 'authorization, x-client-info, apikey, content-type, cookie';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': requestedHeaders,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin'
  };
}

function getCookie(req, name) {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Normalize signatures from providers that return ABI-encoded bytes or ERC-6492 wrapped signatures
function normalizeSignature(sig) {
  if (!sig) return sig;
  let hex = sig.startsWith('0x') ? sig.slice(2) : sig;
  // Raw 65-byte signature is 130 hex chars
  if (hex.length === 130) return '0x' + hex;
  const MAGIC_6492 = '6492649264926492649264926492649264926492649264926492649264926492';
  try {
    if (hex.length > 130) {
      // Try ABI-encoded dynamic bytes: [offset(32)][len(32)][data(len)][padding]
      const lenWord = hex.slice(64, 128);
      const length = parseInt(lenWord, 16);
      if (length === 65 || length === 64) {
        const dataStart = 128;
        const dataEnd = dataStart + length * 2;
        const sigData = hex.slice(dataStart, dataEnd);
        if (sigData.length === 130 || sigData.length === 128) {
          if (sigData.length === 128) return '0x' + sigData + '1b';
          return '0x' + sigData;
        }
      }
      // Fallback: if 6492 magic is present, take 65 bytes before it
      const markerIndex = hex.indexOf(MAGIC_6492);
      if (markerIndex > 130) {
        const sigData = hex.slice(markerIndex - 130, markerIndex);
        if (sigData.length === 130) return '0x' + sigData;
      }
    }
  } catch (_) {}
  return sig;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(req)
    });
  }

  try {
    // === NEW: Handle nonce setting ===
    // This is the new part you need to add
    const url = new URL(req.url);
    if (req.method === 'POST' && url.pathname.endsWith('/nonce')) {
      try {
        const { nonce } = await req.json();
        
        if (!nonce || typeof nonce !== 'string') {
          return new Response(JSON.stringify({
            ok: false,
            error: 'Valid nonce is required'
          }), {
            status: 400,
            headers: {
              ...getCorsHeaders(req),
              'Content-Type': 'application/json'
            }
          });
        }

        // Set the nonce as an HttpOnly cookie
        const nonceCookie = `siwe-nonce=${nonce}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=300`; // 5 minutes
        
        return new Response(JSON.stringify({ 
          ok: true,
          message: 'Nonce set successfully' 
        }), {
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json',
            'Set-Cookie': nonceCookie
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'Failed to process nonce request'
        }), {
          status: 400,
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // === END NEW SECTION ===

    if (req.method === 'GET') {
      // Protected: requires a valid Supabase JWT in Authorization header
      const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'), {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || ''
          }
        }
      });
      const bearer = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || undefined;
      const { data, error } = await supabase.auth.getUser(bearer);
      if (error || !data?.user) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'Unauthorized'
        }), {
          status: 401,
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json'
          }
        });
      }
      return new Response(JSON.stringify({
        ok: true,
        user: data.user
      }), {
        headers: {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json'
        }
      });
    }

    if (req.method === 'POST') {
      // Require Supabase JWT before SIWE verification
      const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'), {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || ''
          }
        }
      });
      const bearer = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || undefined;
      const { data: authData, error: authErr } = await supabase.auth.getUser(bearer);
      if (authErr || !authData?.user) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'Unauthorized'
        }), {
          status: 401,
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json'
          }
        });
      }

      // Verify SIWE and bootstrap a Supabase session via magic link OTP
      const { message, signature } = await req.json();
      if (!message || !signature) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'Message and signature are required'
        }), {
          status: 400,
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json'
          }
        });
      }

      const normalizedSignature = normalizeSignature(signature);
      const siweMessage = new SiweMessage(message);

      // Validate nonce from HttpOnly cookie to prevent replay attacks
      const serverNonce = getCookie(req, 'siwe-nonce');
      if (!serverNonce || serverNonce !== siweMessage.nonce) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'Invalid nonce'
        }), {
          status: 401,
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json'
          }
        });
      }

      const result = await siweMessage.verify({
        signature: normalizedSignature
      });

      if (!result.success) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'Invalid signature'
        }), {
          status: 401,
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json'
          }
        });
      }

      const admin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
      const email = `${siweMessage.address.toLowerCase()}@siwe.eth`;

      // Ensure user exists
      let userId = null;
      const { data: found, error: findErr } = await admin.auth.admin.getUserByEmail(email);
      if (findErr) {
        console.error('getUserByEmail error:', findErr);
      }

      if (!found?.user) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            wallet_address: siweMessage.address,
            siwe: true,
            chainId: siweMessage.chainId
          }
        });
        if (createErr) {
          console.error('createUser error:', createErr);
          return new Response(JSON.stringify({
            ok: false,
            error: 'Failed to create user'
          }), {
            status: 500,
            headers: {
              ...getCorsHeaders(req),
              'Content-Type': 'application/json'
            }
          });
        }
        userId = created.user.id;
      } else {
        userId = found.user.id;
      }

      // Generate a magic-link OTP and let the client exchange it for a session
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email
      });
      if (linkErr) {
        console.error('generateLink error:', linkErr);
        return new Response(JSON.stringify({
          ok: false,
          error: 'Failed to generate login link'
        }), {
          status: 500,
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json'
          }
        });
      }

      const emailOtp = linkData?.properties?.email_otp || linkData?.email_otp;
      if (!emailOtp) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'OTP not available'
        }), {
          status: 500,
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json'
          }
        });
      }

      // Optionally clear the nonce cookie after successful verification
      const clearNonce = 'siwe-nonce=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/';
      return new Response(JSON.stringify({
        ok: true,
        email,
        emailOtp,
        userId
      }), {
        headers: {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json',
          'Set-Cookie': clearNonce
        }
      });
    }

    return new Response(JSON.stringify({
      ok: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...getCorsHeaders(req),
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('siwe-user error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...getCorsHeaders(req),
        'Content-Type': 'application/json'
      }
    });
  }
});