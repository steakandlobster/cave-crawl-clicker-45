import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Trophy, Coins, RotateCcw } from "lucide-react";
import caveOpening from "@/assets/cave-opening.jpg";
import { useNavigate, useLocation } from "react-router-dom";
import { GameHeader } from "@/components/GameHeader";
import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";
import { StatsSidebar } from "@/components/StatsSidebar";
import { SocialSharing } from "@/components/SocialSharing";
import { useSessionStats, useOverallStats } from "@/hooks/useGameStats";

interface VictoryState {
  success: boolean;
  totalScore: number;
  roundsCompleted: number;
  initialCredits: number;
}

export default function Victory() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as VictoryState;
  const { sessionStats } = useSessionStats();
  const { overallStats } = useOverallStats();

  if (!state) {
    navigate("/");
    return null;
  }

  const netGain = state.totalScore - state.initialCredits;
  const isProfit = netGain > 0;

  const handlePlayAgain = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Stats Sidebar */}
      <StatsSidebar 
        sessionStats={sessionStats}
        overallStats={overallStats}
      />
      
      <div className="relative z-10">
        <GameHeader />
        
        <div className="min-h-screen flex items-center justify-center p-4 pt-24 ml-96">
          
          {/* Cave opening background */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${caveOpening})` }}
          />
          {/* Bright overlay for readability */}
          <div className="absolute inset-0 bg-background/30" />
      
      <Card className="max-w-md w-full p-8 text-center animate-slide-in shadow-treasure relative z-10 bg-card/95 backdrop-blur-sm">
        <div className="mb-6">
          <Crown className="w-20 h-20 mx-auto mb-4 text-treasure-gold animate-glow-pulse" />
          <h1 className="text-4xl font-bold mb-2 text-treasure-gold">Escaped!</h1>
          <p className="text-foreground font-medium">You have successfully escaped the cave!</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-green-400">Mission Complete</span>
            </div>
            <p className="text-lg font-bold">{state.roundsCompleted} Rounds Survived</p>
          </div>

            <div className="bg-secondary/50 p-4 rounded-lg border border-border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="w-5 h-5 text-treasure-gold" />
                <span className="font-semibold">Total ETH mined</span>
              </div>
              <p className="text-2xl font-bold text-treasure-gold">{state.totalScore.toFixed(state.totalScore !== 0 && Math.abs(state.totalScore) < 0.001 ? 5 : Math.abs(state.totalScore) < 0.01 ? 4 : 3)} ETH</p>
            </div>

            <div className={`p-4 rounded-lg border ${isProfit ? 'bg-green-500/20 border-green-500/30' : 'bg-yellow-500/20 border-yellow-500/30'}`}>
              <p className="text-sm text-muted-foreground mb-1">Net Result</p>
              <p className={`text-xl font-bold ${isProfit ? 'text-green-400' : 'text-yellow-400'}`}>
                {isProfit ? '+' : ''}{netGain.toFixed(netGain !== 0 && Math.abs(netGain) < 0.001 ? 5 : Math.abs(netGain) < 0.01 ? 4 : 3)} ETH
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (Started with {state.initialCredits.toFixed(state.initialCredits !== 0 && Math.abs(state.initialCredits) < 0.001 ? 5 : Math.abs(state.initialCredits) < 0.01 ? 4 : 3)} ETH)
              </p>
            </div>
        </div>

        <div className="space-y-3 mb-4">
          <SocialSharing 
            totalScore={state.totalScore}
            roundsCompleted={state.roundsCompleted}
            isVictory={true}
          />
          
          <Button
            variant="treasure"
            size="lg"
            onClick={handlePlayAgain}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Congratulations, Master Cave Explorer! 🏆
          </p>
        </div>
      </Card>
        </div>
      </div>
    </div>
  );
}