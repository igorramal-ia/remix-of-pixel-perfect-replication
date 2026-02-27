-- Debug: Verificar usuário recém-criado

-- 1. Ver todos os coordenadores e seus territórios
SELECT 
  p.id,
  p.nome,
  p.email,
  p.territorios,
  ur.role,
  p.criado_em
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador'
ORDER BY p.criado_em DESC
LIMIT 5;

-- 2. Ver especificamente o último usuário criado
SELECT 
  id,
  nome,
  email,
  telefone,
  territorios,
  criado_em
FROM profiles 
ORDER BY criado_em DESC
LIMIT 1;

-- 3. Verificar se territorios está como JSONB ou TEXT
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'territorios';

-- 4. Ver formato exato dos territórios salvos
SELECT 
  nome,
  territorios,
  pg_typeof(territorios) as tipo_dado
FROM profiles 
WHERE territorios IS NOT NULL
ORDER BY criado_em DESC
LIMIT 3;
