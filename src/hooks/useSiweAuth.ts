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

      // Sign message - detect wallet type and use appropriate method
      let signature: string;
      const ethereum = (window as any).ethereum;
      
      console.log('[SIWE] Ethereum object available:', !!ethereum);
      console.log('[SIWE] Ethereum constructor name:', ethereum?.constructor?.name);
      console.log('[SIWE] Is AGW:', ethereum?.isAbstractGlobalWallet);
      console.log('[SIWE] Chain ID from wallet:', ethereum?.chainId);
      console.log('[SIWE] Connected address:', address);
      console.log('[SIWE] Connected chainId:', chainId);
      
      // Check if we're using Privy (which wraps AGW)
      const isPrivyProvider = ethereum?.constructor?.name === 'PrivyWalletProvider' || 
                             ethereum?._provider?.constructor?.name === 'PrivyWalletProvider' ||
                             typeof (ethereum as any)?.request === 'function' && 
                             JSON.stringify(ethereum).includes('privy');
      
      console.log('[SIWE] Is Privy provider:', isPrivyProvider);
      
      try {
        // For Abstract testnet (AGW), always use wagmi as it handles the complexity better
        if (chainId === 11124) {
          console.log('[SIWE] Abstract testnet detected, using wagmi for AGW signing...');
          signature = await signMessageAsync({
            account: address as `0x${string}`,
            message: messageString,
          });
          console.log('[SIWE] AGW signature from wagmi - length:', signature.length);
          console.log('[SIWE] AGW signature preview:', signature.slice(0, 50) + '...');
        } else if (isPrivyProvider) {
          console.log('[SIWE] Using wagmi for Privy signing...');
          signature = await signMessageAsync({
            account: address as `0x${string}`,
            message: messageString,
          });
          console.log('[SIWE] Privy signature from wagmi:', signature);
        } else if (ethereum) {
          // Try standard methods for other wallets
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
            console.log('[SIWE] Fallback signature from wagmi:', signature);
          }
        } else {
          // No ethereum object, use wagmi directly
          console.log('[