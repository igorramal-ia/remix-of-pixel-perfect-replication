-- Adicionar coluna ativo à tabela enderecos
ALTER TABLE enderecos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Atualizar endereços existentes para ativo = true
UPDATE enderecos SET ativo = true WHERE ativo IS NULL;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_enderecos_ativo ON enderecos(ativo);

-- Comentário
COMMENT ON COLUMN enderecos.ativo IS 'Indica se o endereço está ativo (true) ou foi excluído logicamente (false)';
