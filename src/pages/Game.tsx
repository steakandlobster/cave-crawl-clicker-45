import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GameHeader } from "@/components/GameHeader";
import { CaveContainer } from "@/components/CaveContainer";
import { GameOverScreen } from "@/components/GameOverScreen";
import { useSessionStats, useOverallStats } from "@/hooks/useGameStats";
import { toast } from "@/hooks/use-toast";

interface GameState {
  credits: number;
  rounds: number;
  score: number;
  caves: Array<{
    id: number;
    isRevealed: boolean;
    treasureType: "gold" | "crystals" | "empty" | "mystery";
    value: number;
  }>;
  isGameOver: boolean;
  maxRounds: number;
  initialCredits: number;
}

const treasureTypes = ["gold", "crystals", "empty", "empty"] as const;
const treasureValues = { gold: 50, crystals: 30, empty: 0, mystery: 0 };

export default function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCredits = location.state?.credits || 100;
  
  const { sessionStats, addSessionRounds, addSessionCredits } = useSessionStats();
  const { overallStats, incrementGamesPlayed, addRoundsPlayed, addNetCredits } = useOverallStats();

  const [gameState, setGameState] = useState<GameState>({
    credits: initialCredits,
    rounds: 0,
    score: 0,
    caves: [],
    isGameOver: false,
    maxRounds: Math.floor(initialCredits / 10), // 10 credits per round
    initialCredits,
  });

  const generateCaves = () => {
    const numCaves = Math.floor(Math.random() * 6) + 6; // 6-12 caves
    const caves = Array.from({ length: numCaves }, (_, index) => {
      const treasureType = treasureTypes[Math.floor(Math.random() * treasureTypes.length)];
      return {
        id: index + 1,
        isRevealed: false,
        treasureType,
        value: treasureValues[treasureType],
      };
    });
    return caves;
  };

  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      caves: generateCaves(),
    }));
    // Increment games played when starting a new game
    incrementGamesPlayed();
  }, [incrementGamesPlayed]);

  // This effect is removed as we'll update stats only when game ends

  const handleCaveClick = (caveId: number) => {
    if (gameState.isGameOver) return;

    setGameState(prev => {
      const newCaves = prev.caves.map(cave =>
        cave.id === caveId ? { ...cave, isRevealed: true } : cave
      );

      const clickedCave = newCaves.find(cave => cave.id === caveId);
      const newScore = prev.score + (clickedCave?.value || 0);
      const newRounds = prev.rounds + 1;
      const newCredits = prev.credits - 10; // Cost per cave exploration

      // Show toast for treasure found
      if (clickedCave?.value && clickedCave.value > 0) {
        toast({
          title: "Treasure Found!",
          description: `You discovered ${clickedCave.value} gold pieces!`,
        });
      } else {
        toast({
          title: "Empty Cave",
          description: "No treasure found in this cave.",
          variant: "destructive",
        });
      }

      // Check if all caves are revealed or max rounds reached
      const allRevealed = newCaves.every(cave => cave.isRevealed);
      const maxRoundsReached = newRounds >= prev.maxRounds;
      const noCreditsLeft = newCredits <= 0;

      let isGameOver = allRevealed || maxRoundsReached || noCreditsLeft;

      // If not game over and some caves are revealed, generate new caves after delay
      if (!isGameOver && newCaves.some(cave => cave.isRevealed)) {
        setTimeout(() => {
          setGameState(current => ({
            ...current,
            caves: generateCaves(),
          }));
        }, 1500);
      }

      if (isGameOver) {
        // Calculate net credits (score - credits spent)
        const creditsSpent = prev.initialCredits - newCredits;
        const netCredits = newScore - creditsSpent;
        
        // Update stats when game ends
        addSessionRounds(newRounds);
        addSessionCredits(netCredits);
        addRoundsPlayed(newRounds);
        addNetCredits(netCredits);
        
        setTimeout(() => {
          setGameState(current => ({ ...current, isGameOver: true }));
        }, 1500);
      }

      return {
        ...prev,
        caves: newCaves,
        score: newScore,
        rounds: newRounds,
        credits: newCredits,
      };
    });
  };

  const resetGame = () => {
    setGameState({
      credits: initialCredits,
      rounds: 0,
      score: 0,
      caves: generateCaves(),
      isGameOver: false,
      maxRounds: Math.floor(initialCredits / 10),
      initialCredits,
    });
  };

  const returnHome = () => {
    navigate("/");
  };

  if (gameState.isGameOver) {
    const treasuresFound = gameState.rounds - gameState.caves.filter(cave => cave.isRevealed && cave.value === 0).length;
    return (
      <GameOverScreen
        totalScore={gameState.score}
        treasuresFound={Math.max(0, treasuresFound)}
        roundsPlayed={gameState.rounds}
        initialCredits={gameState.initialCredits}
        onPlayAgain={resetGame}
        onReturnHome={returnHome}
      />
    );
  }

  return (
    <div className="min-h-screen cave-background">
      <GameHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-treasure-gold">
            Cave Exploration
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose a cave to explore! Each exploration costs 10 credits.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Rounds remaining: {gameState.maxRounds - gameState.rounds}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {gameState.caves.map((cave) => (
            <CaveContainer
              key={cave.id}
              id={cave.id}
              isRevealed={cave.isRevealed}
              treasureType={cave.treasureType}
              onClick={handleCaveClick}
              disabled={cave.isRevealed || gameState.credits < 10}
            />
          ))}
        </div>

        {gameState.credits < 10 && !gameState.isGameOver && (
          <div className="text-center mt-8">
            <p className="text-red-400 font-semibold">
              Not enough credits to continue exploring!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}