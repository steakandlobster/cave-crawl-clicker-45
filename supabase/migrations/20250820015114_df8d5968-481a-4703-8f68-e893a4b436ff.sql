-- Add session_id to game_sessions table for better session tracking
ALTER TABLE public.game_sessions 
ADD COLUMN session_id text;