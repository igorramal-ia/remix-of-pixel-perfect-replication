-- DIAGNÓSTICO: Verificar por que criado_por não retorna nome

-- 1. Ver dados das campanhas e se o UUID existe em profiles
SELECT 
  c.id as campanha_id,
  c.nome as campanha_nome,
  c.criado_por as uuid_criado_por,
  c.gestor_id as uuid_gestor,
  p.id as profile_existe,
  p.nome as criador_nome_profile
FROM campanhas c
LEFT JOIN profiles p ON c.criado_por = p.id
ORDER BY c.criado_em DESC;

-- 2. Ver todos os profiles disponíveis
SELECT id, nome, email FROM profiles ORDER BY nome;

-- 3. Ver todos os usuários em auth.users
SELECT id, email FROM auth.users ORDER BY email;
