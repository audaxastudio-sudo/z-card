-- ==========================================
-- ESTRUTURA DE BANCO DE DADOS Z-CARD
-- ==========================================

-- 1. Tabela de Perfis de Usuários (Extensão do Auth)
-- Armazena se o usuário é Lojista ou Cliente
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('merchant', 'customer')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Lojas
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  logo_url TEXT,
  description TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Recompensas (Configuradas pelo Lojista)
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  points_needed INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Cartões Fidelidade (O saldo do cliente na loja)
CREATE TABLE IF NOT EXISTS public.loyalty_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  stamps_accumulated INTEGER DEFAULT 0 NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(customer_id, store_id)
);

-- 5. Tabela de Transações (Histórico de ganhos e resgates)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.loyalty_cards(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('earn', 'redeem')) NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Exemplo: Qualquer um pode ver lojas e recompensas, mas só o dono edita
CREATE POLICY "Lojas são públicas" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Lojista edita sua loja" ON public.stores FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Recompensas são públicas" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Lojista edita recompensas" ON public.rewards FOR ALL USING (
  auth.uid() IN (SELECT owner_id FROM public.stores WHERE id = store_id)
);

-- Clientes só veem seus próprios cartões e transações
CREATE POLICY "Clientes veem seus cartões" ON public.loyalty_cards FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Clientes veem suas transações" ON public.transactions FOR SELECT USING (
  card_id IN (SELECT id FROM public.loyalty_cards WHERE customer_id = auth.uid())
);
