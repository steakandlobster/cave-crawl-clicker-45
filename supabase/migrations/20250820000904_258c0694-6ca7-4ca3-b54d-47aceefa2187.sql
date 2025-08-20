-- Add column to store user choices for the entire game
ALTER TABLE game_sessions ADD COLUMN user_choices JSONB DEFAULT '[]'::jsonb;