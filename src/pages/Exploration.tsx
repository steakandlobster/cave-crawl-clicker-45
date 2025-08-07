import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameHeader } from "@/components/GameHeader";
import { ArrowLeft, Skull, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSessionStats, useOverallStats } from "@/hooks/useGameStats";
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
  
  const { sessionStats, updateSessionRounds, updateSessionCredits } = useSessionStats();
  const { overallStats, addRoundsPlayed, addCreditsWon } = useOverallStats();

  useEffect(() => {
    if (!state) {
      navigate("/");
      return;
    }
  }, [state, navigate]);

  // Reset component state when navigation state changes (fixes stuck exploring bug)
  useEffect(() => {
    setSelectedOption(null);
    setIsProcessing(false);
  }, [state.round, state.numOptions]);

  // Update session stats based on current state
  useEffect(() => {
    if (state) {
      updateSessionRounds(state.round);
      updateSessionCredits(state.credits);
    }
  }, [state, updateSessionRounds, updateSessionCredits]);

  if (!state) return null;

  const handleOptionSelect = async (optionIndex: number) => {
    if (isProcessing || selectedOption !== null) return;
    
    setSelectedOption(optionIndex);
    setIsProcessing(true);

    console.log("Starting exploration for option:", optionIndex);

    // TODO: Replace with actual backend call
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const isSuccessful = Math.random() > 0.3; // 70% success chance
      const treasureFound = isSuccessful ? Math.floor(Math.random() * 50) + 25 : 0;
      
      console.log("Exploration result:", { isSuccessful, treasureFound });
      
      if (!isSuccessful) {
        console.log("Navigating to game over");
        // Bad choice - navigate to game over immediately
        navigate("/game-over", {
          state: {
            success: false,
            round: state.round,
            totalScore: (state.score || 0),
            reason: "You encountered a dangerous trap!"
          },
          replace: true
        });
        return;
      }

      const newScore = (state.score || 0) + treasureFound;
      const newRound = state.round + 1;

      console.log("Success! New score:", newScore, "New round:", newRound);

      toast({
        title: "Safe Passage!",
        description: `You found ${treasureFound} gold pieces and advanced safely!`,
      });

      if (newRound > state.maxRounds) {
        console.log("Game completed! Navigating to victory");
        // Update overall stats for completed game
        addRoundsPlayed(state.maxRounds);
        addCreditsWon(newScore);
        
        // Successfully completed all rounds - navigate immediately
        navigate("/victory", {
          state: {
            success: true,
            totalScore: newScore,
            roundsCompleted: state.maxRounds,
            initialCredits: state.credits
          },
          replace: true
        });
        return;
      }

      // Continue to next round - navigate immediately without delay
      console.log("Continuing to next round");
      const nextNumOptions = Math.floor(Math.random() * 3) + 2; // 2-4 options
      navigate("/exploration", {
        state: {
          ...state,
          numOptions: nextNumOptions,
          round: newRound,
          score: newScore
        },
        replace: true
      });

    } catch (error) {
      console.error("Navigation error:", error);
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
    <div className="min-h-screen cave-background">
      <div className="relative z-10">
        <GameHeader
          credits={state.credits}
          rounds={state.round}
          score={state.score || 0}
          sessionStats={sessionStats}
          overallStats={overallStats}
        />
        
        <div className="container mx-auto px-4 py-8 relative z-10">
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

            {/* Cave Options - Single Row Layout */}
            <div className={`flex justify-center gap-6 mb-8 ${
              state.numOptions === 2 ? 'max-w-2xl mx-auto' : 
              state.numOptions === 3 ? 'max-w-3xl mx-auto' : 
              'max-w-4xl mx-auto'
            }`}>
              {Array.from({ length: state.numOptions }, (_, index) => (
                <Card
                  key={index}
                  className={`
                    relative overflow-hidden cursor-pointer group transition-all duration-300 w-48 h-48
                    ${selectedOption === index ? "ring-2 ring-primary scale-105" : "hover:scale-105 hover:shadow-glow"}
                    ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  onClick={() => handleOptionSelect(index)}
                >
                  <div className="w-full h-full relative">
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
            <Card className="p-6 bg-red-500/10 border-red-500/20 backdrop-blur-sm">
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
    </div>
  );
}