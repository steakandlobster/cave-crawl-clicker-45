
import { AchievementsDropdown } from "@/components/AchievementsDropdown";
import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";

interface GameHeaderProps {
  showNavigation?: boolean;
}

export const GameHeader = ({ showNavigation = true }: GameHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 border-b border-border/50 bg-secondary/30 backdrop-blur-sm z-50 w-full">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between w-full">
          {/* Left spacer */}
          <div className="flex-1"></div>
          
          {/* Center - Achievements */}
          <div className="flex justify-center">
            {showNavigation && <AchievementsDropdown />}
          </div>
          
          {/* Right - Leaderboard */}
          <div className="flex-1 flex justify-end">
            <GlobalLeaderboard />
          </div>
        </div>
      </div>
    </header>
  );
};
