import { useState } from 'react'
import { useAccount, useBalance, useDisconnect, useConnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Wallet, LogOut, Copy, Check, Coins, Zap } from 'lucide-react'
import { toast } from 'sonner'

export function AGWConnect() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

  // Get ETH balance
  const { data: ethBalance, isLoading: isLoadingBalance } = useBalance({
    address: address as `0x${string}`,
    query: {
      enabled: !!address && isConnected
    }
  })

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      toast.success('Address copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (balance: bigint | undefined, decimals: number = 18) => {
    if (!balance) return '0'
    const divisor = BigInt(10 ** decimals)
    const wholePart = balance / divisor
    const fractionalPart = balance % divisor
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
    return `${wholePart}.${fractionalStr.slice(0, 6)}`
  }

  if (isConnected && address) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Abstract Wallet Connected
          </CardTitle>
          <CardDescription>
            Your wallet is connected and ready for Abstract blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{formatAddress(address)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-6 w-6 p-0"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          
          {chain && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network:</span>
              <Badge variant="secondary">{chain.name}</Badge>
            </div>
          )}

          <Separator />

          {/* Balance Display */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Game Currency</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">ETH</span>
                  </div>
                  <span className="text-sm">Abstract ETH</span>
                </div>
                <div className="text-right">
                  {isLoadingBalance ? (
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <span className="text-sm font-mono">
                      {ethBalance ? formatBalance(ethBalance.value) : '0.000000'} ETH
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => disconnect()}
            variant="outline"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect Wallet
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect to Abstract
        </CardTitle>
        <CardDescription>
          Connect using Abstract Global Wallet for the best experience with gasless transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Primary recommendation for Abstract wallets */}
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Recommended</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Use MetaMask or compatible wallets connected to Abstract network for the best experience with lower fees.
          </p>
        </div>

        {/* Wallet connectors */}
        {connectors.map((connector) => (
          <Button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            variant="outline"
            className="w-full justify-start"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {connector.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}