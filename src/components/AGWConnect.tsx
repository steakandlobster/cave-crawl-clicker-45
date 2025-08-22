import { useState } from 'react'
import { useAccount, useBalance, useDisconnect, useConnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Wallet, LogOut, Copy, Check, Coins, Zap } from 'lucide-react'
import { toast } from 'sonner'

export function AGWConnect() {
  const { address, isConnected, chain, status } = useAccount()
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

  const isConnecting = status === 'connecting' || status === 'reconnecting' || isPending

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

  // Loading state during connection
  if (isConnecting) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 animate-spin" />
            Connecting...
          </CardTitle>
          <CardDescription>
            Connecting to Abstract Global Wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
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
            Your Abstract Global Wallet is connected and ready
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

          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Gasless Transactions Enabled</span>
          </div>

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
          <Zap className="h-5 w-5" />
          Connect to Abstract
        </CardTitle>
        <CardDescription>
          Connect using Abstract Global Wallet for gasless transactions and seamless Web3 experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Abstract Wallet Connection */}
        <div className="space-y-3">
          {connectors.map((connector) => {
            // Prioritize MetaMask for Abstract connection
            if (connector.name === 'MetaMask') {
              return (
                <Button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  disabled={isConnecting}
                  variant="default"
                  className="w-full justify-center h-12"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Connect with {connector.name}</div>
                      <div className="text-xs opacity-80">Recommended for Abstract</div>
                    </div>
                  </div>
                </Button>
              )
            }
            return null
          })}
          
          {/* Show other wallet options */}
          <div className="space-y-2">
            {connectors.map((connector) => {
              if (connector.name !== 'MetaMask') {
                return (
                  <Button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    disabled={isConnecting}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {connector.name}
                  </Button>
                )
              }
              return null
            })}
          </div>
        </div>

        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Abstract Network Benefits</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Lower transaction fees</li>
            <li>• Faster confirmation times</li>
            <li>• Built for modern Web3 applications</li>
            <li>• Enhanced security features</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}