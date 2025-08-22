import { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAccount } from 'wagmi';
import { Pickaxe } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";
import caveBackground from "@/assets/cave-background.jpg";

export default function Auth() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home if wallet is connected
    if (isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);


  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${caveBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-background/30" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Pickaxe className="w-8 h-8 text-treasure-gold" />
              <h1 className="text-3xl font-bold bg-gradient-treasure bg-clip-text text-transparent">
                Cave Explorer
              </h1>
            </div>
            <h2 className="text-2xl font-bold">
              Connect Your Wallet
            </h2>
            <p className="text-muted-foreground">
              Connect your Abstract wallet to start exploring caves and earning on-chain rewards
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="flex justify-center">
            <WalletConnect />
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Connect your wallet to:</p>
            <ul className="mt-2 space-y-1">
              <li>• Play on-chain cave exploration games</li>
              <li>• Earn verifiable rewards on Abstract</li>
              <li>• Compete on the blockchain leaderboard</li>
              <li>• Own your achievements as NFTs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}