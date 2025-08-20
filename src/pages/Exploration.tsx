
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameHeader } from "@/components/GameHeader";
import { CaveProgressionFlash } from "@/components/CaveProgressionFlash";
import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";
import { AchievementNotification } from "@/components/AchievementNotification";
import { Skull, Crown } from "lucide-react";
import { StatsSidebar } from "@/components/StatsSidebar";
import { toast, useToast } from "@/hooks/use-toast";
import { useSessionStats, useOverallStats } from "@/hooks/useGameStats";
import { useAchievements } from "@/hooks/useAchievements";
import { getCaveImage } from "@/lib/cave-images";
import { supabase } from "@/integrations/supabase/client";

interface ExplorationState {
  credits: number;
  numOptions: number;
  round: number;
  maxRounds: number;
  score: number;
  sessionId: string;
}

export default function Exploration() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ExplorationState;
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showProgression, setShowProgression] = useState(false);
  const [progressionCompleteHandler, setProgressionCompleteHandler] = useState<() => void>(() => () => {});
  const [currentToastId, setCurrentToastId] = useState<string | null>(null);
  
  const { sessionStats, addSessionRounds, addSessionCredits } = useSessionStats();
  const { overallStats, addRoundsPlayed, addNetCredits, incrementGamesPlayed, refreshStats } = useOverallStats();
  const { achievements, addRoundsCleared, addGamesPlayed, addPathChoice, getNewlyUnlockedAchievements, syncWithDatabase } = useAchievements();
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
    
    // Sync achievements with database when component loads
    syncWithDatabase();
    
    // Track game start on first round only
    if (state.round === 1) {
      const previousAchievements = [...achievements];
      // Only track games for achievements, stats come from backend
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
    
  }, [state?.round, state?.numOptions]);

  if (!state) return null;

  const handleOptionSelect = async (optionIndex: number) => {
    if (isProcessing || selectedOption !== null) return;
    
    setSelectedOption(optionIndex);
    setIsProcessing(true);

    console.log("Starting exploration for option:", optionIndex);

    try {
      // Call backend to evaluate this round
      const { data, error } = await supabase.functions.invoke("play-round", {
        body: {
          session_id: state.sessionId,
          round_number: state.round,
          option_index: optionIndex,
        },
      });

      if (error) throw error;

      const isSuccessful = !!data?.isSuccessful;
      const treasureFound = Number(data?.treasureFound || 0);
      const totalScore = Number(data?.totalScore || state.score || 0);
      const nextRound = Number(data?.nextRound || state.round + 1);
      const gameCompleted = !!data?.gameCompleted;

      console.log("Exploration result:", { isSuccessful, treasureFound });

      if (!isSuccessful) {
        console.log("Navigating to game over");
        const creditsSpent = state.credits;
        const netCredits = totalScore - creditsSpent;
        const previousAchievements = [...achievements];

        // Only update achievements since stats are now handled by backend
        addRoundsCleared(1);

        const riskLevels = ['low', 'medium', 'high'];
        const riskLevel = riskLevels[optionIndex % 3];
        const pathType = riskLevel === 'low' ? 'safe' : riskLevel === 'medium' ? 'risky' : 'dangerous';
        addPathChoice(pathType as 'safe' | 'risky' | 'dangerous');

        setTimeout(() => {
          const newlyUnlocked = getNewlyUnlockedAchievements(previousAchievements);
          if (newlyUnlocked.length > 0) {
            setNewAchievements(newlyUnlocked);
          }
        }, 100);

        navigate("/game-over", {
          state: {
            success: false,
            round: state.round,
            totalScore: totalScore,
            reason: "You encountered a dangerous trap!",
          },
          replace: true,
        });
        return;
      }

      const toastResult = toast({
        title: "Safe Passage!",
        description: `You mined ${treasureFound.toFixed(treasureFound !== 0 && Math.abs(treasureFound) < 0.001 ? 5 : Math.abs(treasureFound) < 0.01 ? 4 : 3)} ETH and advanced safely!`,
        duration: 2000,
      });
      setCurrentToastId(toastResult.id);

      setShowProgression(true);

      const handleProgressionComplete = () => {
        setShowProgression(false);
        if (currentToastId) {
          dismiss(currentToastId);
          setCurrentToastId(null);
        }

        if (gameCompleted || nextRound > state.maxRounds) {
          console.log("Game completed! Navigating to victory");
          const creditsSpent = state.credits;
          const netCredits = totalScore - creditsSpent;
          const previousAchievements = [...achievements];

          // Refresh stats after game completion
          setTimeout(() => {
            refreshStats?.();
            syncWithDatabase();
          }, 1000);

          // Only update achievements since stats are now handled by backend
          addRoundsCleared(state.maxRounds);

          const riskLevels = ['low', 'medium', 'high'];
          const riskLevel = riskLevels[optionIndex % 3];
          const pathType = riskLevel === 'low' ? 'safe' : riskLevel === 'medium' ? 'risky' : 'dangerous';
          addPathChoice(pathType as 'safe' | 'risky' | 'dangerous');

          setTimeout(() => {
            const newlyUnlocked = getNewlyUnlockedAchievements(previousAchievements);
            if (newlyUnlocked.length > 0) {
              setNewAchievements(newlyUnlocked);
            }
          }, 100);

          navigate("/victory", {
            state: {
              success: true,
              totalScore: totalScore,
              roundsCompleted: state.maxRounds,
              initialCredits: state.credits,
            },
            replace: true,
          });
          return;
        }

        console.log("Continuing to next round");
        navigate("/exploration", {
          state: {
            ...state,
            numOptions: 3,
            round: nextRound,
            score: totalScore,
          },
          replace: true,
        });
      };

      setProgressionCompleteHandler(() => handleProgressionComplete);
    } catch (error) {
      console.error("Navigation error:", error);
      setIsProcessing(false);
      setSelectedOption(null);
      
      // If it's a connection error, provide recovery option
      if (error instanceof Error && error.message.includes("Edge Function returned a non-2xx")) {
        toast({
          title: "Connection Error",
          description: "Game state may be inconsistent. Returning to main menu in 3 seconds.",
          variant: "destructive",
          duration: 3000,
        });
        // Provide escape route to prevent getting stuck
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 3000);
      } else {
        toast({
          title: "Connection Error",
          description: "Could not process your choice. Please try again.",
          variant: "destructive",
        });
      }
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
                  <p className="text-lg font-bold">{state.round - 1} / {state.maxRounds}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Initial Bet</p>
                  <p className="text-lg font-bold">{state.credits.toFixed(state.credits !== 0 && Math.abs(state.credits) < 0.001 ? 5 : Math.abs(state.credits) < 0.01 ? 4 : 3)} ETH</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Winnings</p>
                  <p className="text-lg font-bold text-treasure-gold">{(state.score || 0).toFixed((state.score || 0) !== 0 && Math.abs(state.score || 0) < 0.001 ? 5 : Math.abs(state.score || 0) < 0.01 ? 4 : 3)} ETH</p>
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
