-- 1. Adiciona a coluna avatar_url na tabela de perfis (se não existir)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Criar o bucket de armazenamento para avatares (se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Remover políticas antigas para evitar conflitos (se houver)
DROP POLICY IF EXISTS "Avatar_Public_Read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar_User_Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar_User_Delete" ON storage.objects;

-- 4. Novas Políticas de Segurança para o Bucket de Avatares

-- SELECT: Permite que qualquer um veja os avatares (público)
CREATE POLICY "Avatar_Public_Read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- INSERT: Permite upload por usuários autenticados OU anônimos (para o cadastro)
-- Nota: Usamos nomes de arquivos aleatórios para evitar colisões
CREATE POLICY "Avatar_Insert_Policy" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

-- UPDATE/DELETE: Apenas o dono pode alterar ou deletar seu próprio arquivo
-- Se o arquivo estiver em uma pasta com o UID do usuário, validamos aqui
CREATE POLICY "Avatar_Owner_Update" ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar_Owner_Delete" ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
