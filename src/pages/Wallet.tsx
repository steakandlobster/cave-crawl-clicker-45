import { WalletIntegration } from '@/components/WalletIntegration'

export default function Wallet() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Wallet & Smart Contracts
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Connect your wallet and interact with Cave Explorer smart contracts on Abstract blockchain
          </p>
        </div>
        
        <WalletIntegration />
      </div>
    </div>
  )
}