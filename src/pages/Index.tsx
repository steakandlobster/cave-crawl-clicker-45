
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameHeader } from "@/components/GameHeader";
import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";
import { StatsSidebar } from "@/components/StatsSidebar";
import { SocialSharing } from "@/components/SocialSharing";
import { useSessionStats, useOverallStats } from "@/hooks/useGameStats";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementNotification } from "@/components/AchievementNotification";
import { Pickaxe, Coins, Map, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  
  const { sessionStats, resetSession } = useSessionStats();
  const { overallStats } = useOverallStats();
  const { achievements, updateDailyStreak } = useAchievements();

  // Update daily streak when visiting the home page
  useEffect(() => {
    updateDailyStreak();
  }, [updateDailyStreak]);

  const presetAmounts = [0.001, 0.01, 0.1];

  const handleStartGame = async () => {
    const credits = selectedAmount || parseFloat(customAmount);
    
    if (!credits || credits < 0.001) {
      toast({
        title: "Invalid Amount",
        description: "Please select at least 0.001 ETH to start exploring!",
        variant: "destructive",
      });
      return;
    }

    if (credits > 0.1) {
      toast({
        title: "Amount Too High",
        description: "Maximum ETH allowed is 0.1.",
        variant: "destructive",
      });
      return;
    }

    // Don't reset session stats - they should persist across games
    
    // TODO: Replace with actual backend call
    // For now, simulate backend response
    try {
      // Simulated backend response
      const numOptions = Math.floor(Math.random() * 3) + 2; // 2-4 options
      
      navigate("/exploration", { 
        state: { 
          credits, 
          numOptions,
          round: 1,
          maxRounds: 6,
          score: 0 // Start with 0 winnings
        } 
      });
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Could not connect to game server. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAmountForButton = () => {
    return selectedAmount || parseFloat(customAmount) || 0;
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
        
        <div className="container mx-auto px-4 py-16 relative z-10 ml-64">
          {/* Global Leaderboard */}
          <div className="fixed top-4 right-4 z-30">
            <GlobalLeaderboard />
          </div>
          
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4 text-treasure-gold">
                Cave Explorer
              </h1>
              <p className="text-xl text-muted-foreground mb-2">
                Venture into mysterious caves to discover hidden ETH treasures!
              </p>
              <p className="text-sm text-muted-foreground">
                You must safely navigate 6 passages to successfully escape the cave. Win ETH treasures by escaping.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card className="p-8 shadow-deep">
                <div className="space-y-6">
                  <div>
                    <Label className="text-lg font-semibold mb-4 block">
                      Select Your ETH Wager
                    </Label>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {presetAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant={selectedAmount === amount ? "treasure" : "cave"}
                          size="lg"
                          onClick={() => {
                            setSelectedAmount(amount);
                            setCustomAmount("");
                          }}
                          className="h-20 flex flex-col"
                        >
                          <Coins className="w-6 h-6 mb-1" />
                          <span className="text-lg font-bold">{amount}</span>
                          <span className="text-xs opacity-80">ETH</span>
                        </Button>
                      ))}
                    </div>

                    <div className="relative">
                      <Label htmlFor="custom-amount" className="text-sm text-muted-foreground">
                        Or enter a custom amount:
                      </Label>
                      <Input
                        id="custom-amount"
                        type="number"
                        placeholder="Enter ETH (0.001-0.1)"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedAmount(null);
                        }}
                        min={0.001}
                        max={0.1}
                        step={0.001}
                        className="mt-2 text-center text-lg"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="treasure"
                      size="xl"
                      onClick={handleStartGame}
                      disabled={!getAmountForButton()}
                      className="w-full"
                    >
                      <Map className="w-5 h-5 mr-2" />
                      Start Cave Exploration
                      {getAmountForButton() > 0 && (
                        <span className="ml-2">({getAmountForButton()} ETH)</span>
                      )}
                    </Button>
                    
                    {/* Refer Friends Button */}
                    <div className="mt-4">
                      <SocialSharing 
                        totalScore={0}
                        roundsCompleted={0}
                        isVictory={false}
                        referralMode={true}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
