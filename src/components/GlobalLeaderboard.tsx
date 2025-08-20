
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, TrendingDown, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStats, useOverallStats } from "@/hooks/useGameStats";
import { useAchievements } from "@/hooks/useAchievements";

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
  const { syncWithDatabase } = useAchievements();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Use authenticated user id for consistency with backend updates
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const updateUserStats = async () => {
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Get user profile for username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
        
      const username = profile?.username || `Explorer${userId.slice(-6)}`;
      
      // Get actual stats from completed games instead of localStorage
      const { data: dailyGames } = await supabase
        .from('game_sessions')
        .select('passages_navigated, net_result')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', today + 'T00:00:00Z')
        .lt('completed_at', today + 'T23:59:59Z');

      const { data: allGames } = await supabase
        .from('game_sessions')
        .select('passages_navigated, net_result')
        .eq('user_id', userId)
        .eq('status', 'completed');

      const dailyRounds = dailyGames?.reduce((sum, game) => sum + (game.passages_navigated || 0), 0) || 0;
      const dailyNetCredits = dailyGames?.reduce((sum, game) => sum + (game.net_result || 0), 0) || 0;
      const totalRounds = allGames?.reduce((sum, game) => sum + (game.passages_navigated || 0), 0) || 0;
      const totalNetCredits = allGames?.reduce((sum, game) => sum + (game.net_result || 0), 0) || 0;
      
      // Update or insert user stats with actual game data
      const { error } = await supabase
        .from('global_leaderboard')
        .upsert({
          id: userId,
          username,
          daily_rounds: dailyRounds,
          daily_net_credits: dailyNetCredits,
          total_rounds: totalRounds,
          total_net_credits: totalNetCredits,
          date: today,
        }, {
          onConflict: 'id,date'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };

  const fetchLeaderboards = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Sync achievements with database first
      await syncWithDatabase();
      
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
        .eq('date', today)
        .maybeSingle();

      if (userError) throw userError;

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
    if (isOpen && userId) {
      fetchLeaderboards();
    }
  }, [isOpen, userId]);

  const formatCredits = (credits: number) => {
    // Show at least 5 significant digits or 3 decimal places, whichever is more
    const absValue = Math.abs(credits);
    let precision = 3;
    if (absValue > 0 && absValue < 0.001) {
      precision = 5;
    } else if (absValue < 0.01) {
      precision = 4;
    }
    return credits >= 0 ? `+${credits.toFixed(precision)}` : `${credits.toFixed(precision)}`;
  };

  const getCreditsColor = (credits: number) => {
    return credits >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const currentLeaderboard = activeTab === 'daily' ? dailyLeaderboard : overallLeaderboard;
  const userPosition = currentLeaderboard.findIndex(entry => entry.id === userId) + 1;

  return (
    <div className="relative" style={{ zIndex: 10000 }}>
      <Button
        variant="treasure"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Leaderboard button clicked, current isOpen:", isOpen);
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 bg-gradient-treasure text-primary-foreground hover:scale-105 shadow-treasure font-bold border-2 border-treasure-gold cursor-pointer"
        style={{ 
          zIndex: 10000,
          pointerEvents: 'auto',
          position: 'relative'
        }}
      >
        <Trophy className="w-4 h-4" />
        Leaderboard
      </Button>

      {isOpen && (
        <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-hidden bg-card/95 backdrop-blur-sm border-border shadow-2xl" 
              style={{ 
                zIndex: 10000,
                pointerEvents: 'auto'
              }}>
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
                      entry.id === userId ? 'bg-primary/20 border border-primary/40' : 'bg-secondary/20'
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
    </div>
  );
};
