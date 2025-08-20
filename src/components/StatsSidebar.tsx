import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface StatsSidebarProps {
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

export const StatsSidebar = ({ sessionStats, overallStats }: StatsSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!sessionStats && !overallStats) return null;

  return (
    <div className={`fixed top-4 left-4 bg-secondary/95 backdrop-blur-sm border border-border/50 rounded-lg transition-all duration-300 z-50 shadow-lg ${
      isCollapsed ? 'w-12 h-12' : 'w-80 max-h-[calc(100vh-2rem)]'
    }`}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-2 bg-secondary border border-border/50 h-6 w-6 p-0 rounded-full"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      {!isCollapsed && (
        <div className="p-3 overflow-y-auto max-h-full">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Statistics</h3>
          </div>

          <div className="space-y-4">
            {/* Current Session */}
            {sessionStats && (
              <Card className="p-3">
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Current Session</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Games</p>
                    <p className="text-lg font-bold">1</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Passages Explored</p>
                    <p className="text-lg font-bold">{sessionStats.sessionRounds}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Net Gain/Loss</p>
                    <p className={`text-lg font-bold ${sessionStats.sessionCredits >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {sessionStats.sessionCredits >= 0 ? '+' : ''}{sessionStats.sessionCredits.toFixed(sessionStats.sessionCredits !== 0 && Math.abs(sessionStats.sessionCredits) < 0.001 ? 5 : Math.abs(sessionStats.sessionCredits) < 0.01 ? 4 : 3)} ETH
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Overall Stats */}
            {overallStats && (
              <Card className="p-3">
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Overall</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Games Played</p>
                    <p className="text-lg font-bold">{overallStats.totalGamesPlayed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Passages Explored</p>
                    <p className="text-lg font-bold">{overallStats.totalRoundsPlayed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Net Gain/Loss</p>
                    <p className={`text-lg font-bold ${overallStats.totalNetCredits >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {overallStats.totalNetCredits >= 0 ? '+' : ''}{overallStats.totalNetCredits.toFixed(overallStats.totalNetCredits !== 0 && Math.abs(overallStats.totalNetCredits) < 0.001 ? 5 : Math.abs(overallStats.totalNetCredits) < 0.01 ? 4 : 3)} ETH
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="flex flex-col items-center justify-center h-full">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
      )}
    </div>
  );
};