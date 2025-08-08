// Cave image rotation system
import caveLowRisk from "@/assets/cave-low-risk.jpg";
import caveLowRisk2 from "@/assets/cave-low-risk-2.jpg";
import caveLowRisk3 from "@/assets/cave-low-risk-3.jpg";
import caveMediumRisk from "@/assets/cave-medium-risk.jpg";
import caveMediumRisk2 from "@/assets/cave-medium-risk-2.jpg";
import caveMediumRisk3 from "@/assets/cave-medium-risk-3.jpg";
import caveHighRisk from "@/assets/cave-high-risk.jpg";
import caveHighRisk2 from "@/assets/cave-high-risk-2.jpg";
import caveHighRisk3 from "@/assets/cave-high-risk-3.jpg";

const caveImages = {
  low: [caveLowRisk, caveLowRisk2, caveLowRisk3],
  medium: [caveMediumRisk, caveMediumRisk2, caveMediumRisk3],
  high: [caveHighRisk, caveHighRisk2, caveHighRisk3],
};

// Track which images have been used to avoid repetition
const usedImages = new Set<string>();

export const getCaveImage = (riskLevel: 'low' | 'medium' | 'high', usedInThisRound: string[] = []): string => {
  const availableImages = caveImages[riskLevel];
  
  // Filter out images already used in this round
  const filteredImages = availableImages.filter(img => !usedInThisRound.includes(img));
  
  // If all images have been used in this round, reset and use any
  const imagesToChooseFrom = filteredImages.length > 0 ? filteredImages : availableImages;
  
  // Pick a random image from available ones
  const randomIndex = Math.floor(Math.random() * imagesToChooseFrom.length);
  return imagesToChooseFrom[randomIndex];
};

export const resetImageRotation = () => {
  usedImages.clear();
};