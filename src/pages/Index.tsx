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

  const handleStartGame = () => {
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

    navigate("/game", { state: { credits } });
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
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-12">
            <Pickaxe className="w-20 h-20 mx-auto mb-6 text-treasure-gold animate-glow-pulse" />
            <h1 className="text-5xl font-bold mb-4 text-treasure-gold">
              Cave Explorer
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              Venture into mysterious caves to discover hidden treasures!
            </p>
            <p className="text-sm text-muted-foreground">
              Each cave exploration costs 10 credits. Choose wisely!
            </p>
          </div>

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

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              💡 Tip: Start with 100 credits for a balanced exploration experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
