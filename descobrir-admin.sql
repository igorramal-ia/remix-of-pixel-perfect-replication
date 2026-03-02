-- Descobrir qual é o usuário admin

-- 1. Listar todos os usuários
SELECT 
  u.id,
  u.email,
  u.created_at,
  p.nome,
  ur.role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at;

-- 2. Buscar especificamente por admin
SELECT 
  u.id,
  u.email,
  ur.role
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'administrador'
   OR u.email ILIKE '%admin%'
   OR u.email ILIKE '%adm%';
