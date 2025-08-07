import { useState, useEffect } from 'react';

interface SessionStats {
  sessionRounds: number;
  sessionCredits: number;
}

interface OverallStats {
  totalGamesPlayed: number;
  totalRoundsPlayed: number;
  totalCreditsWon: number;
}

export const useSessionStats = () => {
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    sessionRounds: 0,
    sessionCredits: 0,
  });

  const updateSessionRounds = (rounds: number) => {
    setSessionStats(prev => ({
      ...prev,
      sessionRounds: rounds,
    }));
  };

  const updateSessionCredits = (credits: number) => {
    setSessionStats(prev => ({
      ...prev,
      sessionCredits: credits,
    }));
  };

  const resetSession = () => {
    setSessionStats({
      sessionRounds: 0,
      sessionCredits: 0,
    });
  };

  return {
    sessionStats,
    updateSessionRounds,
    updateSessionCredits,
    resetSession,
  };
};

export const useOverallStats = () => {
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalGamesPlayed: 0,
    totalRoundsPlayed: 0,
    totalCreditsWon: 0,
  });

  // Load stats from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('cave-explorer-overall-stats');
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        setOverallStats(parsed);
      } catch (error) {
        console.warn('Failed to parse saved stats:', error);
      }
    }
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cave-explorer-overall-stats', JSON.stringify(overallStats));
  }, [overallStats]);

  const incrementGamesPlayed = () => {
    setOverallStats(prev => ({
      ...prev,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
    }));
  };

  const addRoundsPlayed = (rounds: number) => {
    setOverallStats(prev => ({
      ...prev,
      totalRoundsPlayed: prev.totalRoundsPlayed + rounds,
    }));
  };

  const addCreditsWon = (credits: number) => {
    setOverallStats(prev => ({
      ...prev,
      totalCreditsWon: prev.totalCreditsWon + credits,
    }));
  };

  return {
    overallStats,
    incrementGamesPlayed,
    addRoundsPlayed,
    addCreditsWon,
  };
};