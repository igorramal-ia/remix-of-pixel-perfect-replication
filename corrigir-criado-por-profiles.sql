-- 1. Verificar se os UUIDs de criado_por existem na tabela profiles
SELECT 
  c.id as campanha_id,
  c.nome as campanha_nome,
  c.criado_por,
  c.gestor_id,
  p.id as profile_existe,
  p.nome as criador_nome
FROM campanhas c
LEFT JOIN profiles p ON c.criado_por = p.id
ORDER BY c.criado_em DESC;

-- 2. Verificar quais UUIDs de criado_por NÃO existem em profiles
SELECT 
  c.id,
  c.nome,
  c.criado_por,
  'UUID não existe em profiles' as problema
FROM campanhas c
WHERE c.criado_por IS NOT NULL 
  AND c.criado_por NOT IN (SELECT id FROM profiles);

-- 3. Verificar se os UUIDs estão em auth.users mas não em profiles
SELECT 
  c.id as campanha_id,
  c.nome as campanha_nome,
  c.criado_por,
  u.email as user_email,
  'Existe em auth.users mas não em profiles' as status
FROM campanhas c
INNER JOIN auth.users u ON c.criado_por = u.id
LEFT JOIN profiles p ON c.criado_por = p.id
WHERE p.id IS NULL;

-- 4. SOLUÇÃO: Atualizar criado_por para um usuário válido
-- Opção A: Usar o primeiro admin disponível
UPDATE campanhas 
SET criado_por = (
  SELECT user_id FROM user_roles 
  WHERE role = 'administrador' 
  LIMIT 1
)
WHERE criado_por IS NULL 
   OR criado_por NOT IN (SELECT id FROM profiles);

-- 5. Verificar resultado final
SELECT 
  c.id,
  c.nome,
  c.criado_por,
  p.nome as criador_nome,
  ur.role as criador_role
FROM campanhas c
LEFT JOIN profiles p ON c.criado_por = p.id
LEFT JOIN user_roles ur ON c.criado_por = ur.user_id
ORDER BY c.criado_em DESC;
