import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skull, RotateCcw, Coins } from "lucide-react";
import caveCollapse from "@/assets/cave-collapse.jpg";
import { useNavigate, useLocation } from "react-router-dom";
import { GameHeader } from "@/components/GameHeader";
import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";
import { StatsSidebar } from "@/components/StatsSidebar";
import { SocialSharing } from "@/components/SocialSharing";
import { useSessionStats, useOverallStats } from "@/hooks/useGameStats";

interface GameOverState {
  success: boolean;
  round: number;
  totalScore: number;
  reason: string;
}

export default function GameOver() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as GameOverState;
  const { sessionStats } = useSessionStats();
  const { overallStats } = useOverallStats();

  if (!state) {
    navigate("/");
    return null;
  }

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
        
        <div className="min-h-screen flex items-center justify-center p-4 ml-64">
          {/* Global Leaderboard */}
          <div className="fixed top-4 right-4 z-30">
            <GlobalLeaderboard />
          </div>
          
          {/* Cave collapse background */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${caveCollapse})` }}
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-background/80" />
      
      <Card className="max-w-md w-full p-8 text-center animate-slide-in shadow-deep relative z-10 bg-card/95 backdrop-blur-sm">
            <div className="mb-6">
              <Skull className="w-20 h-20 mx-auto mb-4 text-red-500 animate-glow-pulse" />
              <h1 className="text-4xl font-bold mb-2 text-red-500">Cave Collapse!</h1>
              <p className="text-foreground font-medium">Your exploration came to an end...</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                <p className="text-sm text-muted-foreground mb-1">What happened?</p>
                <p className="font-medium">{state.reason}</p>
              </div>

              <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-treasure-gold" />
                  <span className="font-semibold">Final Treasure</span>
                </div>
                <p className="text-2xl font-bold text-treasure-gold">{state.totalScore.toFixed(3)} ETH</p>
              </div>

              <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                <p className="text-sm text-muted-foreground mb-1">Passages Explored</p>
                <p className="text-xl font-bold text-blue-400">{state.round} passages</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <SocialSharing 
                totalScore={state.totalScore}
                roundsCompleted={state.round}
                isVictory={false}
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
                Every explorer faces danger. Will you venture forth again? 💀
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}