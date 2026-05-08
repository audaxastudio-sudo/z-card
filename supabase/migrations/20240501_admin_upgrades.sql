-- Tabela para configurações globais da plataforma
CREATE TABLE IF NOT EXISTS public.platform_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir planos padrão se não existirem
INSERT INTO public.platform_config (key, value)
VALUES ('subscription_plans', '[
    {"id": "monthly", "name": "Plano Mensal", "price": 99.90, "cycle": "MONTHLY"},
    {"id": "yearly", "name": "Plano Anual", "price": 999.00, "cycle": "YEARLY"}
]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS e permitir apenas Admins
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage platform_config" 
ON public.platform_config 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Anyone can view platform_config" 
ON public.platform_config 
FOR SELECT 
TO authenticated 
USING (true);
-- Tabela para registrar pagamentos reais recebidos (viva Webhook)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id),
    asaas_payment_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL, -- RECEIVED, CONFIRMED, etc
    payment_date TIMESTAMPTZ DEFAULT now(),
    cycle TEXT, -- MONTHLY, YEARLY
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payments" 
ON public.payments 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
