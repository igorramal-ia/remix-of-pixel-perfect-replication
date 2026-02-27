-- ============================================
-- NORMALIZAÇÃO DE ENDEREÇOS - TITLE CASE
-- ============================================
-- Este script normaliza a capitalização de cidade e comunidade
-- e remove duplicatas da tabela enderecos
-- ============================================

-- PASSO 1: Backup (opcional - executar antes se quiser segurança extra)
-- CREATE TABLE enderecos_backup AS SELECT * FROM public.enderecos;

-- PASSO 2: Criar tabela temporária com dados normalizados
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

-- PASSO 3: Identificar duplicatas
CREATE TEMP TABLE enderecos_to_delete AS
SELECT id
FROM enderecos_normalized
WHERE row_num > 1;

-- PASSO 4: Mostrar quantas duplicatas serão removidas
SELECT 
  COUNT(*) as total_duplicatas,
  'Estes registros serão removidos' as descricao
FROM enderecos_to_delete;

-- PASSO 5: Atualizar referências em proprietarios
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

-- PASSO 6: Atualizar referências em instalacoes
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

-- PASSO 7: Atualizar referências em inventario_historico
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

-- PASSO 8: Deletar duplicatas
DELETE FROM public.enderecos
WHERE id IN (SELECT id FROM enderecos_to_delete);

-- PASSO 9: Normalizar capitalização dos registros mantidos
UPDATE public.enderecos
SET 
  cidade = initcap(cidade),
  comunidade = initcap(comunidade);

-- PASSO 10: Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_enderecos_cidade_comunidade 
ON public.enderecos(uf, cidade, comunidade);

-- PASSO 11: Relatório final
SELECT 
  'Normalização concluída!' as status,
  COUNT(*) as total_enderecos_atuais,
  COUNT(DISTINCT uf) as total_ufs,
  COUNT(DISTINCT cidade) as total_cidades,
  COUNT(DISTINCT comunidade) as total_comunidades
FROM public.enderecos;

-- PASSO 12: Verificar alguns exemplos
SELECT 
  uf,
  cidade,
  comunidade,
  COUNT(*) as quantidade
FROM public.enderecos
GROUP BY uf, cidade, comunidade
ORDER BY quantidade DESC
LIMIT 10;
