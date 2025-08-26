import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage, useConnect, useReconnect } from 'wagmi';
import { SiweAuthData } from '@/types/siwe';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { createSiweMessage as viemCreateSiweMessage } from 'viem/siwe';

const SIWE_API_BASE = 'https://aegayadckentahcljxhf.supabase.co/functions/v1';

export function useSiweAuth() {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { reconnect } = useReconnect();
  const [authData, setAuthData] = useState<SiweAuthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[SIWE] Current session:', !!session?.access_token);
      
      // If there's no Supabase session, user is not authenticated
      if (!session?.access_token) {
        console.log('[SIWE] No session found, user not authenticated');
        setAuthData({ ok: false, error: 'No session' });
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
      console.log('[SIWE] Parsed response:', parsed);

      if (response.ok && parsed) {
        setAuthData(parsed);
        console.log('[SIWE] Auth data set successfully:', parsed);
        
        // If we have valid auth but no wallet connection, try to reconnect
        if (!isConnected && (parsed as any)?.user?.user_metadata?.wallet_address) {
          console.log('[SIWE] Valid session found but wallet not connected, attempting reconnect...');
          try {
            reconnect();
          } catch (reconnectError) {
            console.log('[SIWE] Auto-reconnect failed:', reconnectError);
          }
        }
      } else {
        setAuthData({ ok: false, error: parsed?.error || `status ${response.status}` });
      }
    } catch (error) {
      console.error('[SIWE] Auth check error:', error);
      setAuthData({ ok: false, error: (error as any)?.message || 'unknown error' });
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, reconnect]);

  // Initial auth check on app load
  const initializeAuth = useCallback(async () => {
    if (isInitialized) return;
    
    console.log('[SIWE] Initializing auth state...');
    setIsInitialized(true);
    
    // First, try to reconnect wallet if there was a previous connection
    try {
      reconnect();
    } catch (error) {
      console.log('[SIWE] No previous wallet connection to restore');
    }
    
    // Then check auth status regardless of wallet connection
    await checkAuthStatus();
  }, [isInitialized, reconnect, checkAuthStatus]);

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

      // Create SIWE message using viem's createSiweMessage (similar to Abstract's approach)
      const siweMessage = viemCreateSiweMessage({
        domain: window.location.host,
        address: address as `0x${string}`,
        statement: 'Sign in with Ethereum to the app.',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date(),
        expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week
      });

      console.log('[SIWE] Message to sign:', siweMessage);

      // Sign message - always use wagmi for Abstract testnet AGW
      let signature: string;
      const ethereum = (window as any).ethereum;
      
      console.log('[SIWE] Ethereum object available:', !!ethereum);
      console.log('[SIWE] Ethereum constructor name:', ethereum?.constructor?.name);
      console.log('[SIWE] Is AGW:', ethereum?.isAbstractGlobalWallet);
      console.log('[SIWE] Chain ID from wallet:', ethereum?.chainId);
      console.log('[SIWE] Connected address:', address);
      console.log('[SIWE] Connected chainId:', chainId);
      
      try {
        // For Abstract testnet (AGW), always use wagmi as it handles ERC-1271 properly
        console.log('[SIWE] Using wagmi for AGW signing on Abstract testnet...');
        signature = await signMessageAsync({
          account: address as `0x${string}`,
          message: siweMessage,
        });
        console.log('[SIWE] AGW signature from wagmi - length:', signature.length);
        console.log('[SIWE] AGW signature preview:', signature.slice(0, 50) + '...');
      } catch (signingError) {
        console.error('[SIWE] Signing failed:', signingError);
        throw new Error('Failed to sign message with wallet. Please ensure you are using Abstract Global Wallet.');
      }

      // Include Supabase JWT if already signed in
      const { data: { session } } = await supabase.auth.getSession();
      const verifyHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) verifyHeaders['Authorization'] = `Bearer ${session.access_token}`;

      const verifyResponse = await fetch(`${SIWE_API_BASE}/siwe-user`, {
        method: 'POST',
        credentials: 'include',
        headers: verifyHeaders,
        body: JSON.stringify({ 
          message: siweMessage, 
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

      console.log('[SIWE] OTP verification successful, waiting for session...');
      // Small delay to ensure session is properly established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Force a fresh check of auth status
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

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Check auth status when wallet connection changes
  useEffect(() => {
    if (isInitialized) {
      checkAuthStatus();
    }
  }, [checkAuthStatus, isConnected, isInitialized]);

  // Enhanced authentication check with more detailed logging
  const isAuthenticated = Boolean(
    authData?.ok && 
    (authData as any)?.user?.id
  );

  // Debug logging for authentication state
  useEffect(() => {
    console.log('[SIWE] Auth state update:', {
      authData,
      isAuthenticated,
      isConnected,
      hasUser: !!(authData as any)?.user,
      userId: (authData as any)?.user?.id,
      walletAddress: (authData as any)?.user?.user_metadata?.wallet_address,
      isInitialized,
    });
  }, [authData, isAuthenticated, isConnected, isInitialized]);

  return {
    authData,
    isLoading,
    isAuthenticating,
    isAuthenticated,
    isInitialized,
    signIn,
    signOut,
    checkAuthStatus,
  };
}