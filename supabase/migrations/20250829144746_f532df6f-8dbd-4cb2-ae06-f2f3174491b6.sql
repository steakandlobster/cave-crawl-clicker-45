-- Add unique constraint for global_leaderboard table to support upserts
-- This allows ON CONFLICT operations for user stats per day
ALTER TABLE public.global_leaderboard 
ADD CONSTRAINT global_leaderboard_user_date_unique 
UNIQUE (id, date);