-- Add new identity fields to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS person_type TEXT DEFAULT 'PJ' CHECK (person_type IN ('PF', 'PJ'));
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS corporate_name TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS settings_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS whatsapp TEXT;
