import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Award, Star, Target, Zap, Shield } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";

export const AchievementsSection = () => {
  const { achievements } = useAchievements();
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy': return <Trophy className="w-5 h-5" />;
      case 'Award': return <Award className="w-5 h-5" />;
      case 'Star': return <Star className="w-5 h-5" />;
      case 'Target': return <Target className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Shield': return <Shield className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-treasure-gold/20 rounded-full">
                <Trophy className="w-5 h-5 text-treasure-gold" />
              </div>
              <div>
                <h3 className="font-semibold">Achievements</h3>
                <p className="text-sm text-muted-foreground">
                  {unlockedCount} of {totalCount} unlocked
                </p>
              </div>
            </div>
            <Badge variant="secondary">{unlockedCount}/{totalCount}</Badge>
          </div>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-treasure-gold" />
            Achievements ({unlockedCount}/{totalCount})
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-3 mt-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border transition-all ${
                achievement.unlocked
                  ? 'bg-treasure-gold/10 border-treasure-gold/30'
                  : 'bg-secondary/20 border-border opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  achievement.unlocked 
                    ? 'bg-treasure-gold/20 text-treasure-gold' 
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {getAchievementIcon(achievement.icon)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{achievement.name}</h4>
                    {achievement.unlocked && (
                      <Badge variant="secondary" className="bg-treasure-gold/20 text-treasure-gold border-treasure-gold/30">
                        Unlocked
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {achievement.description}
                  </p>
                  
                  {!achievement.unlocked && achievement.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary/50 rounded-full h-2">
                        <div
                          className="bg-treasure-gold h-2 rounded-full transition-all"
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
      </DialogContent>
    </Dialog>
  );
};