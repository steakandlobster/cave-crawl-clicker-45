import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { createSiweMessage } from '@/lib/siwe';
import { SiweAuthData } from '@/types/siwe';
import { toast } from 'sonner';

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
      const response = await fetch(`${SIWE_API_BASE}/siwe-user`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Sign in with SIWE
  const signIn = useCallback(async () => {
    if (!address || !chainId || isAuthenticating) return;

    setIsAuthenticating(true);
    try {
      // Get nonce
      const nonceResponse = await fetch(`${SIWE_API_BASE}/siwe-nonce`, {
        credentials: 'include',
      });
      const nonceText = await nonceResponse.text();
      let nonceJson: any = null;
      try { nonceJson = nonceText ? JSON.parse(nonceText) : null; } catch {}
      console.log('[SIWE] /siwe-nonce status:', nonceResponse.status, 'body:', nonceText);

      if (!nonceResponse.ok || !nonceJson?.nonce) {
        throw new Error(`Failed to get nonce (status ${nonceResponse.status})`);
      }

      const { nonce } = nonceJson;

      // Create SIWE message
      const message = createSiweMessage(address, chainId, nonce);
      const messageString = message.prepareMessage();

      // Sign message
      const signature = await signMessageAsync({
        account: address as `0x${string}`,
        message: messageString,
      });

      // Verify signature
      const verifyResponse = await fetch(`${SIWE_API_BASE}/siwe-verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageString, signature }),
      });

      const verifyText = await verifyResponse.text();
      let verifyJson: any = null;
      try { verifyJson = verifyText ? JSON.parse(verifyText) : null; } catch {}
      console.log('[SIWE] /siwe-verify status:', verifyResponse.status, 'body:', verifyText);

      if (!verifyResponse.ok || !verifyJson?.ok) {
        throw new Error(verifyJson?.error || `Failed to verify (status ${verifyResponse.status})`);
      }

      await checkAuthStatus();
      toast.success('Successfully authenticated!');
    } catch (error: any) {
      console.error('[SIWE] Sign in error:', error);
      toast.error(error?.message || 'Failed to sign in');
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
      const text = await res.text();
      console.log('[SIWE] /siwe-logout status:', res.status, 'body:', text);

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

  const isAuthenticated = authData?.ok && (authData as any)?.user?.isAuthenticated;

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
