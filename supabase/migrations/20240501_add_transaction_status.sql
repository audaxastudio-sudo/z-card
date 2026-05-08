-- Adiciona coluna status na tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled'));

-- Atualiza transações de resgate existentes para pending (opcional, para consistência)
UPDATE public.transactions SET status = 'pending' WHERE type = 'redeem' AND status = 'completed';

-- Garante que transações de ganho sejam sempre completed por padrão
ALTER TABLE public.transactions ALTER COLUMN status SET DEFAULT 'completed';
