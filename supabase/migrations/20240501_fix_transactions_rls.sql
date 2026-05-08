-- Habilita RLS na tabela transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Merchants can view transactions from their store" ON public.transactions;

-- 1. Permite que o CLIENTE veja suas próprias transações
-- Nota: Transações são vinculadas a um card_id, que por sua vez é vinculado a um customer_id
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.loyalty_cards
            WHERE loyalty_cards.id = transactions.card_id
            AND loyalty_cards.customer_id = auth.uid()
        )
    );

-- 2. Permite que o LOJISTA veja as transações da sua própria loja
CREATE POLICY "Merchants can view transactions from their store" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.loyalty_cards
            JOIN public.stores ON stores.id = loyalty_cards.store_id
            WHERE loyalty_cards.id = transactions.card_id
            AND stores.owner_id = auth.uid()
        )
    );

-- 3. Permite que o LOJISTA insira transações (dar selos/resgatar)
CREATE POLICY "Merchants can insert transactions for their cards" ON public.transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.loyalty_cards
            JOIN public.stores ON stores.id = loyalty_cards.store_id
            WHERE loyalty_cards.id = card_id
            AND stores.owner_id = auth.uid()
        )
    );
