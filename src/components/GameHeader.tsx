import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, Coins, Trophy, Target, Clock } from "lucide-react";

interface GameHeaderProps {
  credits: number;
  rounds: number;
  score: number;
  timeRemaining?: number;
  sessionStats?: {
    sessionRounds: number;
    sessionCredits: number;
  };
  overallStats?: {
    totalGamesPlayed: number;
    totalRoundsPlayed: number;
    totalCreditsWon: number;
  };
}

export const GameHeader = ({ credits, rounds, score, timeRemaining, sessionStats, overallStats }: GameHeaderProps) => {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);

  const togglePanel = (panel: string) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  const panels = [
    {
      id: "credits",
      label: "Credits",
      value: credits,
      icon: Coins,
      details: `Current cave exploration credits: ${credits}`,
    },
    {
      id: "rounds",
      label: "Rounds",
      value: rounds,
      icon: Target,
      details: `Caves explored this session: ${rounds}`,
    },
    {
      id: "score",
      label: "Score",
      value: score,
      icon: Trophy,
      details: `Total treasure found: ${score} gold pieces`,
    },
  ];

  if (timeRemaining !== undefined) {
    panels.push({
      id: "time",
      label: "Time",
      value: timeRemaining,
      icon: Clock,
      details: `Time remaining: ${timeRemaining}s`,
    });
  }

  return (
    <div className="w-full bg-card border-b border-border">
      <div className="flex flex-wrap gap-2 p-4">
        {panels.map((panel) => (
          <div key={panel.id} className="relative">
            <Button
              variant="game"
              size="sm"
              onClick={() => togglePanel(panel.id)}
              className="flex items-center gap-2"
            >
              <panel.icon className="w-4 h-4" />
              {panel.label}: {panel.value}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${
                  expandedPanel === panel.id ? "rotate-180" : ""
                }`}
              />
            </Button>
            {expandedPanel === panel.id && (
              <Card className="absolute top-full left-0 mt-2 p-3 min-w-64 z-10 animate-slide-in shadow-glow">
                <p className="text-sm text-muted-foreground">{panel.details}</p>
              </Card>
            )}
          </div>
        ))}
      </div>
      
      {/* Session and Overall Statistics */}
      {(sessionStats || overallStats) && (
        <div className="border-t border-border bg-secondary/20 p-3">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {sessionStats && (
              <div className="flex gap-4">
                <span>Session: {sessionStats.sessionRounds} rounds</span>
                <span>{sessionStats.sessionCredits} credits</span>
              </div>
            )}
            {overallStats && (
              <div className="flex gap-4 border-l border-border pl-4">
                <span>Overall: {overallStats.totalGamesPlayed} games</span>
                <span>{overallStats.totalRoundsPlayed} rounds</span>
                <span>{overallStats.totalCreditsWon} credits won</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};