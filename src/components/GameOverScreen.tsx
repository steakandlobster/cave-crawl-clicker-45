import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Coins, RotateCcw } from "lucide-react";

interface GameOverScreenProps {
  totalScore: number;
  treasuresFound: number;
  roundsPlayed: number;
  initialCredits: number;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export const GameOverScreen = ({
  totalScore,
  treasuresFound,
  roundsPlayed,
  initialCredits,
  onPlayAgain,
  onReturnHome,
}: GameOverScreenProps) => {
  const profitLoss = totalScore - initialCredits;
  const isProfit = profitLoss > 0;

  return (
    <div className="min-h-screen bg-gradient-cave flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center animate-slide-in shadow-deep">
        <div className="mb-6">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-treasure-gold animate-glow-pulse" />
          <h1 className="text-3xl font-bold mb-2">Cave Exploration Complete!</h1>
          <p className="text-muted-foreground">Your treasure hunting session has ended</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-secondary/50 p-4 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-treasure-gold" />
              <span className="font-semibold">Final Score</span>
            </div>
            <p className="text-2xl font-bold text-treasure-gold">{totalScore} Gold</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Treasures Found</p>
              <p className="text-xl font-bold">{treasuresFound}</p>
            </div>
            <div className="bg-card p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Caves Explored</p>
              <p className="text-xl font-bold">{roundsPlayed}</p>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${isProfit ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <p className="text-sm text-muted-foreground">Net Result</p>
            <p className={`text-xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}{profitLoss} Gold
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (Started with {initialCredits} credits)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="treasure"
            size="lg"
            onClick={onPlayAgain}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Explore Again
          </Button>
          <Button
            variant="cave"
            size="lg"
            onClick={onReturnHome}
            className="w-full"
          >
            Return to Base Camp
          </Button>
        </div>
      </Card>
    </div>
  );
};