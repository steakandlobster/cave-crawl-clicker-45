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
      
      if (response.ok) {
        const data: SiweAuthData = await response.json();
        setAuthData(data);
      } else {
        setAuthData({ ok: false });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthData({ ok: false });
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
      
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }
      
      const { nonce } = await nonceResponse.json();

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageString,
          signature,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify signature');
      }

      const verifyData = await verifyResponse.json();
      if (verifyData.ok) {
        await checkAuthStatus();
        toast.success('Successfully authenticated!');
      } else {
        throw new Error(verifyData.error || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, chainId, isAuthenticating, signMessageAsync, checkAuthStatus]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await fetch(`${SIWE_API_BASE}/siwe-logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      setAuthData(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  }, []);

  // Check auth status on connection change
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const isAuthenticated = authData?.ok && authData?.user?.isAuthenticated;

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