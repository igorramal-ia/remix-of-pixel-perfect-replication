-- Adicionar campo telefone na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Comentário
COMMENT ON COLUMN public.profiles.telefone IS 
  'Telefone de contato do usuário (formato livre)';

-- Verificar estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
