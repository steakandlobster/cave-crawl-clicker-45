import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skull, RotateCcw, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

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

  if (!state) {
    navigate("/");
    return null;
  }

  const handlePlayAgain = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-cave flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center animate-slide-in shadow-deep">
        <div className="mb-6">
          <Skull className="w-20 h-20 mx-auto mb-4 text-red-400 animate-glow-pulse" />
          <h1 className="text-4xl font-bold mb-2 text-red-400">Game Over!</h1>
          <p className="text-muted-foreground">{state.reason}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            <p className="text-sm text-muted-foreground mb-1">Exploration ended at</p>
            <p className="text-2xl font-bold text-red-400">Round {state.round}</p>
          </div>

          <div className="bg-secondary/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Final Score</p>
            <p className="text-xl font-bold text-treasure-gold">{state.totalScore} Gold</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="treasure"
            size="lg"
            onClick={handlePlayAgain}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            variant="cave"
            size="lg"
            onClick={() => navigate("/")}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Better luck next time, brave explorer!
          </p>
        </div>
      </Card>
    </div>
  );
}