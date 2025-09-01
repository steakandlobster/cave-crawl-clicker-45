import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameHeader } from "@/components/GameHeader";
import { StatsSidebar } from "@/components/StatsSidebar";
import { SocialSharing } from "@/components/SocialSharing";
import { useSessionStats, useOverallStats } from "@/hooks/useGameStats";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementNotification } from "@/components/AchievementNotification";
import { useSiweAuth } from "@/contexts/SiweAuthContext";
import { useAccount } from "wagmi";
import { Coins, Map } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { isAuthenticated } = useSiweAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(0.001);
  const [customAmount, setCustomAmount] = useState("");
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  
  // Add Web3 mode toggle for testing
  const [isWeb3Mode, setIsWeb3Mode] = useState(false);
  
  const { sessionStats, sessionId } = useSessionStats();
  const { overallStats } = useOverallStats();
  const { achievements, updateDailyStreak } = useAchievements();

  // Update daily streak when visiting the home page
  useEffect(() => {
    if (isAuthenticated) {
      updateDailyStreak();
    }
  }, [updateDailyStreak, isAuthenticated]);

  const presetAmounts = [0.001, 0.01, 0.1];

  const handleStartGame = async () => {
    if (!isAuthenticated || !address) {
      toast({
        title: "Authentication required",
        description: "Please complete SIWE authentication to start playing.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

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

    try {
      console.log("Starting game with wallet address:", address);

      // Prepare request data based on mode
      const requestData = {
        amount_wagered: credits,
        max_rounds: 6,
        client_seed: String(Date.now()),
        session_id: sessionId,
        wallet_address: address,
        game_mode: isWeb3Mode ? "web3" : "traditional",
        // Web3 mode will need additional params later
        ...(isWeb3Mode && {
          bet_id: null, // Will be generated after contract interaction
          player_address: address
        })
      };

      const { data, error } = await supabase.functions.invoke("start-game", {
        body: requestData,
      });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (!data?.session_id) {
        console.error("No session ID returned:", data);
        throw new Error("Invalid response from game server");
      }

      console.log("Game started successfully:", data);

      navigate("/exploration", {
        state: {
          credits,
          numOptions: 3,
          round: 1,
          maxRounds: data?.max_rounds ?? 6,
          score: 0,
          sessionId: data?.session_id,
          gameMode: isWeb3Mode ? "web3" : "traditional",
        },
      });
    } catch (error) {
      console.error("Game start error:", error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Could not connect to game server. Please try again.",
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
        
        <div className="container mx-auto px-4 pt-24 pb-16 relative z-10 ml-96">
          
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4 text-treasure-gold">
                Cave Explorer
              </h1>
              <p className="text-xl text-muted-foreground mb-2">
                Venture into mysterious caves to mine hidden ETH treasures!
              </p>
              <p className="text-sm text-muted-foreground">
                You must safely mine 6 passages to successfully escape the cave. Keep your mined ETH by escaping.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              {/* Web3 Mode Toggle for Testing */}
              <Card className="p-4 mb-6 bg-blue-500/10 border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-400">Testing Mode</p>
                    <p className="text-sm text-muted-foreground">Toggle between traditional and Web3 betting</p>
                  </div>
                  <Button
                    variant={isWeb3Mode ? "treasure" : "cave"}
                    onClick={() => setIsWeb3Mode(!isWeb3Mode)}
                    size="sm"
                  >
                    {isWeb3Mode ? "Web3 Mode" : "Traditional Mode"}
                  </Button>
                </div>
              </Card>

              <Card className="p-8 shadow-deep">
                <div className="space-y-6">
                  <div>
                    <Label className="text-lg font-semibold mb-4 block">
                      Select Your ETH Wager {isWeb3Mode && "(Real ETH)"}
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
                      disabled={!getAmountForButton() || !isAuthenticated}
                      className="w-full"
                    >
                      <Map className="w-5 h-5 mr-2" />
                      Start Cave Exploration
                      {getAmountForButton() > 0 && (
                        <span className="ml-2">({getAmountForButton()} ETH)</span>
                      )}
                    </Button>
                    
                    {isWeb3Mode && (
                      <p className="text-xs text-center mt-2 text-yellow-400">
                        Real ETH will be wagered from your wallet
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Refer Friends Section */}
            <div className="max-w-md mx-auto mt-8">
              <SocialSharing 
                totalScore={0}
                roundsCompleted={0}
                isVictory={false}
                referralMode={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;