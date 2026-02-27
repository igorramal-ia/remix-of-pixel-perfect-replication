-- Script para verificar se territórios estão persistindo no banco

-- 1. Verificar estrutura da tabela profiles
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se a coluna territorios existe e seu tipo
SELECT 
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'territorios';

-- 3. Listar todos os usuários com seus territórios
SELECT 
  id,
  nome,
  email,
  territorios,
  pg_typeof(territorios) as tipo_territorios
FROM profiles
ORDER BY criado_em DESC;

-- 4. Verificar coordenador específico
SELECT 
  id, 
  nome, 
  email,
  territorios,
  territorios::text as territorios_texto
FROM profiles 
WHERE email = 'coordenador@df.com';

-- 5. Contar usuários com territórios não nulos
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(territorios) as com_territorios,
  COUNT(*) - COUNT(territorios) as sem_territorios
FROM profiles;

-- 6. Ver territórios em formato legível
SELECT 
  nome,
  email,
  jsonb_pretty(territorios) as territorios_formatado
FROM profiles
WHERE territorios IS NOT NULL;

-- 7. Testar UPDATE manual (SUBSTITUIR [user_id] pelo ID real)
-- UPDATE profiles 
-- SET territorios = '{"cidades": ["São Paulo"], "comunidades": ["Heliópolis"]}'::jsonb
-- WHERE email = 'coordenador@df.com'
-- RETURNING id, nome, territorios;

-- 8. Verificar RLS policies que podem estar bloqueando UPDATE
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 9. Verificar se há triggers na tabela profiles
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';
