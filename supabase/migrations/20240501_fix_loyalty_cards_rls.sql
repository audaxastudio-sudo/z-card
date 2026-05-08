-- Habilita RLS na tabela loyalty_cards
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar duplicidade
DROP POLICY IF EXISTS "Users can view their own cards" ON public.loyalty_cards;
DROP POLICY IF EXISTS "Merchants can view cards from their store" ON public.loyalty_cards;
DROP POLICY IF EXISTS "System can insert cards" ON public.loyalty_cards;

-- 1. Permite que o CLIENTE veja seus próprios cartões
CREATE POLICY "Users can view their own cards" ON public.loyalty_cards
    FOR SELECT USING (auth.uid() = customer_id);

-- 2. Permite que o LOJISTA veja os cartões da sua própria loja
-- Nota: Usamos um subquery para verificar se o usuário logado é o dono da loja do cartão
CREATE POLICY "Merchants can view cards from their store" ON public.loyalty_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = loyalty_cards.store_id
            AND stores.owner_id = auth.uid()
        )
    );

-- 3. Permite inserção (necessário para o gatilho de novo usuário)
CREATE POLICY "System can insert cards" ON public.loyalty_cards
    FOR INSERT WITH CHECK (true);

-- 4. Permite que o LOJISTA atualize os cartões da sua loja (dar selos)
CREATE POLICY "Merchants can update cards from their store" ON public.loyalty_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = loyalty_cards.store_id
            AND stores.owner_id = auth.uid()
        )
    );
