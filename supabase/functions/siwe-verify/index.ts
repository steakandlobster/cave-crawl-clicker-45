
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SiweMessage } from 'https://esm.sh/siwe@2.1.4'
import { encode as encodeBase64 } from 'https://deno.land/std@0.168.0/encoding/base64.ts'
import { JsonRpcProvider } from 'https://esm.sh/ethers@6.15.0'

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
  const requestedHeaders = req.headers.get('access-control-request-headers') || 'authorization, x-client-info, apikey, content-type, cookie';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': requestedHeaders,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  }
}


interface VerifyRequest {
  message: string
  signature: string
}

// Normalize signatures from providers that return ABI-encoded bytes or 6492-wrapped signatures
function normalizeSignature(sig: string): string {
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

const RPC_MAP: Record<number, string> = {
  11124: 'https://api.testnet.abs.xyz', // Abstract Testnet
};

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

    const normalizedSignature = normalizeSignature(signature)

    // Parse and verify the SIWE message
    const siweMessage = new SiweMessage(message)
    const chainId = Number(siweMessage.chainId)
    const rpcUrl = RPC_MAP[chainId]
    const provider = rpcUrl ? new JsonRpcProvider(rpcUrl) : undefined

    const result = await siweMessage.verify({ signature: normalizedSignature, provider })

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
          user: sessionData,
          token: encryptedSession
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
