import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameHeader } from "@/components/GameHeader";
import { ArrowLeft, Skull, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import cave1 from "@/assets/cave-1.jpg";

interface ExplorationState {
  credits: number;
  numOptions: number;
  round: number;
  maxRounds: number;
  score?: number;
}

export default function Exploration() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ExplorationState;
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!state) {
      navigate("/");
      return;
    }
  }, [state, navigate]);

  if (!state) return null;

  const handleOptionSelect = async (optionIndex: number) => {
    if (isProcessing) return;
    
    setSelectedOption(optionIndex);
    setIsProcessing(true);

    // TODO: Replace with actual backend call
    try {
      // const response = await fetch('/api/make-choice', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     optionIndex, 
      //     round: state.round,
      //     credits: state.credits 
      //   })
      // });
      // const result = await response.json();

      // Simulated backend response
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
      const isSuccessful = Math.random() > 0.3; // 70% success chance
      const treasureFound = isSuccessful ? Math.floor(Math.random() * 50) + 25 : 0;
      
      if (!isSuccessful) {
        // Bad choice - game over
        navigate("/game-over", {
          state: {
            success: false,
            round: state.round,
            totalScore: (state.score || 0) + treasureFound,
            reason: "You encountered a dangerous trap!"
          }
        });
        return;
      }

      const newScore = (state.score || 0) + treasureFound;
      const newRound = state.round + 1;

      toast({
        title: "Safe Passage!",
        description: `You found ${treasureFound} gold pieces and advanced safely!`,
      });

      if (newRound > state.maxRounds) {
        // Successfully completed all rounds
        navigate("/victory", {
          state: {
            success: true,
            totalScore: newScore,
            roundsCompleted: state.maxRounds,
            initialCredits: state.credits
          }
        });
        return;
      }

      // Continue to next round
      setTimeout(() => {
        const nextNumOptions = Math.floor(Math.random() * 6) + 3; // 3-8 options
        navigate("/exploration", {
          state: {
            ...state,
            numOptions: nextNumOptions,
            round: newRound,
            score: newScore
          }
        });
      }, 2000);

    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Could not process your choice. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setSelectedOption(null);
    }
  };

  const handleReturnHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-cave">
      <GameHeader
        credits={state.credits}
        rounds={state.round}
        score={state.score || 0}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Button
              variant="cave"
              size="sm"
              onClick={handleReturnHome}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Base Camp
            </Button>
            
            <h1 className="text-4xl font-bold mb-4 text-treasure-gold">
              Round {state.round} of {state.maxRounds}
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              Choose your path carefully! One wrong choice could end your exploration.
            </p>
            <p className="text-sm text-muted-foreground">
              {state.numOptions} cave passages await your decision
            </p>
          </div>

          {/* Cave Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: state.numOptions }, (_, index) => (
              <Card
                key={index}
                className={`
                  relative overflow-hidden cursor-pointer group transition-all duration-300
                  ${selectedOption === index ? "ring-2 ring-primary scale-105" : "hover:scale-105 hover:shadow-glow"}
                  ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
                `}
                onClick={() => handleOptionSelect(index)}
              >
                <div className="aspect-square relative">
                  <img
                    src={cave1}
                    alt={`Cave passage ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      {selectedOption === index && isProcessing ? (
                        <div className="animate-glow-pulse">
                          <Crown className="w-12 h-12 mx-auto mb-2 text-treasure-gold" />
                          <p className="text-lg font-bold">Exploring...</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold mb-2">Path {index + 1}</p>
                          <p className="text-sm opacity-80">Click to venture forth</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {!isProcessing && (
                    <div className="absolute inset-0 bg-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Warning */}
          <Card className="p-6 bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-3 text-center justify-center">
              <Skull className="w-6 h-6 text-red-400" />
              <p className="text-red-400 font-semibold">
                Warning: Some paths may contain deadly traps. Choose wisely!
              </p>
              <Skull className="w-6 h-6 text-red-400" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}