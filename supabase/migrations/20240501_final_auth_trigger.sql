-- Função Final de Tratamento de Novo Usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role TEXT;
BEGIN
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'merchant');

    -- 1. Inserir no PROFILES (Básico para todos)
    INSERT INTO public.profiles (id, full_name, role, avatar_url)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'store_name'), 
        user_role,
        new.raw_user_meta_data->>'avatar_url' -- Foto inicial se houver
    );

    -- 2. Se for LOJISTA -> Inserir na tabela STORES
    IF (user_role = 'merchant') THEN
        INSERT INTO public.stores (owner_id, name, logo_url, settings_completed)
        VALUES (
            new.id, 
            COALESCE(new.raw_user_meta_data->>'store_name', 'Minha Loja'),
            new.raw_user_meta_data->>'logo_url',
            FALSE
        );
    END IF;

    -- 3. Se for CLIENTE -> Inserir na tabela CUSTOMERS
    IF (user_role = 'customer') THEN
        INSERT INTO public.customers (id, whatsapp, birth_date, address)
        VALUES (
            new.id, 
            new.raw_user_meta_data->>'whatsapp',
            (new.raw_user_meta_data->>'birth_date')::DATE,
            new.raw_user_meta_data->>'address'
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
