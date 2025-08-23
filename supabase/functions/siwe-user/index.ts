// siwe-user/index.ts - Vite + React SIWE User Handler

import { createSiweMessage } from 'viem/siwe'
import type { Address } from 'viem'

/**
 * SIWE Session Data interface
 */
export interface SessionData {
  nonce?: string
  isAuthenticated?: boolean
  address?: Address
  chainId?: number
  expirationTime?: string
  signature?: string
  message?: string
}

/**
 * Authentication response interface
 */
export interface AuthResponse {
  ok: boolean
  message?: string
  user?: {
    isAuthenticated: boolean
    address: Address
    chainId?: number
    expirationTime?: string
  }
  isConfigurationError?: boolean
}

/**
 * SIWE Authentication Manager for Vite + React
 * Handles client-side session management and authentication state
 * 
 * Note: In a production app, you'd typically use a backend API
 * This implementation uses localStorage for demo purposes
 */
export class SiweUserManager {
  private static readonly SESSION_KEY = 'siwe_session'
  private static readonly NONCE_KEY = 'siwe_nonce'
  
  /**
   * Generate a random nonce for SIWE message
   */
  static generateNonce(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Store nonce in localStorage (in production, this would be handled server-side)
   */
  static storeNonce(nonce: string): void {
    localStorage.setItem(this.NONCE_KEY, nonce)
  }

  /**
   * Get stored nonce from localStorage
   */
  static getNonce(): string | null {
    return localStorage.getItem(this.NONCE_KEY)
  }

  /**
   * Clear stored nonce
   */
  static clearNonce(): void {
    localStorage.removeItem(this.NONCE_KEY)
  }

  /**
   * Create a SIWE message for signing
   */
  static createSiweMessage(params: {
    address: Address
    chainId: number
    nonce: string
  }): string {
    const { address, chainId, nonce } = params
    
    const message = createSiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in with Ethereum to authenticate with this application.",
      uri: window.location.origin,
      version: "1",
      chainId,
      nonce,
      issuedAt: new Date(),
      expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week
    })

    return message
  }

  /**
   * Store user session after successful authentication
   */
  static storeSession(sessionData: SessionData): void {
    const session = {
      ...sessionData,
      timestamp: Date.now()
    }
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session))
  }

  /**
   * Get current user session
   */
  static getSession(): SessionData | null {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY)
      if (!stored) return null
      
      return JSON.parse(stored)
    } catch {
      return null
    }
  }

  /**
   * Clear user session (logout)
   */
  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY)
    this.clearNonce()
  }

  /**
   * Check if current session is valid and not expired
   */
  static isSessionValid(session: SessionData | null = null): boolean {
    const currentSession = session || this.getSession()
    
    if (!currentSession || !currentSession.isAuthenticated) {
      return false
    }

    // Check expiration
    if (currentSession.expirationTime) {
      const expirationTime = new Date(currentSession.expirationTime).getTime()
      if (expirationTime <= Date.now()) {
        this.clearSession() // Clean up expired session
        return false
      }
    }

    return true
  }

  /**
   * Get current authenticated user information
   * This mimics the API route behavior but works client-side
   */
  static getCurrentUser(): AuthResponse {
    try {
      const session = this.getSession()

      if (!session || !session.isAuthenticated || !session.address) {
        return {
          ok: false,
          message: "No user session found. Please sign in with your wallet."
        }
      }

      // Check if session is expired
      if (session.expirationTime && new Date(session.expirationTime).getTime() < Date.now()) {
        this.clearSession()
        return {
          ok: false,
          message: "SIWE session expired. Please sign in again."
        }
      }

      // Return successful authentication data
      return {
        ok: true,
        user: {
          isAuthenticated: session.isAuthenticated,
          address: session.address,
          chainId: session.chainId,
          expirationTime: session.expirationTime,
        }
      }

    } catch (error) {
      console.error("SIWE getCurrentUser error:", error)
      return {
        ok: false,
        message: "Failed to retrieve user session. Please try again."
      }
    }
  }

  /**
   * Verify a signed SIWE message
   * In production, this would typically be done on your backend
   */
  static async verifySignature(params: {
    message: string
    signature: string
    expectedAddress: Address
  }): Promise<boolean> {
    try {
      const { message, signature, expectedAddress } = params
      
      // Import viem for signature verification
      const { verifyMessage } = await import('viem')
      
      const isValid = await verifyMessage({
        address: expectedAddress,
        message,
        signature: signature as `0x${string}`
      })

      return isValid
    } catch (error) {
      console.error("SIWE signature verification error:", error)
      return false
    }
  }

  /**
   * Complete SIWE authentication process
   */
  static async authenticate(params: {
    address: Address
    chainId: number
    signature: string
    message: string
  }): Promise<AuthResponse> {
    try {
      const { address, chainId, signature, message } = params
      const storedNonce = this.getNonce()

      if (!storedNonce) {
        return {
          ok: false,
          message: "No nonce found. Please request a new nonce first."
        }
      }

      // Verify the signature matches the expected address
      const isValid = await this.verifySignature({
        message,
        signature,
        expectedAddress: address
      })

      // Clear nonce after verification attempt
      this.clearNonce()

      if (!isValid) {
        return {
          ok: false,
          message: "Invalid signature."
        }
      }

      // Store successful authentication
      const sessionData: SessionData = {
        isAuthenticated: true,
        address,
        chainId,
        expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week
        signature,
        message
      }

      this.storeSession(sessionData)

      return {
        ok: true,
        user: {
          isAuthenticated: true,
          address,
          chainId,
          expirationTime: sessionData.expirationTime
        }
      }

    } catch (error) {
      console.error("SIWE authentication error:", error)
      return {
        ok: false,
        message: "Authentication failed. Please try again."
      }
    }
  }

  /**
   * Initialize SIWE authentication process
   * Returns nonce and message to be signed
   */
  static initializeAuth(address: Address, chainId: number): { nonce: string; message: string } {
    const nonce = this.generateNonce()
    this.storeNonce(nonce)
    
    const message = this.createSiweMessage({
      address,
      chainId,
      nonce
    })

    return { nonce, message }
  }

  /**
   * Logout user and clear all session data
   */
  static logout(): AuthResponse {
    try {
      this.clearSession()
      return {
        ok: true,
        message: "Successfully logged out"
      }
    } catch (error) {
      console.error("SIWE logout error:", error)
      return {
        ok: false,
        message: "Failed to logout. Please try again."
      }
    }
  }
}

// Export convenience functions
export const {
  generateNonce,
  createSiweMessage,
  getCurrentUser,
  authenticate,
  initializeAuth,
  logout,
  isSessionValid,
  getSession,
  clearSession
} = SiweUserManager

// Default export
export default SiweUserManager
{/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SiweMessage } from 'https://esm.sh/siwe@2.1.4'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  const requestedHeaders = req.headers.get('access-control-request-headers') || 'authorization, x-client-info, apikey, content-type, cookie'
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': requestedHeaders,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  }
}

function getCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  try {
    if (req.method === 'GET') {
      // Protected: requires a valid Supabase JWT in Authorization header
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        {
          global: {
            headers: {
              Authorization: req.headers.get('Authorization') || ''
            }
          }
        }
      )

      const bearer = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || undefined
      const { data, error } = await supabase.auth.getUser(bearer)

      if (error || !data?.user) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Unauthorized' }),
          { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ ok: true, user: data.user }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      // Verify SIWE and bootstrap a Supabase session via magic link OTP
      const { message, signature } = await req.json()
      if (!message || !signature) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Message and signature are required' }),
          { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      const normalizedSignature = normalizeSignature(signature)

      const siweMessage = new SiweMessage(message)

      // Validate nonce from HttpOnly cookie to prevent replay attacks
      const serverNonce = getCookie(req, 'siwe-nonce')
      if (!serverNonce || serverNonce !== (siweMessage as any).nonce) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Invalid nonce' }),
          { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      const result = await siweMessage.verify({ signature: normalizedSignature })
      if (!result.success) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Invalid signature' }),
          { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const email = `${siweMessage.address.toLowerCase()}@siwe.eth`

      // Ensure user exists
      let userId: string | null = null
      const { data: found, error: findErr } = await admin.auth.admin.getUserByEmail(email)
      if (findErr) {
        console.error('getUserByEmail error:', findErr)
      }

      if (!found?.user) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            wallet_address: siweMessage.address,
            siwe: true,
            chainId: siweMessage.chainId,
          },
        })
        if (createErr) {
          console.error('createUser error:', createErr)
          return new Response(
            JSON.stringify({ ok: false, error: 'Failed to create user' }),
            { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
          )
        }
        userId = created.user.id
      } else {
        userId = found.user.id
      }

      // Generate a magic-link OTP and let the client exchange it for a session
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })
      if (linkErr) {
        console.error('generateLink error:', linkErr)
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to generate login link' }),
          { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      const emailOtp = (linkData as any)?.properties?.email_otp || (linkData as any)?.email_otp
      if (!emailOtp) {
        return new Response(
          JSON.stringify({ ok: false, error: 'OTP not available' }),
          { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ ok: true, email, emailOtp, userId }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('siwe-user error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})

*/}
