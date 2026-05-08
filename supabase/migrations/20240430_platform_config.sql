-- Create table for platform configurations
CREATE TABLE IF NOT EXISTS public.platform_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default subscription plans
INSERT INTO public.platform_config (key, value)
VALUES ('subscription_plans', '[
    {
        "id": "plan_mensal",
        "name": "Plano Mensal",
        "price": 149.90,
        "cycle": "MONTHLY",
        "description": "Ideal para começar seu ecossistema de fidelidade."
    },
    {
        "id": "plan_anual",
        "name": "Plano Anual",
        "price": 1499.00,
        "cycle": "YEARLY",
        "description": "Economize 2 meses com o pagamento anual."
    }
]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
