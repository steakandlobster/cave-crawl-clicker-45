import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SiweMessage } from 'npm:siwe';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createPublicClient, http, isAddress, toHex } from 'npm:viem';
import { abstractTestnet } from 'npm:viem/chains';
// CORS helpers
function getAllowedOrigin(req) {
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
    'https://cave-crawl-clicker-45.lovable.app'
  ];
  const isAllowedPattern = (o) => typeof o === 'string' && (o.endsWith('.lovable.app') || o.endsWith('.sandbox.lovable.dev'));
  if (origin && (allowedOrigins.includes(origin) || isAllowedPattern(origin))) {
    return origin;
  }
  return allowedOrigins[0];
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
  
  console.log('[SIWE] Normalizing signature, input length:', hex.length);
  
  // Raw 65-byte signature is 130 hex chars
  if (hex.length === 130) {
    console.log('[SIWE] Found standard 65-byte signature');
    return '0x' + hex;
  }
  
  const MAGIC_6492 = '6492649264926492649264926492649264926492649264926492649264926492';
  
  try {
    if (hex.length > 130) {
      console.log('[SIWE] Processing long signature, attempting ABI decode...');
      
      // Handle AGW ABI-encoded signatures specifically
      // AGW format: [offset(32)][signer_address(32)][length(32)][signature_data(65)][padding]
      if (hex.length >= 256) { // At least 128 bytes for the structure
        console.log('[SIWE] Attempting AGW ABI decode...');
        
        // Check for standard ABI offset (0x40 = 64)
        const offsetWord = hex.slice(0, 64);
        const offset = parseInt(offsetWord, 16);
        console.log('[SIWE] ABI offset:', offset);
        
        if (offset === 64) {
          // Skip signer address (next 32 bytes) and get length
          const lengthStart = 128; // Skip offset + signer address
          const lengthWord = hex.slice(lengthStart, lengthStart + 64);
          const length = parseInt(lengthWord, 16);
          console.log('[SIWE] Signature length:', length);
          
          // For AGW, signature should be 65 bytes
          if (length === 65) {
            const dataStart = lengthStart + 64; // Skip length word
            const dataEnd = dataStart + length * 2; // 65 bytes = 130 hex chars
            
            if (hex.length >= dataEnd) {
              const sigData = hex.slice(dataStart, dataEnd);
              console.log('[SIWE] Extracted AGW signature length:', sigData.length);
              
              if (sigData.length === 130) {
                console.log('[SIWE] Successfully extracted AGW signature');
                return '0x' + sigData;
              }
            }
          }
        }
      }
      
      // Fallback: standard ABI-encoded dynamic bytes
      if (hex.length >= 128) {
        const offsetWord = hex.slice(0, 64);
        const offset = parseInt(offsetWord, 16);
        
        if (offset === 64 && hex.length >= 128) {
          const lenWord = hex.slice(64, 128);
          const length = parseInt(lenWord, 16);
          
          if ((length === 65 || length === 64) && hex.length >= 128 + length * 2) {
            const dataStart = 128;
            const dataEnd = dataStart + length * 2;
            const sigData = hex.slice(dataStart, dataEnd);
            
            if (sigData.length === 130) {
              console.log('[SIWE] Extracted via standard ABI decode');
              return '0x' + sigData;
            } else if (sigData.length === 128) {
              console.log('[SIWE] Extracted 64-byte sig, adding recovery ID');
              return '0x' + sigData + '1b';
            }
          }
        }
      }
      
      // Fallback: Look for ERC-6492 magic bytes
      const markerIndex = hex.indexOf(MAGIC_6492);
      if (markerIndex > 130) {
        const sigData = hex.slice(markerIndex - 130, markerIndex);
        if (sigData.length === 130) {
          console.log('[SIWE] Extracted via ERC-6492 pattern');
          return '0x' + sigData;
        }
      }
      
      // Last resort: pattern matching for signature-like sequences
      if (hex.length > 200) {
        console.log('[SIWE] Attempting pattern-based extraction...');
        for (let i = 0; i <= hex.length - 130; i += 2) {
          const candidate = hex.slice(i, i + 130);
          const lastByte = candidate.slice(-2).toLowerCase();
          if (['1b', '1c', '00', '01'].includes(lastByte)) {
            console.log('[SIWE] Found candidate signature at position', i);
            return '0x' + candidate;
          }
        }
      }
    }
  } catch (e) {
    console.error('[SIWE] Error normalizing signature:', e);
  }
  
  console.log('[SIWE] No normalization applied, returning original');
  return sig;
}
serve(async (req)=>{
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
      // SIWE verification does not require a Supabase JWT at the function layer.
      // We verify the wallet signature and then mint a Supabase session via magic link OTP.
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
      try {
        // Try verification with normalized signature first
        let verified = false;
        try {
          const res = await siweMessage.verify({ signature: normalizedSignature });
          verified = !!res.success;
        } catch (_) {}

        // If that fails, attempt to extract a valid 65-byte signature from wrapped/ABI-encoded inputs
        if (!verified && typeof signature === 'string') {
          const rawHex = signature.startsWith('0x') ? signature.slice(2) : signature;
          const candidates = new Set<string>();

          // 65-byte candidates (130 hex chars)
          for (let i = 0; i <= rawHex.length - 130; i += 2) {
            const candidate = rawHex.slice(i, i + 130);
            const lastByte = candidate.slice(-2).toLowerCase();
            if (['1b', '1c', '00', '01'].includes(lastByte)) {
              candidates.add('0x' + candidate);
            }
          }

          // 64-byte candidates (append common recovery IDs)
          for (let i = 0; i <= rawHex.length - 128; i += 2) {
            const cand64 = rawHex.slice(i, i + 128);
            for (const v of ['1b', '1c']) {
              candidates.add('0x' + cand64 + v);
            }
          }

          for (const cand of candidates) {
            try {
              const res = await siweMessage.verify({ signature: cand });
              if (res.success) {
                verified = true;
                break;
              }
            } catch (_) {
              // continue trying candidates
            }
          }
        }

        // If still not verified, try ERC-1271 for smart contract wallets (AGW)
        if (!verified && isAddress(siweMessage.address) && siweMessage.chainId === 11124) {
          console.log('[SIWE] Attempting ERC-1271 verification for contract wallet:', siweMessage.address);
          
          try {
            const publicClient = createPublicClient({
              chain: abstractTestnet,
              transport: http('https://api.testnet.abs.xyz')
            });

            // ERC-1271 standard function selector for isValidSignature
            const ERC1271_MAGIC_VALUE = '0x1626ba7e';
            
            // Hash the message as SIWE library would
            const messageHash = siweMessage.messageHash();
            
            // Try with original signature first
            try {
              const result = await publicClient.readContract({
                address: siweMessage.address as `0x${string}`,
                abi: [
                  {
                    name: 'isValidSignature',
                    type: 'function',
                    inputs: [
                      { name: '_hash', type: 'bytes32' },
                      { name: '_signature', type: 'bytes' }
                    ],
                    outputs: [{ name: '', type: 'bytes4' }],
                    stateMutability: 'view'
                  }
                ],
                functionName: 'isValidSignature',
                args: [messageHash as `0x${string}`, signature as `0x${string}`]
              });
              
              if (result === ERC1271_MAGIC_VALUE) {
                console.log('[SIWE] ERC-1271 verification succeeded with original signature');
                verified = true;
              }
            } catch (erc1271Error) {
              console.log('[SIWE] ERC-1271 verification failed with original signature:', erc1271Error.message);
              
              // If original signature fails, try with normalized signature
              if (normalizedSignature !== signature) {
                try {
                  const result = await publicClient.readContract({
                    address: siweMessage.address as `0x${string}`,
                    abi: [
                      {
                        name: 'isValidSignature',
                        type: 'function',
                        inputs: [
                          { name: '_hash', type: 'bytes32' },
                          { name: '_signature', type: 'bytes' }
                        ],
                        outputs: [{ name: '', type: 'bytes4' }],
                        stateMutability: 'view'
                      }
                    ],
                    functionName: 'isValidSignature',
                    args: [messageHash as `0x${string}`, normalizedSignature as `0x${string}`]
                  });
                  
                  if (result === ERC1271_MAGIC_VALUE) {
                    console.log('[SIWE] ERC-1271 verification succeeded with normalized signature');
                    verified = true;
                  }
                } catch (normalizedError) {
                  console.log('[SIWE] ERC-1271 verification failed with normalized signature:', normalizedError.message);
                }
              }
            }
          } catch (clientError) {
            console.error('[SIWE] ERC-1271 client setup error:', clientError);
          }
        }

        if (!verified) {
          console.error('[SIWE] Verification failed for address:', siweMessage.address, 'chain:', siweMessage.chainId);
          console.error('[SIWE] Original signature length:', signature.length);
          console.error('[SIWE] Normalized signature:', normalizedSignature);
          
          return new Response(JSON.stringify({
            ok: false,
            error: 'Signature verification failed. Ensure you are using an Abstract Global Wallet on the correct network.'
          }), {
            status: 401,
            headers: {
              ...getCorsHeaders(req),
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (e) {
        console.error('SIWE verify threw:', e);
        return new Response(JSON.stringify({
          ok: false,
          error: 'Invalid signature format'
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
