-- Verificar se os territórios foram salvos no banco

-- 1. Ver o usuário criado (cloclo@df.com)
SELECT 
  id,
  nome,
  email,
  telefone,
  territorios,
  criado_em
FROM profiles 
WHERE email = 'cloclo@df.com';

-- 2. Ver a role do usuário
SELECT 
  user_id,
  role
FROM user_roles 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'cloclo@df.com');

-- 3. Ver todos os coordenadores e seus territórios
SELECT 
  p.id,
  p.nome,
  p.email,
  p.territorios,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador'
ORDER BY p.criado_em DESC;
