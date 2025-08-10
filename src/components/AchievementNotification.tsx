import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface AchievementNotificationProps {
  achievements: Achievement[];
  onDismiss: () => void;
}

export const AchievementNotification = ({ achievements, onDismiss }: AchievementNotificationProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievements.length > 0) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [achievements, onDismiss]);

  if (achievements.length === 0) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <Card className="p-4 bg-treasure-gold/20 border-treasure-gold/40 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <Trophy className="w-6 h-6 text-treasure-gold mt-1" />
          <div>
            <h3 className="font-bold text-treasure-gold mb-1">Achievement Unlocked!</h3>
            {achievements.map(achievement => (
              <div key={achievement.id} className="mb-2 last:mb-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{achievement.icon}</span>
                  <span className="font-semibold">{achievement.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};