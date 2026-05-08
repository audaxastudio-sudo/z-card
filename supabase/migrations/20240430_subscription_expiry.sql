-- Adicionar data de expiração da assinatura
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
