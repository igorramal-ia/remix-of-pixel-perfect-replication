-- Script simplificado de limpeza para produção
-- Admin: adm@df.com (ID: 108f4c18-d956-47e2-a41c-39d6ea378949)

BEGIN;

-- 1. Limpar dados de teste (mantém endereços e proprietários)
DELETE FROM historico_mudancas_endereco;
DELETE FROM relatorios_gerados;
DELETE FROM instalacoes;
DELETE FROM campanha_coordenadores;
DELETE FROM campanhas;
DELETE FROM notificacoes;
DELETE FROM inventario_historico;

-- 2. Remover usuários de teste (mantém apenas admin)
DELETE FROM user_roles 
WHERE user_id != '108f4c18-d956-47e2-a41c-39d6ea378949';

DELETE FROM profiles 
WHERE id != '108f4c18-d956-47e2-a41c-39d6ea378949';

-- 3. Verificar resultado
SELECT 'Campanhas' as tabela, COUNT(*) as registros FROM campanhas
UNION ALL
SELECT 'Instalações', COUNT(*) FROM instalacoes
UNION ALL
SELECT 'Endereços (MANTIDOS)', COUNT(*) FROM enderecos
UNION ALL
SELECT 'Relatórios', COUNT(*) FROM relatorios_gerados
UNION ALL
SELECT 'Usuários', COUNT(*) FROM profiles
UNION ALL
SELECT 'Proprietários (MANTIDOS)', COUNT(*) FROM proprietarios;

COMMIT;

-- NOTA: Você ainda precisa deletar os outros usuários manualmente em:
-- Authentication > Users (delete todos exceto adm@df.com)
