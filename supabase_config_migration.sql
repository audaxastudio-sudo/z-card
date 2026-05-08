-- Tabela de configuração global da plataforma
CREATE TABLE IF NOT EXISTS platform_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserir preços iniciais dos planos
INSERT INTO platform_config (key, value)
VALUES 
    ('subscription_plans', '[
        {"id": "monthly", "name": "Mensal", "price": 14.50, "cycle": "MONTHLY"},
        {"id": "yearly", "name": "Anual", "price": 145.00, "cycle": "YEARLY"}
    ]'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Habilitar RLS
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- Apenas admins (ou service_role) podem editar
CREATE POLICY "Admins can manage platform_config" ON platform_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Todos podem ler (para o lojista ver o preço no Billing)
CREATE POLICY "Everyone can read platform_config" ON platform_config
    FOR SELECT USING (true);
