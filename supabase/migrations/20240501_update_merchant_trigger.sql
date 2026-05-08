-- Atualiza a função de trigger para processar os novos campos de parceiro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF (new.raw_user_meta_data->>'role' = 'merchant') THEN
    INSERT INTO public.profiles (id, full_name, avatar_url, role)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'store_name'),
      new.raw_user_meta_data->>'logo_url',
      'merchant'
    );

    INSERT INTO public.stores (
      owner_id, 
      name, 
      address, 
      latitude, 
      longitude, 
      logo_url,
      whatsapp,
      category,
      person_type,
      corporate_name,
      full_name,
      cnpj,
      cpf,
      settings_completed
    )
    VALUES (
      new.id,
      new.raw_user_meta_data->>'store_name',
      new.raw_user_meta_data->>'address',
      (new.raw_user_meta_data->>'latitude')::numeric,
      (new.raw_user_meta_data->>'longitude')::numeric,
      new.raw_user_meta_data->>'logo_url',
      new.raw_user_meta_data->>'whatsapp',
      new.raw_user_meta_data->>'category',
      COALESCE(new.raw_user_meta_data->>'person_type', 'PJ'),
      new.raw_user_meta_data->>'corporate_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'cnpj',
      new.raw_user_meta_data->>'cpf',
      true
    );
  ELSIF (new.raw_user_meta_data->>'role' = 'customer') THEN
    INSERT INTO public.profiles (id, full_name, avatar_url, role)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'avatar_url',
      'customer'
    );

    INSERT INTO public.customers (
      id, 
      full_name, 
      whatsapp, 
      birth_date, 
      address, 
      latitude, 
      longitude, 
      avatar_url
    )
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'whatsapp',
      (new.raw_user_meta_data->>'birth_date')::date,
      new.raw_user_meta_data->>'address',
      (new.raw_user_meta_data->>'latitude')::numeric,
      (new.raw_user_meta_data->>'longitude')::numeric,
      new.raw_user_meta_data->>'avatar_url'
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
