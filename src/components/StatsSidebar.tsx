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
    <div className={`fixed top-0 left-0 h-full bg-secondary/95 backdrop-blur-sm border-r border-border/50 transition-all duration-300 z-50 ${
      isCollapsed ? 'w-12' : 'w-64'
    }`}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 bg-secondary border border-border/50 h-8 w-8 p-0 rounded-full"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      {!isCollapsed && (
        <div className="p-4">
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
                      {sessionStats.sessionCredits >= 0 ? '+' : ''}{sessionStats.sessionCredits.toFixed(3)} ETH
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
                      {overallStats.totalNetCredits >= 0 ? '+' : ''}{overallStats.totalNetCredits.toFixed(3)} ETH
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="flex flex-col items-center pt-4">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
      )}
    </div>
  );
};