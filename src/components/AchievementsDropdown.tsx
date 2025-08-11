import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronDown, Trophy, Award, Star, Target, Zap, Shield } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";

export const AchievementsDropdown = () => {
  const { achievements } = useAchievements();
  const [isOpen, setIsOpen] = useState(false);
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy': return <Trophy className="w-4 h-4" />;
      case 'Award': return <Award className="w-4 h-4" />;
      case 'Star': return <Star className="w-4 h-4" />;
      case 'Target': return <Target className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'Shield': return <Shield className="w-4 h-4" />;
      default: return <Trophy className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Trophy className="w-4 h-4 text-treasure-gold" />
        <span>Achievements</span>
        <Badge variant="secondary" className="text-xs">{unlockedCount}/{totalCount}</Badge>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute top-full left-0 mt-2 w-96 max-h-96 overflow-y-auto z-50 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-treasure-gold" />
              Achievements ({unlockedCount}/{totalCount})
            </h3>
            
            <div className="space-y-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-lg border transition-all ${
                    achievement.unlocked
                      ? 'bg-treasure-gold/10 border-treasure-gold/30'
                      : 'bg-secondary/20 border-border opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`p-1 rounded-full ${
                      achievement.unlocked 
                        ? 'bg-treasure-gold/20 text-treasure-gold' 
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                      {getAchievementIcon(achievement.icon)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{achievement.name}</h4>
                        {achievement.unlocked && (
                          <Badge variant="secondary" className="bg-treasure-gold/20 text-treasure-gold border-treasure-gold/30 text-xs">
                            Unlocked
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-1">
                        {achievement.description}
                      </p>
                      
                      {!achievement.unlocked && achievement.progress !== undefined && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{achievement.progress}%</span>
                          </div>
                          <div className="w-full bg-secondary/50 rounded-full h-1.5">
                            <div
                              className="bg-treasure-gold h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(achievement.progress || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};