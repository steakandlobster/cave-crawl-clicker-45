import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WalletConnect } from './WalletConnect'
import { GameContract } from './GameContract'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, Code, Gamepad2 } from 'lucide-react'

export function WalletIntegration() {
  const { isConnected, chain } = useAccount()

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Abstract Global Wallet Integration
          </CardTitle>
          <CardDescription>
            Connect your wallet and play Cave Explorer on the Abstract blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {chain && (
              <Badge variant="outline">
                {chain.name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="game" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            On-Chain Game
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Contracts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="mt-6">
          <div className="flex justify-center">
            <WalletConnect />
          </div>
        </TabsContent>

        <TabsContent value="game" className="mt-6">
          <div className="flex justify-center">
            <GameContract />
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Smart Contract Information</CardTitle>
              <CardDescription>
                Details about the Cave Explorer smart contracts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Game Contract</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Handles game logic, wagers, and payouts
                  </p>
                  <code className="text-xs bg-muted p-2 rounded block">
                    Address: {GAME_CONTRACT_ADDRESS || 'Not deployed'}
                  </code>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Features</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Provably fair randomness</li>
                    <li>• Automatic payouts</li>
                    <li>• Session key support</li>
                    <li>• Gasless transactions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Move this to a separate config file or environment variable
const GAME_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890' // Replace with actual deployed contract address