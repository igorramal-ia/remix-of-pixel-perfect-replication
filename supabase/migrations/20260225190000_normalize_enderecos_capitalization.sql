-- Migration: Normalizar capitalização de cidade e comunidade na tabela enderecos

-- Passo 1: Criar tabela temporária com dados normalizados
CREATE TEMP TABLE enderecos_normalized AS
SELECT 
  id,
  initcap(cidade) as cidade_normalized,
  initcap(comunidade) as comunidade_normalized,
  uf,
  endereco,
  lat,
  long,
  status,
  criado_em,
  criado_por,
  ROW_NUMBER() OVER (
    PARTITION BY uf, initcap(cidade), initcap(comunidade), endereco 
    ORDER BY criado_em ASC
  ) as row_num
FROM public.enderecos;

-- Passo 2: Identificar IDs dos registros duplicados que serão removidos
CREATE TEMP TABLE enderecos_to_delete AS
SELECT id
FROM enderecos_normalized
WHERE row_num > 1;

-- Passo 3: Atualizar referências em outras tabelas antes de deletar

-- 3.1: Atualizar tabela proprietarios
-- Mapear proprietários de endereços duplicados para o endereço principal
UPDATE public.proprietarios p
SET endereco_id = (
  SELECT en.id
  FROM enderecos_normalized en
  WHERE en.row_num = 1
    AND en.uf = (SELECT uf FROM public.enderecos WHERE id = p.endereco_id)
    AND en.cidade_normalized = initcap((SELECT cidade FROM public.enderecos WHERE id = p.endereco_id))
    AND en.comunidade_normalized = initcap((SELECT comunidade FROM public.enderecos WHERE id = p.endereco_id))
    AND en.endereco = (SELECT endereco FROM public.enderecos WHERE id = p.endereco_id)
  LIMIT 1
)
WHERE p.endereco_id IN (SELECT id FROM enderecos_to_delete);

-- 3.2: Atualizar tabela instalacoes
-- Mapear instalações de endereços duplicados para o endereço principal
UPDATE public.instalacoes i
SET endereco_id = (
  SELECT en.id
  FROM enderecos_normalized en
  WHERE en.row_num = 1
    AND en.uf = (SELECT uf FROM public.enderecos WHERE id = i.endereco_id)
    AND en.cidade_normalized = initcap((SELECT cidade FROM public.enderecos WHERE id = i.endereco_id))
    AND en.comunidade_normalized = initcap((SELECT comunidade FROM public.enderecos WHERE id = i.endereco_id))
    AND en.endereco = (SELECT endereco FROM public.enderecos WHERE id = i.endereco_id)
  LIMIT 1
)
WHERE i.endereco_id IN (SELECT id FROM enderecos_to_delete);

-- 3.3: Atualizar tabela inventario_historico
-- Mapear histórico de endereços duplicados para o endereço principal
UPDATE public.inventario_historico ih
SET endereco_id = (
  SELECT en.id
  FROM enderecos_normalized en
  WHERE en.row_num = 1
    AND en.uf = (SELECT uf FROM public.enderecos WHERE id = ih.endereco_id)
    AND en.cidade_normalized = initcap((SELECT cidade FROM public.enderecos WHERE id = ih.endereco_id))
    AND en.comunidade_normalized = initcap((SELECT comunidade FROM public.enderecos WHERE id = ih.endereco_id))
    AND en.endereco = (SELECT endereco FROM public.enderecos WHERE id = ih.endereco_id)
  LIMIT 1
)
WHERE ih.endereco_id IN (SELECT id FROM enderecos_to_delete);

-- Passo 4: Deletar registros duplicados
DELETE FROM public.enderecos
WHERE id IN (SELECT id FROM enderecos_to_delete);

-- Passo 5: Atualizar capitalização dos registros mantidos
UPDATE public.enderecos
SET 
  cidade = initcap(cidade),
  comunidade = initcap(comunidade);

-- Passo 6: Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_enderecos_cidade_comunidade 
ON public.enderecos(uf, cidade, comunidade);

-- Passo 7: Adicionar constraint para evitar duplicatas futuras
-- (Comentado por enquanto - pode ser habilitado depois de validar os dados)
-- ALTER TABLE public.enderecos 
-- ADD CONSTRAINT enderecos_unique_location 
-- UNIQUE (uf, cidade, comunidade, endereco);

-- Comentários
COMMENT ON COLUMN public.enderecos.cidade IS 
'Nome da cidade em Title Case (primeira letra maiúscula)';

COMMENT ON COLUMN public.enderecos.comunidade IS 
'Nome da comunidade em Title Case (primeira letra maiúscula)';

-- Relatório de execução
DO $$
DECLARE
  total_antes INTEGER;
  total_depois INTEGER;
  total_removidos INTEGER;
BEGIN
  -- Contar registros antes (da temp table)
  SELECT COUNT(*) INTO total_antes FROM enderecos_normalized;
  
  -- Contar registros depois
  SELECT COUNT(*) INTO total_depois FROM public.enderecos;
  
  -- Calcular removidos
  total_removidos := total_antes - total_depois;
  
  -- Exibir relatório
  RAISE NOTICE '=== RELATÓRIO DE NORMALIZAÇÃO ===';
  RAISE NOTICE 'Total de registros antes: %', total_antes;
  RAISE NOTICE 'Total de registros depois: %', total_depois;
  RAISE NOTICE 'Total de duplicatas removidas: %', total_removidos;
  RAISE NOTICE 'Capitalização normalizada: Title Case aplicado';
  RAISE NOTICE '================================';
END $$;
