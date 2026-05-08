-- Função de Tratamento de Novo Usuário (Versão Robusta)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role TEXT;
    initial_store_id_text TEXT;
    initial_store_id UUID;
BEGIN
    -- Captura segura dos metadados
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'merchant');
    initial_store_id_text := new.raw_user_meta_data->>'initial_store_id';

    -- Cast seguro para UUID (evita erro se for string vazia)
    IF initial_store_id_text IS NOT NULL AND initial_store_id_text <> '' THEN
        initial_store_id := initial_store_id_text::UUID;
    END IF;

    -- 1. Inserir no PROFILES
    INSERT INTO public.profiles (id, full_name, role, avatar_url)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'store_name'), 
        user_role,
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'logo_url')
    );

    -- 2. Se for LOJISTA
    IF (user_role = 'merchant') THEN
        INSERT INTO public.stores (
            owner_id, 
            name, 
            logo_url, 
            address, 
            latitude, 
            longitude, 
            settings_completed
        )
        VALUES (
            new.id, 
            COALESCE(new.raw_user_meta_data->>'store_name', 'Minha Unidade'),
            new.raw_user_meta_data->>'logo_url',
            new.raw_user_meta_data->>'address',
            (new.raw_user_meta_data->>'latitude')::DECIMAL,
            (new.raw_user_meta_data->>'longitude')::DECIMAL,
            CASE WHEN new.raw_user_meta_data->>'address' IS NOT NULL THEN TRUE ELSE FALSE END
        );
    END IF;

    -- 3. Se for CLIENTE
    IF (user_role = 'customer') THEN
        INSERT INTO public.customers (id, whatsapp, birth_date, address, latitude, longitude)
        VALUES (
            new.id, 
            new.raw_user_meta_data->>'whatsapp',
            (new.raw_user_meta_data->>'birth_date')::DATE,
            new.raw_user_meta_data->>'address',
            (new.raw_user_meta_data->>'latitude')::DECIMAL,
            (new.raw_user_meta_data->>'longitude')::DECIMAL
        );

        -- 4. Criar Cartão de Fidelidade Inicial
        IF (initial_store_id IS NOT NULL) THEN
            INSERT INTO public.loyalty_cards (customer_id, store_id, stamps_accumulated)
            VALUES (new.id, initial_store_id, 0);
        END IF;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
