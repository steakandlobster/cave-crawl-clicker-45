import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PathChoiceStats {
  safe: number;
  risky: number;
  dangerous: number;
}

interface AchievementData {
  dailyActiveStreak: number;
  totalRoundsCleared: number;
  totalGamesPlayed: number;
  pathChoices: PathChoiceStats;
  lastActiveDate: string;
  referrals?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'daily_streak_3',
    name: 'Dedicated Miner',
    description: 'Play for 3 consecutive days',
    icon: '🔥',
    checkFn: (data: AchievementData) => data.dailyActiveStreak >= 3,
    progressFn: (data: AchievementData) => ({ current: data.dailyActiveStreak, max: 3 }),
  },
  {
    id: 'daily_streak_7',
    name: 'Veteran Miner',
    description: 'Play for 7 consecutive days',
    icon: 'Star',
    checkFn: (data: AchievementData) => data.dailyActiveStreak >= 7,
    progressFn: (data: AchievementData) => ({ current: data.dailyActiveStreak, max: 7 }),
  },
  {
    id: 'daily_streak_14',
    name: 'Master Miner',
    description: 'Play for 14 consecutive days',
    icon: 'Trophy',
    checkFn: (data: AchievementData) => data.dailyActiveStreak >= 14,
    progressFn: (data: AchievementData) => ({ current: data.dailyActiveStreak, max: 14 }),
  },
  {
    id: 'daily_streak_30',
    name: 'Legend Miner',
    description: 'Play for 30 consecutive days',
    icon: 'Award',
    checkFn: (data: AchievementData) => data.dailyActiveStreak >= 30,
    progressFn: (data: AchievementData) => ({ current: data.dailyActiveStreak, max: 30 }),
  },
  {
    id: 'rounds_100',
    name: 'Century Club',
    description: 'Mine 100 total passages',
    icon: 'Target',
    checkFn: (data: AchievementData) => data.totalRoundsCleared >= 100,
    progressFn: (data: AchievementData) => ({ current: data.totalRoundsCleared, max: 100 }),
  },
  {
    id: 'rounds_500',
    name: 'Cave Master',
    description: 'Mine 500 total passages',
    icon: 'Shield',
    checkFn: (data: AchievementData) => data.totalRoundsCleared >= 500,
    progressFn: (data: AchievementData) => ({ current: data.totalRoundsCleared, max: 500 }),
  },
  {
    id: 'games_50',
    name: 'Persistent Miner',
    description: 'Play 50 total games',
    icon: '🎯',
    checkFn: (data: AchievementData) => data.totalGamesPlayed >= 50,
    progressFn: (data: AchievementData) => ({ current: data.totalGamesPlayed, max: 50 }),
  },
  {
    id: 'dangerous_10',
    name: 'Risk Taker',
    description: 'Choose the dangerous path 10 times',
    icon: 'Zap',
    checkFn: (data: AchievementData) => data.pathChoices.dangerous >= 10,
    progressFn: (data: AchievementData) => ({ current: data.pathChoices.dangerous, max: 10 }),
  },
  {
    id: 'dangerous_100',
    name: 'Daredevil',
    description: 'Choose the dangerous path 100 times',
    icon: 'Zap',
    checkFn: (data: AchievementData) => data.pathChoices.dangerous >= 100,
    progressFn: (data: AchievementData) => ({ current: data.pathChoices.dangerous, max: 100 }),
  },
  {
    id: 'referrals_1',
    name: 'Recruiter',
    description: 'Refer 1 friend to the game',
    icon: 'Trophy',
    checkFn: (data: AchievementData) => (data as any).referrals >= 1,
    progressFn: (data: AchievementData) => ({ current: (data as any).referrals || 0, max: 1 }),
  },
  {
    id: 'referrals_5',
    name: 'Ambassador',
    description: 'Refer 5 friends to the game',
    icon: 'Award',
    checkFn: (data: AchievementData) => (data as any).referrals >= 5,
    progressFn: (data: AchievementData) => ({ current: (data as any).referrals || 0, max: 5 }),
  },
  {
    id: 'referrals_10',
    name: 'Legend Recruiter',
    description: 'Refer 10 friends to the game',
    icon: 'Star',
    checkFn: (data: AchievementData) => (data as any).referrals >= 10,
    progressFn: (data: AchievementData) => ({ current: (data as any).referrals || 0, max: 10 }),
  },
];

export const useAchievements = () => {
  const [achievementData, setAchievementData] = useState<AchievementData>({
    dailyActiveStreak: 0,
    totalRoundsCleared: 0,
    totalGamesPlayed: 0,
    pathChoices: { safe: 0, risky: 0, dangerous: 0 },
    lastActiveDate: '',
    referrals: 0,
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Load achievement data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cave-explorer-achievements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAchievementData(parsed);
      } catch (error) {
        console.warn('Failed to parse achievement data:', error);
      }
    }
  }, []);

  // Update achievements when data changes
  useEffect(() => {
    const updatedAchievements = ACHIEVEMENT_DEFINITIONS.map(def => {
      const progress = def.progressFn(achievementData);
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        unlocked: def.checkFn(achievementData),
        progress: progress.current,
        maxProgress: progress.max,
      };
    });
    setAchievements(updatedAchievements);
  }, [achievementData]);

  // Save achievement data whenever it changes
  useEffect(() => {
    localStorage.setItem('cave-explorer-achievements', JSON.stringify(achievementData));
  }, [achievementData]);

  const updateDailyStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    setAchievementData(prev => {
      if (prev.lastActiveDate === today) {
        return prev; // Already updated today
      }

      let newStreak = 1;
      if (prev.lastActiveDate === yesterdayStr) {
        newStreak = prev.dailyActiveStreak + 1;
      }

      return {
        ...prev,
        dailyActiveStreak: newStreak,
        lastActiveDate: today,
      };
    });
  };

  const addRoundsCleared = (rounds: number) => {
    setAchievementData(prev => ({
      ...prev,
      totalRoundsCleared: prev.totalRoundsCleared + rounds,
    }));
  };

  const addGamesPlayed = (games: number = 1) => {
    setAchievementData(prev => ({
      ...prev,
      totalGamesPlayed: prev.totalGamesPlayed + games,
    }));
  };

  // Sync achievements with actual database stats
  const syncWithDatabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get actual games and rounds from database
      const { data: completedGames } = await supabase
        .from('game_sessions')
        .select('passages_navigated, user_choices')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (completedGames) {
        const totalGames = completedGames.length;
        const totalRounds = completedGames.reduce((sum, game) => sum + (game.passages_navigated || 0), 0);
        
        // Count path choices from actual games
        let safePaths = 0, riskyPaths = 0, dangerousPaths = 0;
        
        completedGames.forEach(game => {
          const choices = game.user_choices as any[] || [];
          choices.forEach(choice => {
            // Map option index to path type (0=safe, 1=risky, 2=dangerous)
            if (choice.option_selected === 0) safePaths++;
            else if (choice.option_selected === 1) riskyPaths++;
            else if (choice.option_selected === 2) dangerousPaths++;
          });
        });

        setAchievementData(prev => ({
          ...prev,
          totalGamesPlayed: Math.max(prev.totalGamesPlayed, totalGames),
          totalRoundsCleared: Math.max(prev.totalRoundsCleared, totalRounds),
          pathChoices: {
            safe: Math.max(prev.pathChoices.safe, safePaths),
            risky: Math.max(prev.pathChoices.risky, riskyPaths),
            dangerous: Math.max(prev.pathChoices.dangerous, dangerousPaths),
          }
        }));
      }
    } catch (error) {
      console.warn('Failed to sync achievements with database:', error);
    }
  };

  const addPathChoice = (pathType: 'safe' | 'risky' | 'dangerous') => {
    setAchievementData(prev => ({
      ...prev,
      pathChoices: {
        ...prev.pathChoices,
        [pathType]: prev.pathChoices[pathType] + 1,
      },
    }));
  };

  const addReferral = () => {
    setAchievementData(prev => ({
      ...prev,
      referrals: (prev.referrals || 0) + 1,
    }));
  };

  const getNewlyUnlockedAchievements = (previousAchievements: Achievement[]) => {
    return achievements.filter(achievement => 
      achievement.unlocked && 
      !previousAchievements.find(prev => prev.id === achievement.id && prev.unlocked)
    );
  };

  return {
    achievements,
    achievementData,
    updateDailyStreak,
    addRoundsCleared,
    addGamesPlayed,
    addPathChoice,
    addReferral,
    getNewlyUnlockedAchievements,
    syncWithDatabase,
  };
};