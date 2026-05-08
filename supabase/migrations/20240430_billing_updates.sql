-- Add billing address fields to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS address_number TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS complement TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Add trial management fields
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS trial_until TIMESTAMPTZ;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_trial_granted BOOLEAN DEFAULT FALSE;

-- Update RLS if necessary (usually stores are managed by owners)
-- No changes needed to RLS for these columns as they follow the existing store policy
