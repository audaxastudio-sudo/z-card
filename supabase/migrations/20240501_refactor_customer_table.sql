-- 1. Garante que a tabela customers existe e tem os campos corretos
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    whatsapp TEXT,
    birth_date DATE,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilita RLS na tabela customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS para customers
CREATE POLICY "Users can view their own customer data" ON public.customers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own customer data" ON public.customers
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "System can insert customer data" ON public.customers
    FOR INSERT WITH CHECK (true);

-- 4. Ajustar a tabela profiles para ter o avatar_url (único lugar da foto de perfil pessoal)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
