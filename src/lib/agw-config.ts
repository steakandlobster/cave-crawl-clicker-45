import { createConfig, http, createStorage } from 'wagmi'
import { abstractTestnet } from 'viem/chains'
import { metaMask } from 'wagmi/connectors'
import { createPublicClient } from 'viem'

// Enhanced Abstract testnet chain configuration
const abstractTestnetChain = {
  ...abstractTestnet,
  id: 11124,
  name: 'Abstract Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://api.testnet.abs.xyz'],
    },
    public: {
      http: ['https://api.testnet.abs.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Abstract Explorer',
      url: 'https://explorer.testnet.abs.xyz',
    },
  },
  testnet: true,
}

// Wagmi configuration with persistence and auto-reconnection
export const wagmiConfig = createConfig({
  chains: [abstractTestnetChain],
  connectors: [
    metaMask(),
  ],
  transports: {
    [abstractTestnetChain.id]: http('https://api.testnet.abs.xyz'),
  },
  // Enable storage for persistence and auto-reconnection
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
})

export const publicClient = createPublicClient({
  chain: abstractTestnetChain,
  transport: http('https://api.testnet.abs.xyz'),
})

// AGW Client configuration following Abstract docs
export const agwConfig = {
  projectId: 'cave-explorer',
  chain: abstractTestnetChain,
  chains: [abstractTestnetChain],
  enableSessionKeys: true,
  enableGasless: true,
  sessionDurationMs: 1000 * 60 * 60 * 24, // 24 hours
}