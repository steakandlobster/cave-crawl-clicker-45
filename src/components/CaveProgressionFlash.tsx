
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
      }, 300); // Wait for fade out animation
    }, 1000); // Show for 1 second

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
            <p className="text-xl">You venture deeper into the cave...</p>
          </div>
        </div>
      </div>
    </div>
  );
};
