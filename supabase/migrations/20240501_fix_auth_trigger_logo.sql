-- Atualiza a função de tratamento de novo usuário para incluir logo_url
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role TEXT;
BEGIN
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'merchant');

    -- 1. Criar o Perfil
    INSERT INTO public.profiles (id, full_name, role, avatar_url)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'store_name'), 
        user_role,
        new.raw_user_meta_data->>'avatar_url' -- Para clientes
    );

    -- 2. Criar a Loja (Com logo_url para lojistas)
    IF (user_role = 'merchant') THEN
        INSERT INTO public.stores (owner_id, name, settings_completed, logo_url)
        VALUES (
            new.id, 
            COALESCE(new.raw_user_meta_data->>'store_name', 'Minha Loja'),
            FALSE,
            new.raw_user_meta_data->>'logo_url' -- Para lojistas
        );
    END IF;

    -- 3. Dados extras do cliente
    IF (user_role = 'customer') THEN
        UPDATE public.profiles 
        SET 
            whatsapp = new.raw_user_meta_data->>'whatsapp',
            birth_date = (new.raw_user_meta_data->>'birth_date')::DATE,
            address = new.raw_user_meta_data->'address_json'
        WHERE id = new.id;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
