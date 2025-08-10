
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, TrendingDown, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStats, useOverallStats } from "@/hooks/useGameStats";

interface LeaderboardEntry {
  id: string;
  username: string;
  daily_rounds: number;
  daily_net_credits: number;
  total_rounds: number;
  total_net_credits: number;
  created_at: string;
}

export const GlobalLeaderboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'overall'>('daily');
  
  const { sessionStats } = useSessionStats();
  const { overallStats } = useOverallStats();

  // Generate a consistent user ID for this session
  const getUserId = () => {
    let userId = localStorage.getItem('cave-explorer-user-id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cave-explorer-user-id', userId);
    }
    return userId;
  };

  const updateUserStats = async () => {
    const userId = getUserId();
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Update or insert user stats
      const { error } = await supabase
        .from('global_leaderboard')
        .upsert({
          id: userId,
          username: `Explorer ${userId.slice(-6)}`,
          daily_rounds: sessionStats.sessionRounds,
          daily_net_credits: sessionStats.sessionCredits,
          total_rounds: overallStats.totalRoundsPlayed,
          total_net_credits: overallStats.totalNetCredits,
          date: today,
        }, {
          onConflict: 'id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };

  const fetchLeaderboards = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const userId = getUserId();
    
    try {
      // Update user stats first
      await updateUserStats();

      // Fetch daily leaderboard
      const { data: dailyData, error: dailyError } = await supabase
        .from('global_leaderboard')
        .select('*')
        .eq('date', today)
        .order('daily_net_credits', { ascending: false })
        .limit(10);

      if (dailyError) throw dailyError;

      // Fetch overall leaderboard
      const { data: overallData, error: overallError } = await supabase
        .from('global_leaderboard')
        .select('*')
        .order('total_net_credits', { ascending: false })
        .limit(10);

      if (overallError) throw overallError;

      // Fetch user's current stats
      const { data: userData, error: userError } = await supabase
        .from('global_leaderboard')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') throw userError;

      setDailyLeaderboard(dailyData || []);
      setOverallLeaderboard(overallData || []);
      setUserStats(userData);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboards();
    }
  }, [isOpen, sessionStats, overallStats]);

  const formatCredits = (credits: number) => {
    return credits >= 0 ? `+${credits.toFixed(3)}` : `${credits.toFixed(3)}`;
  };

  const getCreditsColor = (credits: number) => {
    return credits >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const currentLeaderboard = activeTab === 'daily' ? dailyLeaderboard : overallLeaderboard;
  const userPosition = currentLeaderboard.findIndex(entry => entry.id === getUserId()) + 1;

  return (
    <>
      <Button
        variant="treasure"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 z-50 relative pointer-events-auto"
      >
        <Trophy className="w-4 h-4" />
        Leaderboard
      </Button>

      {isOpen && (
        <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-hidden bg-background/95 backdrop-blur-sm border-border/50 z-50 pointer-events-auto">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-treasure-gold" />
              <h3 className="font-bold text-lg">Global Leaderboard</h3>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === 'daily' ? 'treasure' : 'cave'}
                size="sm"
                onClick={() => setActiveTab('daily')}
                className="flex items-center gap-1"
              >
                <Calendar className="w-3 h-3" />
                Daily
              </Button>
              <Button
                variant={activeTab === 'overall' ? 'treasure' : 'cave'}
                size="sm"
                onClick={() => setActiveTab('overall')}
                className="flex items-center gap-1"
              >
                <Users className="w-3 h-3" />
                Overall
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currentLeaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-2 rounded text-sm ${
                      entry.id === getUserId() ? 'bg-primary/20 border border-primary/40' : 'bg-secondary/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold w-6">#{index + 1}</span>
                      <span className="truncate">{entry.username}</span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {activeTab === 'daily' ? entry.daily_rounds : entry.total_rounds}r
                        </span>
                        <span className={`font-bold ${getCreditsColor(
                          activeTab === 'daily' ? entry.daily_net_credits : entry.total_net_credits
                        )}`}>
                          {formatCredits(
                            activeTab === 'daily' ? entry.daily_net_credits : entry.total_net_credits
                          )} ETH
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show user position if not in top 10 */}
                {userStats && userPosition > 10 && (
                  <>
                    <div className="border-t border-border/30 pt-2 mt-2">
                      <div className="text-xs text-muted-foreground text-center mb-1">Your Position</div>
                      <div className="flex items-center justify-between p-2 rounded text-sm bg-primary/20 border border-primary/40">
                        <div className="flex items-center gap-2">
                          <span className="font-bold w-6">#{userPosition || '?'}</span>
                          <span className="truncate">{userStats.username}</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">
                              {activeTab === 'daily' ? userStats.daily_rounds : userStats.total_rounds}r
                            </span>
                            <span className={`font-bold ${getCreditsColor(
                              activeTab === 'daily' ? userStats.daily_net_credits : userStats.total_net_credits
                            )}`}>
                              {formatCredits(
                                activeTab === 'daily' ? userStats.daily_net_credits : userStats.total_net_credits
                              )} ETH
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {currentLeaderboard.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No data available yet
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="text-xs text-muted-foreground">
                <div>r = rounds played</div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span>Positive = net gain</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <span>Negative = net loss</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
