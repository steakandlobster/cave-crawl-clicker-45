import { SiweMessage } from 'siwe';

export const SIWE_STATEMENT = 'Sign in to Cave Explorer with your wallet.';

export function createSiweMessage(address: string, chainId: number, nonce: string): SiweMessage {
  const domain = window.location.host;
  const origin = window.location.origin;
  
  return new SiweMessage({
    domain,
    address,
    statement: SIWE_STATEMENT,
    uri: origin,
    version: '1',
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  });
}

export const SIWE_CONFIG = {
  nonce: '/api/siwe/nonce',
  verify: '/api/siwe/verify', 
  user: '/api/siwe/user',
  logout: '/api/siwe/logout',
} as const;