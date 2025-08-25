import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { createSiweMessage } from '@/lib/siwe';
import { SiweAuthData } from '@/types/siwe';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ethers } from 'ethers';

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
      // If there's no Supabase session yet, skip the GET call to avoid a 401 noise
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

  // Sign in with SIWE
  const signIn = useCallback(async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    try {
      // Ensure wallet is connected before proceeding
      if (!isConnected && typeof window !== 'undefined' && (window as any).ethereum) {
        await (window as any).ethereum.request?.({ method: 'eth_requestAccounts' });
      }
      if (!address || !chainId) {
        throw new Error('Wallet not connected');
      }

      // Verify we're on Abstract testnet
      if (chainId !== 11124) {
        throw new Error('Please switch to Abstract testnet (Chain ID: 11124)');
      }

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
      console.log('[SIWE] Message to sign:', messageString);

      // Sign message - try AGW-specific method first, then fallback
      let signature: string;
      try {
        // For AGW, try using eth_signTypedData_v4 or personal_sign with specific parameters
        const ethereum = (window as any).ethereum;
        
        if (ethereum && ethereum.isAbstractGlobalWallet) {
          console.log('[SIWE] Using AGW-specific signing...');
          // Try personal_sign first (AGW might handle this better)
          try {
            signature = await ethereum.request({
              method: 'personal_sign',
              params: [messageString, address],
            });
            console.log('[SIWE] AGW signature obtained:', signature);
          } catch (agwError) {
            console.log('[SIWE] AGW personal_sign failed, trying eth_sign:', agwError);
            signature = await ethereum.request({
              method: 'eth_sign',
              params: [address, ethers.utils.hexlify(ethers.utils.toUtf8Bytes(messageString))],
            });
            console.log('[SIWE] AGW eth_sign signature:', signature);
          }
        } else {
          // Fallback to standard methods
          console.log('[SIWE] Using standard signing methods...');
          try {
            const provider = new ethers.providers.Web3Provider(ethereum, 'any');
            const signer = provider.getSigner();
            signature = await signer.signMessage(messageString);
            console.log('[SIWE] Standard signature from ethers:', signature);
          } catch (ethersError) {
            console.log('[SIWE] Ethers failed, trying wagmi:', ethersError);
            signature = await signMessageAsync({
              account: address as `0x${string}`,
              message: messageString,
            });
            console.log('[SIWE] Standard signature from wagmi:', signature);
          }
        }
      } catch (signingError) {
        console.error('[SIWE] All signing methods failed:', signingError);
        throw new Error('Failed to sign message with wallet');
      }

      // Log signature details for debugging
      console.log('[SIWE] Final signature length:', signature.length);
      console.log('[SIWE] Signature starts with 0x:', signature.startsWith('0x'));
      
      // Include Supabase JWT if already signed in
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
          chainId // Include chainId for additional validation
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