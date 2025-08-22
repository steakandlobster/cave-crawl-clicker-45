import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SiweMessage } from 'https://esm.sh/siwe@2.1.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
}

interface VerifyRequest {
  message: string
  signature: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { message, signature }: VerifyRequest = await req.json()

    if (!message || !signature) {
      return new Response(
        JSON.stringify({ error: 'Message and signature are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse and verify the SIWE message
    const siweMessage = new SiweMessage(message)
    const result = await siweMessage.verify({ signature })

    if (result.success) {
      // Store session information (in a real app, you'd use a secure session store)
      const sessionData = {
        address: siweMessage.address,
        chainId: siweMessage.chainId,
        isAuthenticated: true,
        expirationTime: siweMessage.expirationTime,
      }

      // Set session cookie (simplified for demo)
      const sessionCookie = `siwe-session=${JSON.stringify(sessionData)}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`

      return new Response(
        JSON.stringify({ 
          ok: true, 
          user: sessionData 
        }),
        { 
          headers: { 
            ...corsHeaders, 
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})