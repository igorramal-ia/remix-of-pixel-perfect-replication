-- ============================================
-- APLICAR SISTEMA DE HISTÓRICO DE MUDANÇAS
-- ============================================
-- Data: 01/03/2026
-- Descrição: Cria tabela para registrar substituições de endereço
-- ============================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS historico_mudancas_endereco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instalacao_id UUID REFERENCES instalacoes(id) ON DELETE CASCADE,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  endereco_antigo_id UUID REFERENCES enderecos(id),
  endereco_novo_id UUID REFERENCES enderecos(id),
  motivo TEXT NOT NULL,
  data_mudanca TIMESTAMPTZ DEFAULT now(),
  realizado_por UUID REFERENCES auth.users(id),
  fotos_comprovacao TEXT[],
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_historico_mudancas_campanha ON historico_mudancas_endereco(campanha_id);
CREATE INDEX IF NOT EXISTS idx_historico_mudancas_data ON historico_mudancas_endereco(data_mudanca DESC);
CREATE INDEX IF NOT EXISTS idx_historico_mudancas_realizado_por ON historico_mudancas_endereco(realizado_por);

-- Comentários
COMMENT ON TABLE historico_mudancas_endereco IS 'Histórico de todas as mudanças de endereço em instalações';
COMMENT ON COLUMN historico_mudancas_endereco.motivo IS 'Motivo da substituição do endereço';

-- Habilitar RLS
ALTER TABLE historico_mudancas_endereco ENABLE ROW LEVEL SECURITY;

-- Policy: Admins e operações veem tudo
CREATE POLICY "Admins e operações veem histórico completo"
ON historico_mudancas_endereco FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('administrador', 'operacoes')
  )
);

-- Policy: Coordenadores veem apenas seu território
CREATE POLICY "Coordenadores veem histórico do seu território"
ON historico_mudancas_endereco FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN profiles p ON p.id = ur.user_id
    JOIN enderecos e ON e.id = historico_mudancas_endereco.endereco_novo_id
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'coordenador'
    AND (
      p.territorios->>'cidades' LIKE '%' || e.cidade || '%'
      OR p.territorios->>'comunidades' LIKE '%' || e.comunidade || '%'
    )
  )
);

-- Policy: Inserção apenas para admins e operações
CREATE POLICY "Admins e operações podem inserir histórico"
ON historico_mudancas_endereco FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('administrador', 'operacoes')
  )
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar tabela
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'historico_mudancas_endereco';

-- Verificar colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'historico_mudancas_endereco'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'historico_mudancas_endereco';

-- Verificar policies
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'historico_mudancas_endereco';

-- Contar registros
SELECT COUNT(*) as total_mudancas
FROM historico_mudancas_endereco;

-- ============================================
-- SUCESSO!
-- ============================================
-- ✅ Tabela historico_mudancas_endereco criada
-- ✅ Índices criados
-- ✅ RLS policies configuradas
-- ✅ Pronto para registrar mudanças
-- ============================================
