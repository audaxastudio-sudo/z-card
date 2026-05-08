-- Atualiza a função de tratamento de novo usuário para diferenciar papéis
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Captura o role dos metadados (padrão é merchant se não vier nada)
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'merchant');

    -- 1. Criar o Perfil (Comum a todos)
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'store_name'), 
        user_role
    );

    -- 2. Criar a Loja (Apenas se for lojista)
    IF (user_role = 'merchant') THEN
        INSERT INTO public.stores (owner_id, name, settings_completed)
        VALUES (
            new.id, 
            COALESCE(new.raw_user_meta_data->>'store_name', 'Minha Loja'),
            FALSE
        );
    END IF;

    -- 3. Adicionar dados extras ao perfil se for cliente
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
