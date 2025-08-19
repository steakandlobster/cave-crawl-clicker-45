-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create game sessions table for provably fair games
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_hash TEXT NOT NULL, -- Hash for provably fair verification
  pre_generated_results JSONB NOT NULL, -- Encrypted/hashed results generated before game starts
  amount_wagered INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  passages_navigated INTEGER DEFAULT 0, -- Only set when game completes
  final_result TEXT, -- Only set when game completes ('win', 'loss')
  net_result INTEGER, -- Only set when game completes (profit/loss)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ, -- Only set when game completes
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create game rounds table for tracking individual rounds within a game
CREATE TABLE public.game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  cave_selected INTEGER NOT NULL,
  treasure_found TEXT NOT NULL,
  credits_won INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create achievement progress table
CREATE TABLE public.achievement_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_key TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- Create indexes for better performance
CREATE INDEX profiles_username_idx ON public.profiles(username);
CREATE INDEX profiles_referred_by_idx ON public.profiles(referred_by);
CREATE INDEX game_sessions_user_id_idx ON public.game_sessions(user_id);
CREATE INDEX game_sessions_status_idx ON public.game_sessions(status);
CREATE INDEX game_sessions_created_at_idx ON public.game_sessions(created_at);
CREATE INDEX game_rounds_game_session_id_idx ON public.game_rounds(game_session_id);
CREATE INDEX achievement_progress_user_id_idx ON public.achievement_progress(user_id);
CREATE INDEX achievement_progress_achievement_key_idx ON public.achievement_progress(achievement_key);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for game_sessions
CREATE POLICY "Users can view their own game sessions" ON public.game_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own game sessions" ON public.game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own game sessions" ON public.game_sessions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for game_rounds
CREATE POLICY "Users can view their own game rounds" ON public.game_rounds 
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.game_sessions WHERE id = game_session_id));
CREATE POLICY "Users can insert their own game rounds" ON public.game_rounds 
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.game_sessions WHERE id = game_session_id));

-- RLS Policies for achievement_progress
CREATE POLICY "Users can view their own achievement progress" ON public.achievement_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievement progress" ON public.achievement_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievement progress" ON public.achievement_progress FOR UPDATE USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_achievement_progress_updated_at
  BEFORE UPDATE ON public.achievement_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, last_login_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'Explorer' || substring(NEW.id::text from 1 for 8)),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();