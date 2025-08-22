import { useState } from 'react'
import { useAccount, useBalance, useDisconnect } from 'wagmi'
import { useLoginWithAbstract } from '@abstract-foundation/agw-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Wallet, LogOut, Copy, Check, Coins, Zap } from 'lucide-react'
import { toast } from 'sonner'

export function AGWConnect() {
  const { address, isConnected, chain, status } = useAccount()
  const { login, logout } = useLoginWithAbstract()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

  // Get ETH balance
  const { data: ethBalance, isLoading: isLoadingBalance } = useBalance({
    address: address as `0x${string}`,
    query: {
      enabled: !!address && isConnected
    }
  })

  const isConnecting = status === 'connecting' || status === 'reconnecting'

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
            Abstract Global Wallet Connected
          </CardTitle>
          <CardDescription>
            Your Abstract Global Wallet is connected with gasless transactions enabled
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
            onClick={() => {
              logout()
              disconnect()
            }}
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
          Connect with Abstract Global Wallet
        </CardTitle>
        <CardDescription>
          Use Abstract Global Wallet for gasless transactions and the best Web3 experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary AGW Connection Button - Following Abstract's official docs */}
        <Button
          onClick={login}
          disabled={isConnecting}
          variant="default"
          className="w-full justify-center h-14 text-base font-medium"
        >
          {isConnecting ? (
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 animate-spin" />
              <span>Connecting to Abstract Global Wallet...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <AbstractLogo className="h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">Connect Abstract Global Wallet</div>
                <div className="text-xs opacity-90">Gasless transactions • Best experience</div>
              </div>
            </div>
          )}
        </Button>

        {/* Benefits specific to Abstract Global Wallet */}
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Abstract Global Wallet Benefits</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span><strong>Gasless transactions</strong> - No gas fees for most operations</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span><strong>Seamless experience</strong> - Purpose-built for Abstract blockchain</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span><strong>Enhanced security</strong> - Latest Web3 security standards</span>
            </li>
          </ul>
        </div>

        {/* Small note about alternatives */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Abstract Global Wallet is the recommended way to connect to Abstract blockchain
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Abstract Logo component from official docs
function AbstractLogo({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="18"
      viewBox="0 0 52 47"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M33.7221 31.0658L43.997 41.3463L39.1759 46.17L28.901 35.8895C28.0201 35.0081 26.8589 34.5273 25.6095 34.5273C24.3602 34.5273 23.199 35.0081 22.3181 35.8895L12.0432 46.17L7.22205 41.3463L17.4969 31.0658H33.7141H33.7221Z" fill="currentColor" />
      <path d="M35.4359 28.101L49.4668 31.8591L51.2287 25.2645L37.1978 21.5065C35.9965 21.186 34.9954 20.4167 34.3708 19.335C33.7461 18.2613 33.586 17.0033 33.9063 15.8013L37.6623 1.76283L31.0713 0L27.3153 14.0385L35.4279 28.093L35.4359 28.101Z" fill="currentColor" />
      <path d="M15.7912 28.101L1.76028 31.8591L-0.00158691 25.2645L14.0293 21.5065C15.2306 21.186 16.2316 20.4167 16.8563 19.335C17.4809 18.2613 17.6411 17.0033 17.3208 15.8013L13.5648 1.76283L20.1558 0L23.9118 14.0385L15.7992 28.093L15.7912 28.101Z" fill="currentColor" />
    </svg>
  )
}