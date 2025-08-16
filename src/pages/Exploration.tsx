
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameHeader } from "@/components/GameHeader";
import { CaveProgressionFlash } from "@/components/CaveProgressionFlash";
import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";
import { AchievementNotification } from "@/components/AchievementNotification";
import { Skull, Crown, Shield } from "lucide-react";
import { StatsSidebar } from "@/components/StatsSidebar";
import { toast, useToast } from "@/hooks/use-toast";
import { useSessionStats, useOverallStats } from "@/hooks/useGameStats";
import { useAchievements } from "@/hooks/useAchievements";
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
  const [progressionCompleteHandler, setProgressionCompleteHandler] = useState<() => void>(() => () => {});
  const [currentToastId, setCurrentToastId] = useState<string | null>(null);
  
  const { sessionStats, addSessionRounds, addSessionCredits } = useSessionStats();
  const { overallStats, addRoundsPlayed, addNetCredits, incrementGamesPlayed } = useOverallStats();
  const { achievements, addRoundsCleared, addGamesPlayed, addPathChoice, getNewlyUnlockedAchievements } = useAchievements();
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const { dismiss } = useToast();

  // Memoize cave images to prevent them from changing during processing
  const stableCaveImages = useMemo(() => {
    if (!state) return [];
    
    const images: string[] = [];
    const usedInThisRound: string[] = [];
    
    // Always generate 3 options: safe, risky, dangerous
    for (let i = 0; i < 3; i++) {
      const riskLevels = ['low', 'medium', 'high'];
      const riskLevel = riskLevels[i % 3] as 'low' | 'medium' | 'high';
      
      // Get unique image for this option, avoiding duplicates in this round
      const imageUrl = getCaveImage(riskLevel, usedInThisRound);
      images.push(imageUrl);
      usedInThisRound.push(imageUrl);
    }
    
    return images;
  }, [state?.round]); // Only re-generate when round changes

  // Stable reference to incrementGamesPlayed to prevent infinite re-renders
  const stableIncrementGamesPlayed = useCallback(() => {
    incrementGamesPlayed();
  }, []);

  useEffect(() => {
    if (!state) {
      navigate("/");
      return;
    }
    
    // Track game start on first round only
    if (state.round === 1) {
      const previousAchievements = [...achievements];
      stableIncrementGamesPlayed();
      addGamesPlayed(1);
      
      // Check for new achievements
      setTimeout(() => {
        const newlyUnlocked = getNewlyUnlockedAchievements(previousAchievements);
        if (newlyUnlocked.length > 0) {
          setNewAchievements(newlyUnlocked);
        }
      }, 100);
    }
  }, [state?.round, navigate]); // Remove incrementGamesPlayed from dependencies

  // Reset component state when navigation state changes (fixes stuck exploring bug)
  useEffect(() => {
    if (!state) return;
    
    setSelectedOption(null);
    setIsProcessing(false);
    setUseInsurance(false); // Reset insurance each round
  }, [state?.round, state?.numOptions]);

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
      const treasureFound = isSuccessful ? (Math.random() * 0.05 + 0.025) : 0; // 0.025-0.075 ETH
      
      console.log("Exploration result:", { isSuccessful, treasureFound });
      
      if (!isSuccessful) {
        console.log("Navigating to game over");
        // Update stats for failed game
        const creditsSpent = state.credits;
        const netCredits = (state.score || 0) - creditsSpent; // Current winnings - initial bet
        const previousAchievements = [...achievements];
        
        addSessionRounds(1);
        addSessionCredits(netCredits);
        addRoundsPlayed(1);
        addNetCredits(netCredits);
        addRoundsCleared(1);
        
        // Get risk level for path choice tracking
        const riskLevels = ['low', 'medium', 'high'];
        const riskLevel = riskLevels[selectedOption % 3];
        const pathType = riskLevel === 'low' ? 'safe' : riskLevel === 'medium' ? 'risky' : 'dangerous';
        addPathChoice(pathType as 'safe' | 'risky' | 'dangerous');
        
        // Check for new achievements
        setTimeout(() => {
          const newlyUnlocked = getNewlyUnlockedAchievements(previousAchievements);
          if (newlyUnlocked.length > 0) {
            setNewAchievements(newlyUnlocked);
          }
        }, 100);
        
        // Bad choice - navigate to game over immediately
        navigate("/game-over", {
          state: {
            success: false,
            round: state.round,
            totalScore: state.score || 0,
            reason: useInsurance ? "Insurance protected you, but no treasure found!" : "You encountered a dangerous trap!"
          },
          replace: true
        });
        return;
      }

      const newScore = (state.score || 0) + treasureFound;
      const newRound = state.round + 1;

      console.log("Success! New score:", newScore, "New round:", newRound);

      const toastResult = toast({
        title: "Safe Passage!",
        description: `You found ${treasureFound.toFixed(3)} ETH and advanced safely!`,
        duration: 2000, // 2 seconds
      });
      setCurrentToastId(toastResult.id);

      // Show progression flash before continuing
      setShowProgression(true);
      
      // Handle game completion or next round after progression flash
      const handleProgressionComplete = () => {
        setShowProgression(false);
        
        // Clear the toast when progression completes
        if (currentToastId) {
          dismiss(currentToastId);
          setCurrentToastId(null);
        }
        
        if (newRound > state.maxRounds) {
        console.log("Game completed! Navigating to victory");
        // Calculate net credits for completed game
        const creditsSpent = state.credits; // Initial bet
        const netCredits = newScore - creditsSpent;
        const previousAchievements = [...achievements];
        
        // Update stats for completed game
        addSessionRounds(state.maxRounds);
        addSessionCredits(netCredits);
        addRoundsPlayed(state.maxRounds);
        addNetCredits(netCredits);
        addRoundsCleared(1);
        
        // Get risk level for path choice tracking
        const riskLevels = ['low', 'medium', 'high'];
        const riskLevel = riskLevels[selectedOption! % 3];
        const pathType = riskLevel === 'low' ? 'safe' : riskLevel === 'medium' ? 'risky' : 'dangerous';
        addPathChoice(pathType as 'safe' | 'risky' | 'dangerous');
        
        // Check for new achievements
        setTimeout(() => {
          const newlyUnlocked = getNewlyUnlockedAchievements(previousAchievements);
          if (newlyUnlocked.length > 0) {
            setNewAchievements(newlyUnlocked);
          }
        }, 100);
        
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
        navigate("/exploration", {
          state: {
            ...state,
            numOptions: 3, // Always 3 options: safe, risky, dangerous
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
      <AchievementNotification 
        achievements={newAchievements}
        onDismiss={() => setNewAchievements([])}
      />
      
      {/* Stats Sidebar */}
      <StatsSidebar 
        sessionStats={sessionStats}
        overallStats={overallStats}
      />
      
      <div className="relative z-10">
        <GameHeader />
        
        <div className="container mx-auto px-4 pt-24 pb-8 relative z-10 ml-96">
          {/* Global Leaderboard */}
          <div className="fixed top-4 right-4 z-30">
            <GlobalLeaderboard />
          </div>
          
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              {state.round > 1 && (
                <h1 className="text-4xl font-bold mb-4 text-treasure-gold">
                  Mined {state.round - 1} of {state.maxRounds} passages
                </h1>
              )}
              <p className="text-lg text-muted-foreground mb-2">
                Choose your path carefully! One wrong choice could cause a cave in and end your expedition.
              </p>
              <p className="text-sm text-muted-foreground">
                3 mine paths await your decision
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
                {useInsurance ? "Insurance Active (This Round)" : "Purchase Insurance (This Round Only)"}
              </Button>
            </div>

            {/* Cave Options - Rectangular Layout */}
            <div className="space-y-4 mb-8">
              {Array.from({ length: 3 }, (_, index) => {
                const riskLevels = ['low', 'medium', 'high'];
                const riskLevel = riskLevels[index % 3] as 'low' | 'medium' | 'high';
                
                // Use stable image from memoized array
                const imageUrl = stableCaveImages[index];
                
                const getRiskText = (risk: string) => {
                  switch (risk) {
                    case 'low': return 'Safe Mine Path';
                    case 'medium': return 'Risky Mine Path';
                    case 'high': return 'Dangerous Mine Path';
                    default: return 'Unknown Mine Path';
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
                              <p className="text-lg font-bold">Mining...</p>
                            </div>
                           ) : (
                            <>
                              <p className="text-xl font-bold mb-1">Mine Path {index + 1}</p>
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

            {/* Current Round Stats */}
            <Card className="p-4 bg-secondary/30 border-border/50 backdrop-blur-sm mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Passages</p>
                  <p className="text-lg font-bold">{state.round} / {state.maxRounds}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Initial Bet</p>
                  <p className="text-lg font-bold">{state.credits.toFixed(3)} ETH</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Winnings</p>
                  <p className="text-lg font-bold text-treasure-gold">{(state.score || 0).toFixed(3)} ETH</p>
                </div>
              </div>
            </Card>

            {/* Warning */}
            <Card className="p-4 bg-red-500/10 border-red-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-center justify-center">
                <Skull className="w-5 h-5 text-red-400" />
                <p className="text-red-400 font-medium text-sm">
                  Warning: Mining some paths may cause a cave in. Choose wisely!
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
