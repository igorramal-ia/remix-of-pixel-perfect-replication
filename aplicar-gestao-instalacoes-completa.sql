-- ============================================================================
-- APLICAR SISTEMA DE GESTÃO DE INSTALAÇÕES - VERSÃO COMPLETA
-- ============================================================================
-- Execute este script no SQL Editor do Supabase
-- Ele adiciona todas as funcionalidades de gestão de instalações

-- ============================================================================
-- PARTE 1: DROPAR VIEW ANTIGA (SE EXISTIR)
-- ============================================================================

-- Dropar view que pode estar usando as colunas antigas
DROP VIEW IF EXISTS public.view_instalacoes_completa;

-- ============================================================================
-- PARTE 2: ADICIONAR COLUNAS NA TABELA INSTALACOES
-- ============================================================================

-- Adicionar colunas para gestão de instalações
ALTER TABLE public.instalacoes 
ADD COLUMN IF NOT EXISTS data_retirada_prevista DATE,
ADD COLUMN IF NOT EXISTS data_retirada_real DATE,
ADD COLUMN IF NOT EXISTS foto_recibo TEXT,
ADD COLUMN IF NOT EXISTS fotos_placa TEXT[],
ADD COLUMN IF NOT EXISTS fotos_retirada TEXT[],
ADD COLUMN IF NOT EXISTS observacoes_retirada TEXT,
ADD COLUMN IF NOT EXISTS motivo_substituicao TEXT,
ADD COLUMN IF NOT EXISTS substituido_por UUID REFERENCES instalacoes(id),
ADD COLUMN IF NOT EXISTS atualizado_por UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();

-- ============================================================================
-- PARTE 3: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_instalacoes_status ON public.instalacoes(status);
CREATE INDEX IF NOT EXISTS idx_instalacoes_data_retirada ON public.instalacoes(data_retirada_prevista);
CREATE INDEX IF NOT EXISTS idx_instalacoes_campanha ON public.instalacoes(campanha_id);

-- ============================================================================
-- PARTE 4: CRIAR TABELA DE HISTÓRICO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.historico_instalacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instalacao_id UUID REFERENCES instalacoes(id) ON DELETE CASCADE,
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50),
  alterado_por UUID REFERENCES profiles(id),
  alterado_em TIMESTAMP DEFAULT NOW(),
  observacoes TEXT,
  dados_alteracao JSONB
);

CREATE INDEX IF NOT EXISTS idx_historico_instalacao ON public.historico_instalacoes(instalacao_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON public.historico_instalacoes(alterado_em DESC);

-- ============================================================================
-- PARTE 5: CRIAR FUNÇÕES DE NEGÓCIO
-- ============================================================================

-- Função para registrar histórico automaticamente
CREATE OR REPLACE FUNCTION public.registrar_historico_instalacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra se o status mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.historico_instalacoes (
      instalacao_id,
      status_anterior,
      status_novo,
      alterado_por,
      observacoes,
      dados_alteracao
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.atualizado_por,
      CASE 
        WHEN NEW.status = 'ativa' THEN 'Instalação ativada'
        WHEN NEW.status = 'finalizada' THEN 'Instalação finalizada'
        WHEN NEW.status = 'cancelada' THEN NEW.motivo_substituicao
        ELSE 'Status atualizado'
      END,
      jsonb_build_object(
        'data_instalacao', NEW.data_instalacao,
        'data_retirada_prevista', NEW.data_retirada_prevista,
        'data_retirada_real', NEW.data_retirada_real,
        'foto_recibo', NEW.foto_recibo,
        'fotos_placa', NEW.fotos_placa,
        'fotos_retirada', NEW.fotos_retirada
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_timestamp_instalacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar instalações com aviso de retirada
CREATE OR REPLACE FUNCTION public.buscar_instalacoes_aviso_retirada(
  _dias_aviso INTEGER DEFAULT 7
)
RETURNS TABLE (
  instalacao_id UUID,
  campanha_id UUID,
  campanha_nome TEXT,
  endereco_id UUID,
  endereco TEXT,
  data_retirada_prevista DATE,
  dias_restantes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as instalacao_id,
    c.id as campanha_id,
    c.nome as campanha_nome,
    e.id as endereco_id,
    e.endereco as endereco,
    i.data_retirada_prevista,
    (i.data_retirada_prevista - CURRENT_DATE)::INTEGER as dias_restantes
  FROM instalacoes i
  JOIN campanhas c ON c.id = i.campanha_id
  JOIN enderecos e ON e.id = i.endereco_id
  WHERE i.status = 'ativa'
    AND i.data_retirada_prevista IS NOT NULL
    AND i.data_retirada_prevista <= CURRENT_DATE + _dias_aviso
  ORDER BY i.data_retirada_prevista ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar instalações atrasadas
CREATE OR REPLACE FUNCTION public.buscar_instalacoes_atrasadas()
RETURNS TABLE (
  instalacao_id UUID,
  campanha_id UUID,
  campanha_nome TEXT,
  endereco_id UUID,
  endereco TEXT,
  data_retirada_prevista DATE,
  dias_atraso INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as instalacao_id,
    c.id as campanha_id,
    c.nome as campanha_nome,
    e.id as endereco_id,
    e.endereco as endereco,
    i.data_retirada_prevista,
    (CURRENT_DATE - i.data_retirada_prevista)::INTEGER as dias_atraso
  FROM instalacoes i
  JOIN campanhas c ON c.id = i.campanha_id
  JOIN enderecos e ON e.id = i.endereco_id
  WHERE i.status = 'ativa'
    AND i.data_retirada_prevista IS NOT NULL
    AND i.data_retirada_prevista < CURRENT_DATE
  ORDER BY dias_atraso DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 6: CRIAR TRIGGERS
-- ============================================================================

-- Trigger para histórico
DROP TRIGGER IF EXISTS trigger_historico_instalacao ON public.instalacoes;
CREATE TRIGGER trigger_historico_instalacao
  AFTER UPDATE ON public.instalacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_historico_instalacao();

-- Trigger para timestamp
DROP TRIGGER IF EXISTS trigger_atualizar_timestamp_instalacao ON public.instalacoes;
CREATE TRIGGER trigger_atualizar_timestamp_instalacao
  BEFORE UPDATE ON public.instalacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_timestamp_instalacao();

-- ============================================================================
-- PARTE 7: CONFIGURAR RLS PARA HISTÓRICO
-- ============================================================================

ALTER TABLE public.historico_instalacoes ENABLE ROW LEVEL SECURITY;

-- Admins e operações podem ver todo o histórico
DROP POLICY IF EXISTS "Admins and operacoes can view historico" ON public.historico_instalacoes;
CREATE POLICY "Admins and operacoes can view historico"
  ON public.historico_instalacoes
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'operacoes')
  );

-- Coordenadores podem ver histórico
DROP POLICY IF EXISTS "Coordenadores can view own historico" ON public.historico_instalacoes;
CREATE POLICY "Coordenadores can view own historico"
  ON public.historico_instalacoes
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordenador')
  );

-- ============================================================================
-- PARTE 8: CRIAR VIEW SIMPLIFICADA (NOVA)
-- ============================================================================

CREATE OR REPLACE VIEW public.view_instalacoes_completa AS
SELECT 
  i.id,
  i.campanha_id,
  c.nome as campanha_nome,
  c.cliente as campanha_cliente,
  i.endereco_id,
  e.endereco,
  e.cidade,
  e.uf,
  e.comunidade,
  e.lat,
  e.long,
  i.status,
  i.data_instalacao,
  i.data_expiracao,
  i.data_retirada_prevista,
  i.data_retirada_real,
  i.foto_recibo,
  i.fotos_placa,
  i.fotos_retirada,
  i.observacoes_retirada,
  i.motivo_substituicao,
  i.substituido_por,
  i.atualizado_por,
  i.atualizado_em,
  i.criado_em,
  -- Calcular dias restantes
  CASE 
    WHEN i.data_retirada_prevista IS NOT NULL AND i.status = 'ativa' 
    THEN (i.data_retirada_prevista - CURRENT_DATE)::INTEGER
    ELSE NULL
  END as dias_restantes,
  -- Flag de aviso
  CASE 
    WHEN i.data_retirada_prevista IS NOT NULL 
         AND i.status = 'ativa' 
         AND i.data_retirada_prevista <= CURRENT_DATE + 7
    THEN TRUE
    ELSE FALSE
  END as aviso_retirada,
  -- Flag de atrasado
  CASE 
    WHEN i.data_retirada_prevista IS NOT NULL 
         AND i.status = 'ativa' 
         AND i.data_retirada_prevista < CURRENT_DATE
    THEN TRUE
    ELSE FALSE
  END as atrasado
FROM instalacoes i
JOIN campanhas c ON c.id = i.campanha_id
JOIN enderecos e ON e.id = i.endereco_id;

-- ============================================================================
-- PARTE 9: CONFIGURAR STORAGE BUCKET
-- ============================================================================

-- Criar bucket para fotos de instalações
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'instalacoes-fotos',
  'instalacoes-fotos',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp'];

-- ============================================================================
-- PARTE 10: CONFIGURAR RLS PARA STORAGE
-- ============================================================================

-- Permitir upload para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can upload instalacoes fotos" ON storage.objects;
CREATE POLICY "Authenticated users can upload instalacoes fotos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'instalacoes-fotos');

-- Permitir leitura para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can read instalacoes fotos" ON storage.objects;
CREATE POLICY "Authenticated users can read instalacoes fotos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'instalacoes-fotos');

-- Permitir deletar apenas próprias fotos ou admins/operações
DROP POLICY IF EXISTS "Users can delete own instalacoes fotos" ON storage.objects;
CREATE POLICY "Users can delete own instalacoes fotos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'instalacoes-fotos' AND (
      auth.uid() = owner OR
      public.has_role(auth.uid(), 'administrador') OR
      public.has_role(auth.uid(), 'operacoes')
    )
  );

-- ============================================================================
-- PARTE 11: ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON COLUMN instalacoes.data_retirada_prevista IS 'Data prevista para retirada da placa';
COMMENT ON COLUMN instalacoes.data_retirada_real IS 'Data real em que a placa foi retirada';
COMMENT ON COLUMN instalacoes.foto_recibo IS 'URL da foto do recibo/comprovante (controle interno)';
COMMENT ON COLUMN instalacoes.fotos_placa IS 'URLs das fotos da placa instalada (para relatório)';
COMMENT ON COLUMN instalacoes.fotos_retirada IS 'URLs das fotos da retirada (mínimo 2)';
COMMENT ON COLUMN instalacoes.observacoes_retirada IS 'Observações sobre a retirada';
COMMENT ON COLUMN instalacoes.motivo_substituicao IS 'Motivo da substituição do endereço';
COMMENT ON COLUMN instalacoes.substituido_por IS 'ID da instalação que substituiu esta';
COMMENT ON COLUMN instalacoes.atualizado_por IS 'ID do usuário que fez a última atualização';
COMMENT ON COLUMN instalacoes.atualizado_em IS 'Data/hora da última atualização';

COMMENT ON TABLE historico_instalacoes IS 'Histórico completo de mudanças de status das instalações';
COMMENT ON FUNCTION buscar_instalacoes_aviso_retirada IS 'Busca instalações próximas da data de retirada';
COMMENT ON FUNCTION buscar_instalacoes_atrasadas IS 'Busca instalações com retirada atrasada';

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Verificar se tudo foi criado corretamente
SELECT 'Script executado com sucesso!' as status;

-- Verificar colunas adicionadas
SELECT COUNT(*) as colunas_adicionadas
FROM information_schema.columns 
WHERE table_name = 'instalacoes' 
  AND column_name IN (
    'data_retirada_prevista',
    'data_retirada_real',
    'foto_recibo',
    'fotos_placa',
    'fotos_retirada',
    'observacoes_retirada',
    'motivo_substituicao',
    'atualizado_por',
    'atualizado_em'
  );

-- Verificar funções criadas
SELECT COUNT(*) as funcoes_criadas
FROM information_schema.routines 
WHERE routine_name IN (
  'registrar_historico_instalacao',
  'buscar_instalacoes_aviso_retirada',
  'buscar_instalacoes_atrasadas',
  'atualizar_timestamp_instalacao'
);
