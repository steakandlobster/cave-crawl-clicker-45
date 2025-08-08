import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skull, RotateCcw } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import caveCollapse from "@/assets/cave-collapse.jpg";

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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Cave collapse background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${caveCollapse})` }}
      />
      
      {/* Falling rocks animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-cave-stone rounded-full animate-bounce opacity-80"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1.5 + Math.random() * 2}s`,
              top: '-20px',
              transform: `translateY(${100 + Math.random() * 50}vh)`,
            }}
          />
        ))}
      </div>
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-background/70" />
      
      <Card className="max-w-md w-full p-8 text-center animate-slide-in shadow-deep relative z-10 bg-card/95 backdrop-blur-sm">
        <div className="mb-6">
          <Skull className="w-20 h-20 mx-auto mb-4 text-destructive animate-glow-pulse" />
          <h1 className="text-4xl font-bold mb-2 text-destructive">Cave-In!</h1>
          <p className="text-foreground">{state.reason}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <p className="text-sm text-muted-foreground mb-1">Exploration ended at</p>
            <p className="text-2xl font-bold text-destructive">Round {state.round}</p>
          </div>

          <div className="bg-secondary/50 p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-1">Final Score</p>
            <p className="text-xl font-bold text-treasure-gold">0 Gold</p>
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