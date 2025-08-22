import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AbstractWalletProvider } from '@abstract-foundation/agw-react'
import { wagmiConfig, agwConfig } from '@/lib/agw-config'

const queryClient = new QueryClient()

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AbstractWalletProvider {...agwConfig}>
          {children}
        </AbstractWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}