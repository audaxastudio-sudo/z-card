-- Garante que as colunas existam
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Garante que o bucket 'avatars' seja público e acessível
UPDATE storage.buckets SET public = true WHERE id = 'avatars';
