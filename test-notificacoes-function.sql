-- Script para testar a função contar_notificacoes_nao_lidas

-- 1. Verificar se a função existe
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'contar_notificacoes_nao_lidas'
  AND routine_schema = 'public';

-- 2. Ver a definição da função
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'contar_notificacoes_nao_lidas';

-- 3. Listar todos os usuários com notificações
SELECT 
  p.id,
  p.nome,
  p.email,
  COUNT(n.id) as total_notificacoes,
  COUNT(CASE WHEN n.lida = false THEN 1 END) as nao_lidas
FROM profiles p
LEFT JOIN notificacoes n ON n.user_id = p.id
GROUP BY p.id, p.nome, p.email
HAVING COUNT(n.id) > 0;

-- 4. Testar a função com um user_id específico
-- SUBSTITUIR '[user_id]' pelo ID real de um usuário
-- SELECT contar_notificacoes_nao_lidas('[user_id]'::uuid);

-- 5. Criar notificação de teste (opcional)
-- SUBSTITUIR '[user_id]' pelo ID real de um usuário
-- INSERT INTO notificacoes (user_id, titulo, mensagem, lida)
-- VALUES ('[user_id]'::uuid, 'Teste', 'Notificação de teste', false);

-- 6. Verificar se a contagem aumentou
-- SELECT contar_notificacoes_nao_lidas('[user_id]'::uuid);
