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

// Deterministic image selection to avoid swaps across reloads
export const getCaveImageStable = (riskLevel: 'low' | 'medium' | 'high', key: string, usedInThisRound: string[] = []): string => {
  const availableImages = caveImages[riskLevel];
  // Simple string hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  // Try to find a non-duplicate deterministically
  for (let offset = 0; offset < availableImages.length; offset++) {
    const idx = Math.abs(hash + offset) % availableImages.length;
   const candidate = availableImages[idx];
    if (!usedInThisRound.includes(candidate)) {
      return candidate;
    }
  }
  return availableImages[Math.abs(hash) % availableImages.length];
};

export const resetImageRotation = () => {
  usedImages.clear();
};