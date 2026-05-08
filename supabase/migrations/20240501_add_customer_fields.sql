-- Adiciona colunas específicas para clientes na tabela de perfis
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address JSONB;

-- Garante que o role 'customer' seja permitido na constraint (se houver uma)
DO $$ 
BEGIN 
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('merchant', 'customer', 'admin'));
EXCEPTION 
    WHEN others THEN NULL; 
END $$;
