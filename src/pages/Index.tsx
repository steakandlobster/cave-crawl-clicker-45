import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameHeader } from "@/components/GameHeader";
import { Pickaxe, Coins, Map } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showStats, setShowStats] = useState(false);

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

    // TODO: Replace with actual backend call
    // For now, simulate backend response
    try {
      // const response = await fetch('/api/start-game', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ credits })
      // });
      // const data = await response.json();
      
      // Simulated backend response
      const numOptions = Math.floor(Math.random() * 6) + 3; // 3-8 options
      
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
    <div className="min-h-screen bg-gradient-cave">
      <GameHeader
        credits={0}
        rounds={0}
        score={0}
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section with Cave Image */}
          <div className="text-center mb-12">
            <div className="relative mb-8">
              <img 
                src="https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&h=400&fit=crop" 
                alt="Mysterious cave entrance surrounded by rock formations"
                className="w-full max-w-2xl mx-auto rounded-lg shadow-deep object-cover h-64"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Pickaxe className="w-20 h-20 text-treasure-gold animate-glow-pulse" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 text-treasure-gold">
              Cave Explorer
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              Venture into mysterious caves to discover hidden treasures!
            </p>
            <p className="text-sm text-muted-foreground">
              Each cave exploration costs 10 credits. Survive 6 rounds to win!
            </p>
          </div>

          <div className="max-w-2xl mx-auto">{/* Game Setup Card */}

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
                
                {getAmountForButton() > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    This will allow {Math.floor(getAmountForButton() / 10)} cave explorations
                  </p>
                )}
              </div>
            </div>
          </Card>

          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              💡 Tip: Start with 100 credits for a balanced exploration experience
            </p>
            <p className="text-xs text-muted-foreground mt-2 opacity-75">
              Note: Backend integration required for full multiplayer experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
