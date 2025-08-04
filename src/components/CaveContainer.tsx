import { useState } from "react";
import { Card } from "@/components/ui/card";
import cave1 from "@/assets/cave-1.jpg";
import treasureChest from "@/assets/treasure-chest.jpg";
import caveEmpty from "@/assets/cave-empty.jpg";
import crystalCave from "@/assets/crystal-cave.jpg";

interface CaveContainerProps {
  id: number;
  isRevealed: boolean;
  treasureType: "gold" | "crystals" | "empty" | "mystery";
  onClick: (id: number) => void;
  disabled?: boolean;
}

const getImageForTreasure = (treasureType: string, isRevealed: boolean) => {
  if (!isRevealed) return cave1;
  
  switch (treasureType) {
    case "gold":
      return treasureChest;
    case "crystals":
      return crystalCave;
    case "empty":
      return caveEmpty;
    default:
      return cave1;
  }
};

const getTreasureValue = (treasureType: string) => {
  switch (treasureType) {
    case "gold":
      return "💰 Gold Treasure!";
    case "crystals":
      return "💎 Crystal Cache!";
    case "empty":
      return "🕳️ Empty Cave";
    default:
      return "❓ Mysterious";
  }
};

export const CaveContainer = ({
  id,
  isRevealed,
  treasureType,
  onClick,
  disabled = false,
}: CaveContainerProps) => {
  const [isFlipping, setIsFlipping] = useState(false);

  const handleClick = () => {
    if (disabled || isFlipping) return;
    
    setIsFlipping(true);
    setTimeout(() => {
      onClick(id);
      setIsFlipping(false);
    }, 300);
  };

  return (
    <Card
      className={`
        relative overflow-hidden cursor-pointer group
        transition-all duration-300 hover:scale-105 hover:shadow-glow
        ${isRevealed ? "ring-2 ring-primary" : ""}
        ${isFlipping ? "animate-container-flip" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      onClick={handleClick}
    >
      <div className="aspect-square relative">
        <img
          src={getImageForTreasure(treasureType, isRevealed)}
          alt={isRevealed ? getTreasureValue(treasureType) : "Mysterious Cave"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {!isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-lg font-bold drop-shadow-lg">Cave #{id}</p>
              <p className="text-sm opacity-80">Click to explore</p>
            </div>
          </div>
        )}
        
        {isRevealed && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
            <p className="text-white font-bold text-center drop-shadow-lg">
              {getTreasureValue(treasureType)}
            </p>
          </div>
        )}
        
        {!isRevealed && (
          <div className="absolute inset-0 bg-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </div>
    </Card>
  );
};