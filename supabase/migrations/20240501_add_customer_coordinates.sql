-- Adiciona colunas de coordenadas para a tabela de clientes (membros)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
