import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { createSiweMessage } from '@/lib/siwe';
import { SiweAuthData } from '@/types/siwe';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SIWE_API_BASE = 'https://aegayadckentahcljxhf.supabase.co/functions/v1';

export function useSiweAuth() {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [authData, setAuthData] = useState<SiweAuthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    if (!isConnected) {
      setAuthData(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setAuthData(null);
        return;
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const response = await fetch(`${SIWE_API_BASE}/siwe-user`, {
        credentials: 'include',
        headers,
      });

      const text = await response.text();
      let parsed: SiweAuthData | null = null;
      try { parsed = text ? JSON.parse(text) : null; } catch {}

      console.log('[SIWE] /siwe-user status:', response.status, 'body:', text);

      if (response.ok && parsed) {
        setAuthData(parsed);
      } else {
        setAuthData({ ok: false, error: parsed?.error || `status ${response.status}` });
      }
    } catch (error) {
      console.error('[SIWE] Auth check error:', error);
      setAuthData({ ok: false, error: (error as any)?.message || 'unknown error' });
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  // Generate a random nonce
  const generateNonce = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  // Sign message with AGW-compatible approach
  const signMessageWithAGW = async (messageString: string, walletAddress: string) => {
    console.log('[SIWE] Attempting to sign with AGW-compatible method');
    
    try {
      // Try wagmi first (which should work with AGW)
      const signature = await signMessageAsync({
        account: walletAddress as `0x${string}`,
        message: messageString,
      });
      
      console.log('[SIWE] AGW signature obtained:', signature);
      return signature;
    } catch (error) {
      console.error('[SIWE] AGW signing failed:', error);
      throw error;
    }
  };

  // Sign in with SIWE
  const signIn = useCallback(async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    try {
      if (!address || !chainId) {
        throw new Error('Wallet not connected');
      }

      console.log('[SIWE] Starting sign-in process for AGW address:', address);
      console.log('[SIWE] Chain ID:', chainId);

      // Generate and set nonce on server
      const nonce = generateNonce();
      const nonceResponse = await fetch(`${SIWE_API_BASE}/siwe-user/nonce`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nonce }),
      });

      const nonceText = await nonceResponse.text();
      let nonceJson: any = null;
      try { nonceJson = nonceText ? JSON.parse(nonceText) : null; } catch {}
      console.log('[SIWE] /nonce status:', nonceResponse.status, 'body:', nonceText);

      if (!nonceResponse.ok || !nonceJson?.ok) {
        throw new Error(`Failed to set nonce (status ${nonceResponse.status}): ${nonceJson?.error || 'Unknown error'}`);
      }

      // Create SIWE message
      const message = createSiweMessage(address, chainId, nonce);
      const messageString = message.prepareMessage();

      console.log('[SIWE] SIWE message created for AGW wallet');
      console.log('[SIWE] Message preview:', messageString.slice(0, 100) + '...');

      // Sign message using AGW-compatible method
      const signature = await signMessageWithAGW(messageString, address);

      // Send verification request
      const { data: { session } } = await supabase.auth.getSession();
      const verifyHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) verifyHeaders['Authorization'] = `Bearer ${session.access_token}`;

      const verifyResponse = await fetch(`${SIWE_API_BASE}/siwe-user`, {
        method: 'POST',
        credentials: 'include',
        headers: verifyHeaders,
        body: JSON.stringify({ 
          message: messageString, 
          signature,
          address,
          walletType: 'agw' // Indicate this is an AGW wallet
        }),
      });

      const verifyText = await verifyResponse.text();
      let verifyJson: any = null;
      try { verifyJson = verifyText ? JSON.parse(verifyText) : null; } catch {}
      console.log('[SIWE] /siwe-user (POST) status:', verifyResponse.status, 'body:', verifyText);

      if (!verifyResponse.ok || !verifyJson?.ok) {
        throw new Error(verifyJson?.error || `Failed to verify (status ${verifyResponse.status})`);
      }

      // Exchange OTP for a Supabase session
      const { email, emailOtp } = verifyJson;
      const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
        email,
        token: emailOtp,
        type: 'email',
      });
      if (verifyErr) {
        throw new Error(verifyErr.message || 'Failed to create Supabase session');
      }

      await checkAuthStatus();
      toast.success('Successfully authenticated with Abstract Global Wallet!');
    } catch (error: any) {
      console.error('[SIWE] Sign in error:', error);
      toast.error(error?.message || 'Failed to sign in with AGW');
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, chainId, isAuthenticating, signMessageAsync, checkAuthStatus]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const res = await fetch(`${SIWE_API_BASE}/siwe-logout`, {
        method: 'POST',
        credentials: 'include',
      });
      await supabase.auth.signOut();
      setAuthData(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('[SIWE] Sign out error:', error);
      toast.error('Failed to sign out');
    }
  }, []);

  // Check auth status on connection change
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const isAuthenticated = Boolean((authData as any)?.ok && ((authData as any)?.user?.id || (authData as any)?.user?.isAuthenticated));

  return {
    authData,
    isLoading,
    isAuthenticating,
    isAuthenticated,
    signIn,
    signOut,
    checkAuthStatus,
  };
}