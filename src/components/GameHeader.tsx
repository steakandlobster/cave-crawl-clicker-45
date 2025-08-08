import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Coins, Map, Clock } from "lucide-react";

interface GameHeaderProps {
  credits: number;
  rounds: number;
  timeRemaining?: number;
  sessionStats?: {
    sessionRounds: number;
    sessionCredits: number;
  };
  overallStats?: {
    totalGamesPlayed: number;
    totalRoundsPlayed: number;
    totalNetCredits: number;
  };
}

export const GameHeader = ({ credits, rounds, timeRemaining, sessionStats, overallStats }: GameHeaderProps) => {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  return (
    <header className="border-b border-border/50 bg-secondary/30 backdrop-blur-sm relative z-20">
      {/* Leaderboard Dropdown Panel */}
      {isLeaderboardOpen && (sessionStats || overallStats) && (
        <div className="p-4 bg-secondary/50 border-b border-border/30">
          <h3 className="text-sm font-semibold mb-3 text-center">Leaderboard</h3>
          <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Current Session Column */}
            {sessionStats && (
              <div className="text-center">
                <h4 className="text-xs font-semibold mb-3 text-muted-foreground">Current Session</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Games</p>
                    <p className="text-lg font-bold">1</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paths Explored</p>
                    <p className="text-lg font-bold">{sessionStats.sessionRounds}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cumulative Gain/Loss</p>
                    <p className={`text-lg font-bold ${sessionStats.sessionCredits >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {sessionStats.sessionCredits >= 0 ? '+' : ''}{sessionStats.sessionCredits}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Column */}
            {overallStats && (
              <div className="text-center">
                <h4 className="text-xs font-semibold mb-3 text-muted-foreground">Overall</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Games Played</p>
                    <p className="text-lg font-bold">{overallStats.totalGamesPlayed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paths Explored</p>
                    <p className="text-lg font-bold">{overallStats.totalRoundsPlayed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gain/Loss</p>
                    <p className={`text-lg font-bold ${overallStats.totalNetCredits >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {overallStats.totalNetCredits >= 0 ? '+' : ''}{overallStats.totalNetCredits}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Basic game info without score */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-treasure-gold" />
              <span className="text-sm font-medium">{credits}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Map className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">{rounds}</span>
            </div>

            {/* Leaderboard Button */}
            {(sessionStats || overallStats) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
                className="text-xs"
              >
                Leaderboard
                <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isLeaderboardOpen ? 'rotate-180' : ''}`} />
              </Button>
            )}
          </div>

          {/* Right side - Time remaining if provided */}
          {timeRemaining !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium">{timeRemaining}s</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};