
import { useEffect, useState } from "react";
import caveProgression from "@/assets/cave-progression.jpg";

interface CaveProgressionFlashProps {
  onComplete: () => void;
}

export const CaveProgressionFlash = ({ onComplete }: CaveProgressionFlashProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 500); // Wait for fade out animation
    }, 2000); // Show for 2 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="relative max-w-4xl mx-auto">
        <img
          src={caveProgression}
          alt="Progressing through the cave"
          className="w-full h-auto rounded-lg shadow-2xl"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-2 text-treasure-gold animate-glow-pulse">
              Safe Passage!
            </h2>
            <p className="text-xl">You are closer to escaping the cave...</p>
          </div>
        </div>
      </div>
    </div>
  );
};
