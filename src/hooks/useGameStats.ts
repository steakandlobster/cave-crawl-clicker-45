import { useState, useEffect } from 'react';

interface SessionStats {
  sessionRounds: number;
  sessionCredits: number; // Net credits (score - credits spent)
}

interface OverallStats {
  totalGamesPlayed: number;
  totalRoundsPlayed: number;
  totalNetCredits: number; // Net credits (score - credits spent)
}

export const useSessionStats = () => {
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    sessionRounds: 0,
    sessionCredits: 0,
  });

  // Load session stats from localStorage on mount
  useEffect(() => {
    const savedSessionStats = localStorage.getItem('cave-explorer-session-stats');
    if (savedSessionStats) {
      try {
        const parsed = JSON.parse(savedSessionStats);
        setSessionStats(parsed);
      } catch (error) {
        console.warn('Failed to parse saved session stats:', error);
      }
    }
  }, []);

  // Save session stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cave-explorer-session-stats', JSON.stringify(sessionStats));
  }, [sessionStats]);

  const addSessionRounds = (rounds: number) => {
    setSessionStats(prev => ({
      ...prev,
      sessionRounds: prev.sessionRounds + rounds,
    }));
  };

  const addSessionCredits = (netCredits: number) => {
    setSessionStats(prev => ({
      ...prev,
      sessionCredits: prev.sessionCredits + netCredits,
    }));
  };

  const resetSession = () => {
    setSessionStats({
      sessionRounds: 0,
      sessionCredits: 0,
    });
    localStorage.removeItem('cave-explorer-session-stats');
  };

  return {
    sessionStats,
    addSessionRounds,
    addSessionCredits,
    resetSession,
  };
};

export const useOverallStats = () => {
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalGamesPlayed: 0,
    totalRoundsPlayed: 0,
    totalNetCredits: 0,
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

  const addNetCredits = (netCredits: number) => {
    setOverallStats(prev => ({
      ...prev,
      totalNetCredits: prev.totalNetCredits + netCredits,
    }));
  };

  return {
    overallStats,
    incrementGamesPlayed,
    addRoundsPlayed,
    addNetCredits,
  };
};