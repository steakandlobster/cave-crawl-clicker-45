import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AGWConnect } from './AGWConnect'
import { GameContract } from './GameContract'
import { NetworkSwitcher } from './NetworkSwitcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, Code, Gamepad2, Network } from 'lucide-react'

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network
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

        <TabsContent value="network" className="mt-6">
          <div className="flex justify-center">
            <NetworkSwitcher />
          </div>
        </TabsContent>

        <TabsContent value="wallet" className="mt-6">
          <div className="flex justify-center">
            <AGWConnect />
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
                  <code className="text-xs bg-muted p-2 rounded block break-all">
                    Address: {GAME_CONTRACT_ADDRESS || 'Not deployed'}
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Placeholder contract - deploy real contracts for production
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Coming Soon</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• CaveCoin ERC-20 token</li>
                    <li>• Achievement NFTs</li>
                    <li>• On-chain leaderboards</li>
                    <li>• Provable fair randomness</li>
                    <li>• Automatic payouts</li>
                    <li>• Gasless transactions</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Development Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Wallet Integration</span>
                      <span className="text-green-600">✅ Complete</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Switching</span>
                      <span className="text-green-600">✅ Complete</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Smart Contracts</span>
                      <span className="text-yellow-600">🚧 In Progress</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Token Economy</span>
                      <span className="text-gray-400">⏳ Planned</span>
                    </div>
                  </div>
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