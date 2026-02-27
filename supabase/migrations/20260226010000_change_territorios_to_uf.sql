-- Migration: Mudar territórios de comunidades para UF (estados)
-- Coordenadores agora são vinculados por estado, não por comunidade

-- 1. Remover função antiga que verifica cobertura por cidade/comunidade
DROP FUNCTION IF EXISTS public.coordenador_cobre_endereco(JSONB, TEXT, TEXT);

-- 2. Atualizar estrutura do JSONB territorios
-- ANTES: {"cidades": ["São Paulo"], "comunidades": ["Rocinha"]}
-- DEPOIS: {"ufs": ["SP", "RJ"]}

-- Comentário atualizado
COMMENT ON COLUMN public.profiles.territorios IS 
'Territórios do coordenador por UF (estado). Estrutura: {"ufs": ["SP", "RJ"]}. 
Coordenador cobre todos os endereços do(s) estado(s) listado(s).';

-- 3. Criar nova função helper para verificar se coordenador cobre um estado
CREATE OR REPLACE FUNCTION public.coordenador_cobre_uf(
  _territorios JSONB,
  _uf TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Se não tem territórios definidos, não cobre nada
  IF _territorios IS NULL OR _territorios = '{}'::jsonb THEN
    RETURN FALSE;
  END IF;

  -- Verifica se a UF está na lista de UFs
  IF _territorios->'ufs' ? _uf THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 4. Migrar dados existentes (tentar extrair UF das cidades)
-- Esta é uma migração de melhor esforço - pode precisar de ajustes manuais
UPDATE public.profiles
SET territorios = jsonb_build_object(
  'ufs', 
  COALESCE(
    (
      SELECT jsonb_agg(DISTINCT e.uf)
      FROM enderecos e
      WHERE 
        -- Tenta encontrar UF baseado nas cidades listadas
        (territorios->'cidades' ? e.cidade)
        OR
        -- Ou baseado nas comunidades listadas
        (territorios->'comunidades' ? e.comunidade)
    ),
    '[]'::jsonb
  )
)
WHERE territorios IS NOT NULL 
  AND (
    jsonb_array_length(COALESCE(territorios->'cidades', '[]'::jsonb)) > 0
    OR
    jsonb_array_length(COALESCE(territorios->'comunidades', '[]'::jsonb)) > 0
  );

-- 5. Atualizar default para nova estrutura
ALTER TABLE public.profiles 
ALTER COLUMN territorios SET DEFAULT '{"ufs": []}'::jsonb;

-- 6. Exemplo de uso da nova função:
-- SELECT coordenador_cobre_uf(
--   '{"ufs": ["SP", "RJ"]}'::jsonb,
--   'SP'
-- ); -- Retorna TRUE

COMMENT ON FUNCTION public.coordenador_cobre_uf IS 
'Verifica se um coordenador cobre determinado estado (UF). 
Retorna TRUE se a UF está na lista de territórios do coordenador.';
