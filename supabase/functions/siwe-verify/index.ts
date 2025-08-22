
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SiweMessage } from 'https://esm.sh/siwe@2.1.4'
import { encodeBase64 } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

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

interface VerifyRequest {
  message: string
  signature: string
}

// Secure session utilities using AES-GCM encryption (iron-session style)
class SessionManager {
  private static async getKey(): Promise<CryptoKey> {
    const secret = Deno.env.get('SESSION_SECRET')
    if (!secret) {
      throw new Error('SESSION_SECRET not configured')
    }
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('siwe-session'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  static async encrypt(data: any): Promise<string> {
    const key = await this.getKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encodedData = new TextEncoder().encode(JSON.stringify(data))
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    )
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    return encodeBase64(combined)
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

    const { message, signature }: VerifyRequest = await req.json()

    if (!message || !signature) {
      return new Response(
        JSON.stringify({ error: 'Message and signature are required' }),
        { 
          status: 400, 
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse and verify the SIWE message
    const siweMessage = new SiweMessage(message)
    const result = await siweMessage.verify({ signature })

    if (result.success) {
      // Create secure session data
      const sessionData = {
        address: siweMessage.address,
        chainId: siweMessage.chainId,
        isAuthenticated: true,
        expirationTime: siweMessage.expirationTime,
        createdAt: new Date().toISOString(),
      }

      // Encrypt session data
      const encryptedSession = await SessionManager.encrypt(sessionData)
      
      // Set secure encrypted session cookie; use SameSite=None for cross-site requests
      const sessionCookie = `siwe-session=${encodeURIComponent(encryptedSession)}; HttpOnly; Secure; SameSite=None; Max-Age=86400; Path=/`

      return new Response(
        JSON.stringify({ 
          ok: true, 
          user: sessionData 
        }),
        { 
          headers: { 
            ...getCorsHeaders(req), 
            'Content-Type': 'application/json',
            'Set-Cookie': sessionCookie
          } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Invalid signature' 
        }),
        { 
          status: 401, 
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error) {
    console.error('Verification error:', error)
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: 'Verification failed' 
      }),
      { 
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
      }
    )
  }
})
