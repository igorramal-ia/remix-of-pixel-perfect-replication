-- ============================================
-- APLICAR MELHORIAS DE PRIORIDADE ALTA
-- ============================================
-- Data: 01/03/2026
-- Descrição: Adiciona coluna 'ativo' para soft delete de endereços
-- ============================================

-- 1. Adicionar coluna ativo
ALTER TABLE enderecos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 2. Atualizar endereços existentes
UPDATE enderecos SET ativo = true WHERE ativo IS NULL;

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_enderecos_ativo ON enderecos(ativo);

-- 4. Adicionar comentário
COMMENT ON COLUMN enderecos.ativo IS 'Indica se o endereço está ativo (true) ou foi excluído logicamente (false)';

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se a coluna foi criada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'enderecos' AND column_name = 'ativo';

-- Verificar se o índice foi criado
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'enderecos' AND indexname = 'idx_enderecos_ativo';

-- Contar endereços ativos vs inativos
SELECT 
  ativo,
  COUNT(*) as total
FROM enderecos
GROUP BY ativo;

-- ============================================
-- SUCESSO!
-- ============================================
-- ✅ Coluna 'ativo' adicionada
-- ✅ Índice criado para performance
-- ✅ Todos os endereços existentes marcados como ativos
-- ============================================
