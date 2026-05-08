-- ADICIONAR COLUNA PARA PUSH NOTIFICATIONS
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_token text;

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.push_token IS 'Token do dispositivo para notificações push (FCM/OneSignal)';
