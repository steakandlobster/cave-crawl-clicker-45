-- Fix function search_path and adjust numeric types for ETH amounts

-- 1) Harden set_updated_at function with explicit search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) Use double precision for ETH amounts
ALTER TABLE public.game_sessions
  ALTER COLUMN amount_wagered TYPE double precision USING amount_wagered::double precision,
  ALTER COLUMN net_result TYPE double precision USING net_result::double precision;

ALTER TABLE public.game_rounds
  ALTER COLUMN credits_won TYPE double precision USING credits_won::double precision;