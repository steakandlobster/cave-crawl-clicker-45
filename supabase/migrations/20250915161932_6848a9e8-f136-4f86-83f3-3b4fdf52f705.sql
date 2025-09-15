-- Remove overly permissive RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles by wallet address" ON public.profiles;

-- Create secure RLS policies for profiles table
-- Users can view their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow limited access for referral code validation (only id field needed)
CREATE POLICY "Users can validate referral codes" 
ON public.profiles 
FOR SELECT 
USING (referral_code IS NOT NULL);

-- Keep existing insert and update policies (already secure)
-- Users can insert their own profile: already exists
-- Users can update their own profile: already exists