-- Verificar especificamente o usuário Arlindo

-- 1. Ver dados do Arlindo
SELECT 
  p.id,
  p.nome,
  p.email,
  p.territorios,
  ur.role,
  p.criado_em
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email = 'arar@df.com' OR p.nome = 'Arlindo';

-- 2. Ver se tem role
SELECT 
  user_id,
  role
FROM user_roles
WHERE user_id = (SELECT id FROM profiles WHERE nome = 'Arlindo');

-- 3. Ver territórios em detalhe
SELECT 
  nome,
  territorios,
  territorios->'cidades' as cidades,
  territorios->'comunidades' as comunidades,
  jsonb_array_length(COALESCE(territorios->'comunidades', '[]'::jsonb)) as total_comunidades
FROM profiles 
WHERE nome = 'Arlindo';
