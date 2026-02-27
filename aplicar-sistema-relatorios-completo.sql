-- ============================================================================
-- SISTEMA DE GERAÇÃO DE RELATÓRIOS - APLICAÇÃO COMPLETA
-- ============================================================================
-- Execute este script completo no SQL Editor do Supabase
-- Tempo estimado: 1-2 minutos
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAR TABELA relatorios_gerados
-- ============================================================================

-- Criar tabela relatorios_gerados
CREATE TABLE IF NOT EXISTS relatorios_gerados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('parcial', 'final')),
  numero_pi TEXT NOT NULL,
  formato TEXT NOT NULL DEFAULT 'ppt' CHECK (formato IN ('ppt')),
  url_arquivo TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tamanho_bytes BIGINT NOT NULL,
  gerado_por UUID NOT NULL REFERENCES auth.users(id),
  gerado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT relatorios_gerados_numero_pi_check CHECK (LENGTH(TRIM(numero_pi)) > 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_relatorios_campanha ON relatorios_gerados(campanha_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_tipo ON relatorios_gerados(tipo);
CREATE INDEX IF NOT EXISTS idx_relatorios_gerado_em ON relatorios_gerados(gerado_em DESC);
CREATE INDEX IF NOT EXISTS idx_relatorios_gerado_por ON relatorios_gerados(gerado_por);

-- Comentários
COMMENT ON TABLE relatorios_gerados IS 'Histórico de relatórios gerados do sistema';
COMMENT ON COLUMN relatorios_gerados.tipo IS 'Tipo de relatório: parcial (apenas ativas) ou final (ativas + finalizadas)';
COMMENT ON COLUMN relatorios_gerados.numero_pi IS 'Número do Pedido de Inserção (obrigatório)';
COMMENT ON COLUMN relatorios_gerados.formato IS 'Formato do arquivo (atualmente apenas ppt)';
COMMENT ON COLUMN relatorios_gerados.url_arquivo IS 'URL do arquivo no Supabase Storage';
COMMENT ON COLUMN relatorios_gerados.tamanho_bytes IS 'Tamanho do arquivo em bytes';

-- RLS Policies
ALTER TABLE relatorios_gerados ENABLE ROW LEVEL SECURITY;

-- Deletar policies antigas se existirem
DROP POLICY IF EXISTS "Admins e operações podem ver todos os relatórios" ON relatorios_gerados;
DROP POLICY IF EXISTS "Coordenadores podem ver relatórios das suas campanhas" ON relatorios_gerados;
DROP POLICY IF EXISTS "Usuários autenticados podem gerar relatórios" ON relatorios_gerados;
DROP POLICY IF EXISTS "Admins e operações podem deletar relatórios" ON relatorios_gerados;

-- Administradores e operações podem ver todos
CREATE POLICY "Admins e operações podem ver todos os relatórios"
  ON relatorios_gerados FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'operacoes')
    )
  );

-- Coordenadores podem ver relatórios das suas campanhas
CREATE POLICY "Coordenadores podem ver relatórios das suas campanhas"
  ON relatorios_gerados FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campanha_coordenadores
      WHERE campanha_id = relatorios_gerados.campanha_id
      AND coordenador_id = auth.uid()
    )
  );

-- Todos podem inserir (será validado pela aplicação)
CREATE POLICY "Usuários autenticados podem gerar relatórios"
  ON relatorios_gerados FOR INSERT
  WITH CHECK (auth.uid() = gerado_por);

-- Apenas admins e operações podem deletar
CREATE POLICY "Admins e operações podem deletar relatórios"
  ON relatorios_gerados FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'operacoes')
    )
  );

-- ============================================================================
-- PARTE 2: CONFIGURAR STORAGE
-- ============================================================================

-- Criar bucket para relatórios (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('relatorios', 'relatorios', false)
ON CONFLICT (id) DO NOTHING;

-- Deletar policies antigas se existirem
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de relatórios" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem ler relatórios" ON storage.objects;
DROP POLICY IF EXISTS "Admins e operações podem deletar relatórios" ON storage.objects;

-- Políticas de acesso ao bucket

-- Usuários autenticados podem fazer upload
CREATE POLICY "Usuários autenticados podem fazer upload de relatórios"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'relatorios'
    AND auth.role() = 'authenticated'
  );

-- Usuários autenticados podem ler relatórios
CREATE POLICY "Usuários autenticados podem ler relatórios"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'relatorios'
    AND auth.role() = 'authenticated'
  );

-- Admins e operações podem deletar relatórios
CREATE POLICY "Admins e operações podem deletar relatórios"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'relatorios'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'operacoes')
    )
  );

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se a tabela foi criada
SELECT 
  'Tabela relatorios_gerados criada com sucesso!' as status,
  COUNT(*) as total_colunas
FROM information_schema.columns
WHERE table_name = 'relatorios_gerados';

-- Verificar se o bucket foi criado
SELECT 
  'Bucket relatorios criado com sucesso!' as status,
  id,
  name,
  public
FROM storage.buckets
WHERE id = 'relatorios';

-- Verificar policies da tabela
SELECT 
  'Policies da tabela configuradas!' as status,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'relatorios_gerados';

-- Verificar policies do storage
SELECT 
  'Policies do storage configuradas!' as status,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%relatórios%';

-- ============================================================================
-- CONCLUÍDO!
-- ============================================================================
-- Se você vê as mensagens de sucesso acima, o sistema está pronto para uso!
-- Agora você pode:
-- 1. Acessar uma campanha
-- 2. Clicar em "Gerar Relatório"
-- 3. Preencher o número PI
-- 4. Gerar o relatório em PowerPoint
-- ============================================================================
