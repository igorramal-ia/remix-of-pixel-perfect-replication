-- Migration: Adicionar tabela de cidades de cobertura

-- Criar tabela cidades_cobertura
CREATE TABLE public.cidades_cobertura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uf TEXT NOT NULL,
  cidade TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraint para evitar duplicatas
  CONSTRAINT cidades_cobertura_uf_cidade_unique UNIQUE (uf, cidade)
);

-- Índices para performance
CREATE INDEX idx_cidades_cobertura_uf ON public.cidades_cobertura(uf);
CREATE INDEX idx_cidades_cobertura_cidade ON public.cidades_cobertura(cidade);

-- Enable RLS
ALTER TABLE public.cidades_cobertura ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view cidades_cobertura" ON public.cidades_cobertura
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert cidades_cobertura" ON public.cidades_cobertura
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Operacoes can insert cidades_cobertura" ON public.cidades_cobertura
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'operacoes'));

-- Comentários
COMMENT ON TABLE public.cidades_cobertura IS 
'Tabela de referência de cidades cobertas pelo sistema';

COMMENT ON COLUMN public.cidades_cobertura.uf IS 
'Sigla do estado (UF)';

COMMENT ON COLUMN public.cidades_cobertura.cidade IS 
'Nome da cidade';

-- Popular com cidades já existentes na tabela enderecos
INSERT INTO public.cidades_cobertura (uf, cidade)
SELECT DISTINCT uf, cidade
FROM public.enderecos
ON CONFLICT (uf, cidade) DO NOTHING;
