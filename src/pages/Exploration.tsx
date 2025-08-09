import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameHeader } from "@/components/GameHeader";
import { CaveProgressionFlash } from "@/components/CaveProgressionFlash";
import { ArrowLeft, Skull, Crown, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSessionStats, useOverallStats } from "@/hooks/useGameStats";
import { getCaveImage } from "@/lib/cave-images";

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
  const [useInsurance, setUseInsurance] = useState(false);
  const [showProgression, setShowProgression] = useState(false);
  const [usedImages, setUsedImages] = useState<string[]>([]);
  const [progressionCompleteHandler, setProgressionCompleteHandler] = useState<() => void>(() => () => {});
  
  const { sessionStats, addSessionRounds, addSessionCredits } = useSessionStats();
  const { overallStats, addRoundsPlayed, addNetCredits, incrementGamesPlayed } = useOverallStats();

  useEffect(() => {
    if (!state) {
      navigate("/");
      return;
    }
    
    // Track game start on first round only
    if (state.round === 1) {
      incrementGamesPlayed();
    }
  }, [state, navigate, incrementGamesPlayed]);

  // Reset component state when navigation state changes (fixes stuck exploring bug)
  useEffect(() => {
    setSelectedOption(null);
    setIsProcessing(false);
    setUsedImages([]); // Reset used images for each round
  }, [state.round, state.numOptions]);

  // This effect is removed as stats are updated only when game ends

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
        // Update stats for failed game
        const creditsSpent = state.credits;
        const netCredits = 0 - creditsSpent; // Loss = negative credits
        
        addSessionRounds(1);
        addSessionCredits(netCredits);
        addRoundsPlayed(1);
        addNetCredits(netCredits);
        
        // Bad choice - navigate to game over immediately
        navigate("/game-over", {
          state: {
            success: false,
            round: state.round,
            totalScore: 0,
            reason: useInsurance ? "Insurance protected you, but no treasure found!" : "You encountered a dangerous trap!"
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

      // Show progression flash before continuing
      setShowProgression(true);
      
      // Handle game completion or next round after progression flash
      const handleProgressionComplete = () => {
        setShowProgression(false);
        
        if (newRound > state.maxRounds) {
        console.log("Game completed! Navigating to victory");
        // Calculate net credits for completed game
        const creditsSpent = state.credits; // Assuming initial credits were spent
        const netCredits = newScore - creditsSpent;
        
        // Update stats for completed game
        addSessionRounds(state.maxRounds);
        addSessionCredits(netCredits);
        addRoundsPlayed(state.maxRounds);
        addNetCredits(netCredits);
        
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
      };
      
      // Store the completion handler
      setProgressionCompleteHandler(() => handleProgressionComplete);

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

            {/* Insurance Option */}
            <div className="flex justify-center mb-6">
              <Button
                variant={useInsurance ? "treasure" : "cave"}
                size="lg"
                onClick={() => setUseInsurance(!useInsurance)}
                className="flex items-center gap-2"
                disabled={isProcessing}
              >
                <Shield className="w-5 h-5" />
                {useInsurance ? "Insurance Active" : "Purchase Insurance"}
              </Button>
            </div>

            {/* Cave Options - Rectangular Layout */}
            <div className="space-y-4 mb-8">
              {Array.from({ length: state.numOptions }, (_, index) => {
                const riskLevels = ['low', 'medium', 'high'];
                const riskLevel = riskLevels[index % 3] as 'low' | 'medium' | 'high';
                
                // Get unique image for this option, avoiding duplicates in this round
                const imageUrl = getCaveImage(riskLevel, usedImages);
                
                // Track this image as used
                if (!usedImages.includes(imageUrl)) {
                  setUsedImages(prev => [...prev, imageUrl]);
                }
                
                const getRiskText = (risk: string) => {
                  switch (risk) {
                    case 'low': return 'Safe Path';
                    case 'medium': return 'Risky Path';
                    case 'high': return 'Dangerous Path';
                    default: return 'Unknown Path';
                  }
                };
                const getRiskColor = (risk: string) => {
                  switch (risk) {
                    case 'low': return 'text-green-400';
                    case 'medium': return 'text-yellow-400';
                    case 'high': return 'text-red-400';
                    default: return 'text-white';
                  }
                };

                return (
                  <Card
                    key={index}
                    className={`
                      relative overflow-hidden cursor-pointer group transition-all duration-300 h-32
                      ${selectedOption === index ? "ring-2 ring-primary scale-[1.02]" : "hover:scale-[1.02] hover:shadow-glow"}
                      ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                    onClick={() => handleOptionSelect(index)}
                  >
                    <div className="w-full h-full relative flex">
                      <div className="w-48 h-full">
                        <img
                          src={imageUrl}
                          alt={`${getRiskText(riskLevel)} - Cave passage ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex items-center justify-center bg-gradient-to-r from-transparent to-card/90">
                        <div className="text-center text-white px-6">
                          {selectedOption === index && isProcessing ? (
                            <div className="animate-glow-pulse">
                              <Crown className="w-8 h-8 mx-auto mb-2 text-treasure-gold" />
                              <p className="text-lg font-bold">Exploring...</p>
                            </div>
                          ) : (
                            <>
                              <p className="text-xl font-bold mb-1">Path {index + 1}</p>
                              <p className={`text-sm font-semibold ${getRiskColor(riskLevel)}`}>
                                {getRiskText(riskLevel)}
                              </p>
                              <p className="text-xs opacity-80 mt-1">Click to venture forth</p>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {!isProcessing && (
                        <div className="absolute inset-0 bg-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Current Round Stats - Removed score */}
            <Card className="p-4 bg-secondary/30 border-border/50 backdrop-blur-sm mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Round</p>
                  <p className="text-lg font-bold">{state.round} / {state.maxRounds}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits</p>
                  <p className="text-lg font-bold">{state.credits}</p>
                </div>
              </div>
            </Card>

            {/* Warning */}
            <Card className="p-4 bg-red-500/10 border-red-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-center justify-center">
                <Skull className="w-5 h-5 text-red-400" />
                <p className="text-red-400 font-medium text-sm">
                  Warning: Some paths may contain deadly traps. Choose wisely!
                </p>
                <Skull className="w-5 h-5 text-red-400" />
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Cave Progression Flash */}
      {showProgression && (
        <CaveProgressionFlash 
          onComplete={progressionCompleteHandler}
        />
      )}
    </div>
  );
}