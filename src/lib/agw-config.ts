import { createConfig } from 'wagmi'
import { http } from 'viem'
import { abstractTestnet, abstract } from 'viem/chains'
import { metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// Wagmi configuration for Abstract blockchain
export const wagmiConfig = createConfig({
  chains: [abstractTestnet, abstract],
  connectors: [
    metaMask(),
    walletConnect({
      projectId: 'your-walletconnect-project-id', // Replace with your WalletConnect project ID
    }),
    coinbaseWallet({
      appName: 'Cave Explorer',
    }),
  ],
  transports: {
    [abstractTestnet.id]: http(),
    [abstract.id]: http(),
  },
})

// AGW Client configuration
export const agwConfig = {
  projectId: 'cave-explorer', // Your project identifier
  chain: abstractTestnet, // Primary chain for AGW
  chains: [abstractTestnet], // Only testnet for now
  enableSessionKeys: true,
  enableGasless: true,
}