-- Migration: Adicionar coluna territorios à tabela profiles
-- Permite que coordenadores tenham territórios específicos (cidades e/ou comunidades)

-- Adicionar coluna territorios como JSONB
ALTER TABLE public.profiles
ADD COLUMN territorios JSONB DEFAULT '{"cidades": [], "comunidades": []}'::jsonb;

-- Criar índice para melhor performance em queries JSONB
CREATE INDEX idx_profiles_territorios ON public.profiles USING gin (territorios);

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.territorios IS 
'Territórios do coordenador. Estrutura: {"cidades": ["São Paulo"], "comunidades": ["Rocinha"]}. 
Cidades listadas significam TODAS as comunidades daquela cidade. 
Comunidades específicas cobrem apenas aquela comunidade.';

-- Função helper para verificar se um coordenador cobre um endereço
CREATE OR REPLACE FUNCTION public.coordenador_cobre_endereco(
  _territorios JSONB,
  _cidade TEXT,
  _comunidade TEXT
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

  -- Verifica se a cidade está na lista de cidades (cobre todas as comunidades)
  IF _territorios->'cidades' ? _cidade THEN
    RETURN TRUE;
  END IF;

  -- Verifica se a comunidade específica está na lista
  IF _territorios->'comunidades' ? _comunidade THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Exemplo de uso da função:
-- SELECT coordenador_cobre_endereco(
--   '{"cidades": ["São Paulo"], "comunidades": ["Rocinha"]}'::jsonb,
--   'Rio de Janeiro',
--   'Rocinha'
-- ); -- Retorna TRUE

-- SELECT coordenador_cobre_endereco(
--   '{"cidades": ["São Paulo"], "comunidades": ["Rocinha"]}'::jsonb,
--   'São Paulo',
--   'Paraisópolis'
-- ); -- Retorna TRUE (porque São Paulo está nas cidades)
