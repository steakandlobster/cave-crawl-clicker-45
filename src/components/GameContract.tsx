import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Trophy, Coins } from 'lucide-react'
import { toast } from 'sonner'

// Simple game contract ABI for demonstration
const GAME_CONTRACT_ABI = [
  {
    inputs: [
      { name: "maxRounds", type: "uint256" },
      { name: "clientSeed", type: "bytes32" }
    ],
    name: "startGame",
    outputs: [{ name: "gameId", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "gameId", type: "uint256" }],
    name: "claimWinnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "gameId", type: "uint256" }],
    name: "getGameStatus",
    outputs: [
      { name: "isActive", type: "bool" },
      { name: "wager", type: "uint256" },
      { name: "currentRound", type: "uint256" },
      { name: "maxRounds", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const

// Replace with your deployed contract address
const GAME_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890' // You'll need to deploy this contract

export function GameContract() {
  const { address, isConnected, chain } = useAccount()
  const [wagerAmount, setWagerAmount] = useState('0.001')
  const [maxRounds, setMaxRounds] = useState('5')
  const [gameId, setGameId] = useState<string>('')

  const { 
    writeContract, 
    data: hash,
    isPending: isWritePending 
  } = useWriteContract()

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash,
  })

  const startBlockchainGame = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      const clientSeed = `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`
      
      writeContract({
        address: GAME_CONTRACT_ADDRESS as `0x${string}`,
        abi: GAME_CONTRACT_ABI,
        functionName: 'startGame',
        args: [BigInt(maxRounds), clientSeed as `0x${string}`],
        value: parseEther(wagerAmount),
        chain,
        account: address,
      })

      toast.success('Game transaction submitted!')
    } catch (error) {
      console.error('Error starting game:', error)
      toast.error('Failed to start game')
    }
  }

  const claimWinnings = async () => {
    if (!gameId || !isConnected) {
      toast.error('Invalid game ID or wallet not connected')
      return
    }

    try {
      writeContract({
        address: GAME_CONTRACT_ADDRESS as `0x${string}`,
        abi: GAME_CONTRACT_ABI,
        functionName: 'claimWinnings',
        args: [BigInt(gameId)],
        chain,
        account: address,
      })

      toast.success('Claim transaction submitted!')
    } catch (error) {
      console.error('Error claiming winnings:', error)
      toast.error('Failed to claim winnings')
    }
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Smart Contract Game</CardTitle>
          <CardDescription>
            Connect your wallet to play on-chain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Please connect your wallet to access smart contract features
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          On-Chain Game
        </CardTitle>
        <CardDescription>
          Play Cave Explorer using smart contracts on Abstract
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wager">Wager Amount (ETH)</Label>
          <Input
            id="wager"
            type="number"
            step="0.001"
            min="0.001"
            max="1.0"
            value={wagerAmount}
            onChange={(e) => setWagerAmount(e.target.value)}
            placeholder="0.001"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rounds">Max Rounds</Label>
          <Input
            id="rounds"
            type="number"
            min="3"
            max="10"
            value={maxRounds}
            onChange={(e) => setMaxRounds(e.target.value)}
            placeholder="5"
          />
        </div>

        <Button
          onClick={startBlockchainGame}
          disabled={isWritePending || isConfirming}
          className="w-full"
        >
          {isWritePending || isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isWritePending ? 'Submitting...' : 'Confirming...'}
            </>
          ) : (
            <>
              <Coins className="mr-2 h-4 w-4" />
              Start On-Chain Game ({wagerAmount} ETH)
            </>
          )}
        </Button>

        {isConfirmed && (
          <div className="text-center text-sm text-green-600">
            Game started successfully! 
            {hash && (
              <div className="mt-1 font-mono text-xs">
                Tx: {hash.slice(0, 10)}...{hash.slice(-8)}
              </div>
            )}
          </div>
        )}

        <div className="border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="gameId">Game ID (for claiming)</Label>
            <Input
              id="gameId"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter game ID to claim winnings"
            />
          </div>
          <Button
            onClick={claimWinnings}
            disabled={!gameId || isWritePending}
            variant="outline"
            className="w-full mt-2"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Claim Winnings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}