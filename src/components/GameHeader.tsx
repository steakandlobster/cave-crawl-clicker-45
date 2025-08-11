
import { AchievementsDropdown } from "@/components/AchievementsDropdown";

interface GameHeaderProps {
  showNavigation?: boolean;
}

export const GameHeader = ({ showNavigation = true }: GameHeaderProps) => {
  return (
    <header className="border-b border-border/50 bg-secondary/30 backdrop-blur-sm relative z-20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Center - Achievements */}
          <div className="flex-1 flex justify-center">
            {showNavigation && <AchievementsDropdown />}
          </div>
        </div>
      </div>
    </header>
  );
};
