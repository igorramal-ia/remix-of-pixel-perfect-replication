-- Migration: Configurar Storage para Fotos de Instalações

-- 1. Criar bucket para fotos de instalações
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'instalacoes-fotos',
  'instalacoes-fotos',
  false, -- Não público, precisa de URL assinada
  5242880, -- 5MB por arquivo
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies para o bucket

-- Admins e operações podem fazer upload
CREATE POLICY "Admins and operacoes can upload instalacoes fotos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'instalacoes-fotos' AND
  (
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'operacoes')
  )
);

-- Admins e operações podem atualizar
CREATE POLICY "Admins and operacoes can update instalacoes fotos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'instalacoes-fotos' AND
  (
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'operacoes')
  )
);

-- Admins e operações podem deletar
CREATE POLICY "Admins and operacoes can delete instalacoes fotos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'instalacoes-fotos' AND
  (
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'operacoes')
  )
);

-- Todos autenticados podem visualizar (com URL assinada)
CREATE POLICY "Authenticated users can view instalacoes fotos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'instalacoes-fotos');

-- 3. Função helper para gerar path de foto
CREATE OR REPLACE FUNCTION public.gerar_path_foto_instalacao(
  _campanha_id UUID,
  _instalacao_id UUID,
  _tipo TEXT, -- 'instalacao' ou 'retirada'
  _nome_arquivo TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN format(
    '%s/%s/%s/%s',
    _campanha_id::TEXT,
    _instalacao_id::TEXT,
    _tipo,
    _nome_arquivo
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Função para obter URL assinada de foto
CREATE OR REPLACE FUNCTION public.obter_url_foto_instalacao(
  _path TEXT,
  _expira_em INTEGER DEFAULT 3600 -- 1 hora
)
RETURNS TEXT AS $$
DECLARE
  _url TEXT;
BEGIN
  -- Esta função será implementada no frontend usando o SDK do Supabase
  -- Aqui apenas retornamos o path para referência
  RETURN _path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Comentários
COMMENT ON FUNCTION gerar_path_foto_instalacao IS 
'Gera o path padronizado para armazenar fotos de instalações no storage';

COMMENT ON FUNCTION obter_url_foto_instalacao IS 
'Retorna o path da foto (URL assinada deve ser gerada no frontend)';

-- 6. Exemplo de estrutura de paths:
-- instalacoes-fotos/
--   {campanha_id}/
--     {instalacao_id}/
--       instalacao/
--         comprovante_20260226_143022.jpg
--         placa_1_20260226_143025.jpg
--         placa_2_20260226_143028.jpg
--       retirada/
--         retirada_1_20260315_091500.jpg
--         retirada_2_20260315_091503.jpg
