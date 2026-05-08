-- TABELA DE CAPTURA DE LEADS (LOJISTAS INTERESSADOS)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  business_name text,
  category text,
  status text DEFAULT 'new', -- new, contacted, converted
  created_at timestamp with time zone DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Permitir que qualquer um insira um lead (Público)
CREATE POLICY "Permitir inserção pública de leads" ON public.leads
  FOR INSERT WITH CHECK (true);

-- Permitir que apenas admins vejam os leads
CREATE POLICY "Apenas admins veem leads" ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
