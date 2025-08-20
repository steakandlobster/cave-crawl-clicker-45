import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    localStorage.setItem('cave-explorer-session-stats', JSON.stringify({
      sessionRounds: 0,
      sessionCredits: 0,
    }));
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
  const [loading, setLoading] = useState(false);

  // Fetch stats from database for authenticated users
  const fetchFromDatabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setLoading(true);
      
      const { data: completedGames } = await supabase
        .from('game_sessions')
        .select('passages_navigated, net_result')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (completedGames) {
        const totalGamesPlayed = completedGames.length;
        const totalRoundsPlayed = completedGames.reduce((sum, game) => sum + (game.passages_navigated || 0), 0);
        const totalNetCredits = completedGames.reduce((sum, game) => sum + (game.net_result || 0), 0);
        
        setOverallStats({
          totalGamesPlayed,
          totalRoundsPlayed,
          totalNetCredits,
        });
      }
    } catch (error) {
      console.warn('Failed to fetch stats from database:', error);
      // Fall back to localStorage
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // Load stats from localStorage (fallback)
  const loadFromLocalStorage = () => {
    const savedStats = localStorage.getItem('cave-explorer-overall-stats');
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        setOverallStats(parsed);
      } catch (error) {
        console.warn('Failed to parse saved stats:', error);
      }
    }
  };

  // Load stats on mount and auth changes
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchFromDatabase();
      } else {
        loadFromLocalStorage();
      }
    };

    checkAuthAndLoad();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setTimeout(() => {
          fetchFromDatabase();
        }, 0);
      } else {
        loadFromLocalStorage();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save to localStorage when stats change (for non-authenticated users)
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

  const refreshStats = async () => {
    await fetchFromDatabase();
  };

  return {
    overallStats,
    loading,
    incrementGamesPlayed,
    addRoundsPlayed,
    addNetCredits,
    refreshStats,
  };
};