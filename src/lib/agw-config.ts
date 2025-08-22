import { createConfig } from 'wagmi'
import { http } from 'viem'
import { abstractTestnet } from 'viem/chains'
import { metaMask } from 'wagmi/connectors'

// Wagmi configuration for Abstract testnet only
export const wagmiConfig = createConfig({
  chains: [abstractTestnet],
  connectors: [
    metaMask(),
  ],
  transports: {
    [abstractTestnet.id]: http('https://api.testnet.abs.xyz'),
  },
})

// AGW Client configuration following Abstract docs
export const agwConfig = {
  projectId: 'cave-explorer',
  chain: abstractTestnet,
  chains: [abstractTestnet],
  enableSessionKeys: true,
  enableGasless: true,
  sessionDurationMs: 1000 * 60 * 60 * 24, // 24 hours
}