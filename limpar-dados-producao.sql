-- ============================================
-- SCRIPT DE LIMPEZA PARA PRODUÇÃO
-- ============================================
-- Este script remove dados de TESTE mantendo:
-- ✅ Endereços (dados reais)
-- ✅ Proprietários (dados reais)
-- ✅ Usuário admin
--
-- Remove:
-- ❌ Campanhas de teste
-- ❌ Instalações de teste
-- ❌ Relatórios de teste
-- ❌ Usuários de teste
-- ============================================

-- ATENÇÃO: Este script é IRREVERSÍVEL!
-- Execute apenas se tiver certeza!

BEGIN;

-- 1. Deletar arquivos do storage (fotos de instalações)
-- NOTA: Isso precisa ser feito manualmente no Supabase Dashboard
-- Vá em Storage > instalacoes > Delete all files

-- 2. Deletar arquivos do storage (relatórios)
-- NOTA: Isso precisa ser feito manualmente no Supabase Dashboard
-- Vá em Storage > relatorios > Delete all files

-- 3. Limpar tabelas de dados (ordem importa por causa de foreign keys)
-- IMPORTANTE: Mantém endereços e proprietários (dados reais)
DELETE FROM historico_mudancas_endereco;
DELETE FROM relatorios_gerados;
DELETE FROM instalacoes;
DELETE FROM campanha_coordenadores;
DELETE FROM campanhas;
DELETE FROM notificacoes;
DELETE FROM inventario_historico;

-- 4. NÃO deletar endereços (MANTER!)
-- DELETE FROM enderecos; -- COMENTADO - mantém endereços reais

-- 5. NÃO deletar proprietários (MANTER!)
-- DELETE FROM proprietarios; -- COMENTADO - mantém proprietários reais

-- 6. Remover todos os usuários EXCETO o admin
-- Primeiro, identificar o ID do admin
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Buscar ID do usuário admin pelo role (mais confiável que email)
    SELECT user_id INTO admin_id 
    FROM user_roles 
    WHERE role = 'administrador'
    LIMIT 1;
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Usuário admin não encontrado! Verifique se existe um usuário com role "administrador".';
    END IF;
    
    -- Deletar user_roles de outros usuários
    DELETE FROM user_roles WHERE user_id != admin_id;
    
    -- Deletar profiles de outros usuários
    DELETE FROM profiles WHERE id != admin_id;
    
    -- Deletar usuários do auth (exceto admin)
    -- NOTA: Isso precisa ser feito via Supabase Dashboard ou API
    -- Vá em Authentication > Users e delete manualmente
    
    RAISE NOTICE 'Admin ID: %', admin_id;
    RAISE NOTICE 'Limpeza concluída! Apenas o admin foi mantido.';
END $$;

-- 7. Resetar sequences (opcional - para IDs começarem do 1 novamente)
-- Não aplicável para UUIDs, mas útil se houver sequences

-- 8. Verificar o que sobrou
SELECT 'Campanhas' as tabela, COUNT(*) as registros FROM campanhas
UNION ALL
SELECT 'Instalações', COUNT(*) FROM instalacoes
UNION ALL
SELECT 'Endereços (MANTIDOS)', COUNT(*) FROM enderecos
UNION ALL
SELECT 'Relatórios', COUNT(*) FROM relatorios_gerados
UNION ALL
SELECT 'Histórico Mudanças', COUNT(*) FROM historico_mudancas_endereco
UNION ALL
SELECT 'Usuários (profiles)', COUNT(*) FROM profiles
UNION ALL
SELECT 'Usuários (user_roles)', COUNT(*) FROM user_roles
UNION ALL
SELECT 'Proprietários (MANTIDOS)', COUNT(*) FROM proprietarios
UNION ALL
SELECT 'Notificações', COUNT(*) FROM notificacoes;

COMMIT;

-- ============================================
-- APÓS EXECUTAR ESTE SCRIPT:
-- ============================================
-- 1. Vá no Supabase Dashboard > Storage
--    - Bucket "instalacoes": Delete all files
--    - Bucket "relatorios": Delete all files
--
-- 2. Vá no Supabase Dashboard > Authentication > Users
--    - Delete todos os usuários EXCETO admin@digitalfavela.com.br
--
-- 3. Verifique se o admin ainda consegue fazer login
--
-- 4. Faça commit e push do código
--
-- 5. Libere acesso para novos usuários
-- ============================================
