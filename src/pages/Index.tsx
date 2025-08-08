import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameHeader } from "@/components/GameHeader";
import { useSessionStats, useOverallStats } from "@/hooks/useGameStats";
import { Pickaxe, Coins, Map } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showStats, setShowStats] = useState(false);
  
  const { sessionStats, resetSession } = useSessionStats();
  const { overallStats } = useOverallStats();

  const presetAmounts = [50, 100, 250];

  const handleStartGame = async () => {
    const credits = selectedAmount || parseInt(customAmount);
    
    if (!credits || credits < 10) {
      toast({
        title: "Invalid Amount",
        description: "Please select at least 10 credits to start exploring!",
        variant: "destructive",
      });
      return;
    }

    if (credits > 1000) {
      toast({
        title: "Amount Too High",
        description: "Maximum credits allowed is 1000.",
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
          maxRounds: 6 
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
    return selectedAmount || parseInt(customAmount) || 0;
  };

  return (
    <div className="min-h-screen cave-background">
      <div className="relative z-10">
        <GameHeader
          credits={0}
          rounds={0}
          sessionStats={sessionStats}
          overallStats={overallStats}
        />
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4 text-treasure-gold">
                Cave Explorer
              </h1>
              <p className="text-xl text-muted-foreground mb-2">
                Venture into mysterious caves to discover hidden treasures!
              </p>
              <p className="text-sm text-muted-foreground">
                Each game lasts 1 round regardless of credits wagered.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card className="p-8 shadow-deep">
                <div className="space-y-6">
                  <div>
                    <Label className="text-lg font-semibold mb-4 block">
                      Select Your Exploration Credits
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
                          <span className="text-xs opacity-80">credits</span>
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
                        placeholder="Enter credits (10-1000)"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedAmount(null);
                        }}
                        min={10}
                        max={1000}
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
                        <span className="ml-2">({getAmountForButton()} credits)</span>
                      )}
                    </Button>
                    
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
