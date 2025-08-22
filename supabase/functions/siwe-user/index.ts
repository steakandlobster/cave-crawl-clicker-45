
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

  static async decrypt(encryptedData: string): Promise<any> {
    try {
      const key = await this.getKey()
      const decoded = atob(encryptedData)
      const bytes = new Uint8Array(decoded.length)
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i)
      }
      
      const iv = bytes.slice(0, 12)
      const ciphertext = bytes.slice(12)
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      )
      
      return JSON.parse(new TextDecoder().decode(decrypted))
    } catch {
      throw new Error('Failed to decrypt session')
    }
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

    // Get encrypted session from cookie
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
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
        }
      )
    }

    try {
      // Decrypt the session data
      const encryptedSession = decodeURIComponent(sessionMatch[1])
      const sessionData = await SessionManager.decrypt(encryptedSession)
      
      // Check if session is expired
      if (sessionData.expirationTime && new Date() > new Date(sessionData.expirationTime)) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: 'Session expired' 
          }),
          { 
            status: 401, 
            headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          ok: true, 
          user: sessionData 
        }),
        { 
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
        }
      )
    } catch (error) {
      console.error('Session decryption error:', error)
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Invalid or corrupted session data' 
        }),
        { 
          status: 401, 
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
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
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
      }
    )
  }
})
