-- Add referral_code column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN referral_code text UNIQUE;

-- Create index on referral_code for efficient lookups
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- Update existing profiles to have referral codes
UPDATE public.profiles 
SET referral_code = 'CAVE' || upper(substring(md5(random()::text) from 1 for 6))
WHERE referral_code IS NULL;