import { useState, useEffect } from 'react';

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
    name: 'Dedicated Explorer',
    description: 'Play for 3 consecutive days',
    icon: '🔥',
    checkFn: (data: AchievementData) => data.dailyActiveStreak >= 3,
    progressFn: (data: AchievementData) => ({ current: data.dailyActiveStreak, max: 3 }),
  },
  {
    id: 'daily_streak_7',
    name: 'Veteran Explorer',
    description: 'Play for 7 consecutive days',
    icon: '⭐',
    checkFn: (data: AchievementData) => data.dailyActiveStreak >= 7,
    progressFn: (data: AchievementData) => ({ current: data.dailyActiveStreak, max: 7 }),
  },
  {
    id: 'rounds_100',
    name: 'Century Club',
    description: 'Clear 100 total rounds',
    icon: '💯',
    checkFn: (data: AchievementData) => data.totalRoundsCleared >= 100,
    progressFn: (data: AchievementData) => ({ current: data.totalRoundsCleared, max: 100 }),
  },
  {
    id: 'rounds_500',
    name: 'Cave Master',
    description: 'Clear 500 total rounds',
    icon: '👑',
    checkFn: (data: AchievementData) => data.totalRoundsCleared >= 500,
    progressFn: (data: AchievementData) => ({ current: data.totalRoundsCleared, max: 500 }),
  },
  {
    id: 'games_50',
    name: 'Persistent Explorer',
    description: 'Play 50 total games',
    icon: '🎯',
    checkFn: (data: AchievementData) => data.totalGamesPlayed >= 50,
    progressFn: (data: AchievementData) => ({ current: data.totalGamesPlayed, max: 50 }),
  },
  {
    id: 'dangerous_10',
    name: 'Risk Taker',
    description: 'Choose the dangerous path 10 times',
    icon: '⚡',
    checkFn: (data: AchievementData) => data.pathChoices.dangerous >= 10,
    progressFn: (data: AchievementData) => ({ current: data.pathChoices.dangerous, max: 10 }),
  },
  {
    id: 'dangerous_100',
    name: 'Daredevil',
    description: 'Choose the dangerous path 100 times',
    icon: '💀',
    checkFn: (data: AchievementData) => data.pathChoices.dangerous >= 100,
    progressFn: (data: AchievementData) => ({ current: data.pathChoices.dangerous, max: 100 }),
  },
];

export const useAchievements = () => {
  const [achievementData, setAchievementData] = useState<AchievementData>({
    dailyActiveStreak: 0,
    totalRoundsCleared: 0,
    totalGamesPlayed: 0,
    pathChoices: { safe: 0, risky: 0, dangerous: 0 },
    lastActiveDate: '',
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

  const addPathChoice = (pathType: 'safe' | 'risky' | 'dangerous') => {
    setAchievementData(prev => ({
      ...prev,
      pathChoices: {
        ...prev.pathChoices,
        [pathType]: prev.pathChoices[pathType] + 1,
      },
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
    getNewlyUnlockedAchievements,
  };
};