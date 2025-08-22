export interface SiweUser {
  address: string;
  chainId: number;
  isAuthenticated: boolean;
  expirationTime?: string;
}

export interface SiweAuthData {
  ok: boolean;
  user?: SiweUser;
  error?: string;
}

export interface SiweMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}