-- Migration: Configurar Storage para Relatórios
-- Cria bucket e políticas de acesso para armazenar arquivos PPT

-- Criar bucket para relatórios (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('relatorios', 'relatorios', false)
ON CONFLICT (id) DO NOTHING;

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
