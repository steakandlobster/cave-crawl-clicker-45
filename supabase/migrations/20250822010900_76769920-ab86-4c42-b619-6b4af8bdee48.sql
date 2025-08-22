-- Add wallet_address column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN wallet_address text;

-- Add blockchain-related columns to game_sessions table
ALTER TABLE public.game_sessions 
ADD COLUMN blockchain_game_id text,
ADD COLUMN contract_address text,
ADD COLUMN transaction_hash text,
ADD COLUMN verification_hash text,
ADD COLUMN server_seed text;

-- Create index on wallet_address for efficient lookups
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);

-- Create index on blockchain_game_id for efficient blockchain lookups
CREATE INDEX idx_game_sessions_blockchain_game_id ON public.game_sessions(blockchain_game_id);

-- Add RLS policy to allow users to access profiles by wallet address
CREATE POLICY "Users can view profiles by wallet address" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id OR wallet_address IS NOT NULL);

-- Update the existing user creation trigger to handle wallet addresses
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, last_login_at, wallet_address)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'Explorer' || substring(NEW.id::text from 1 for 8)),
    NOW(),
    NEW.raw_user_meta_data->>'wallet_address'
  );
  RETURN NEW;
END;
$$;