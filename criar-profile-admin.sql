-- Verificar se o admin tem profile
SELECT 
  u.id,
  u.email,
  p.id as profile_id,
  p.nome as profile_nome
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'adm@df.com';

-- Criar profile para o admin se não existir
INSERT INTO profiles (id, nome, email)
SELECT 
  u.id,
  'Administrador',  -- Nome padrão
  u.email
FROM auth.users u
WHERE u.email = 'adm@df.com'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Verificar resultado
SELECT 
  c.id,
  c.nome as campanha,
  c.criado_por,
  p.nome as criador_nome
FROM campanhas c
LEFT JOIN profiles p ON c.criado_por = p.id
ORDER BY c.criado_em DESC;
