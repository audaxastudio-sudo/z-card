-- Adiciona colunas de coordenadas para busca por proximidade
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Permite que usuários anônimos vejam as lojas (necessário para a tela Explorar)
CREATE POLICY "Stores_Public_View" ON public.stores FOR SELECT USING (true);
