-- Adiciona valor da compra nas tabelas de movimentação
ALTER TABLE public.point_tokens ADD COLUMN IF NOT EXISTS purchase_amount numeric(10,2) DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS purchase_amount numeric(10,2) DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN public.point_tokens.purchase_amount IS 'Valor total da compra que gerou este token';
COMMENT ON COLUMN public.transactions.purchase_amount IS 'Valor total da compra vinculada a esta transação (se houver)';
