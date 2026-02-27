-- ============================================
-- NORMALIZAÇÃO DE CAPITALIZAÇÃO - ENDEREÇOS
-- ============================================
-- Este script normaliza APENAS a capitalização
-- NÃO remove duplicatas
-- ============================================

-- ANTES DE EXECUTAR: Verificar dados atuais
SELECT 
  'ANTES DA NORMALIZAÇÃO' as status,
  COUNT(*) as total_registros,
  COUNT(DISTINCT uf) as total_ufs,
  COUNT(DISTINCT cidade) as total_cidades,
  COUNT(DISTINCT comunidade) as total_comunidades
FROM public.enderecos;

-- Mostrar exemplos de cidades antes
SELECT DISTINCT cidade
FROM public.enderecos
ORDER BY cidade
LIMIT 20;

-- ============================================
-- APLICAR NORMALIZAÇÃO
-- ============================================

UPDATE public.enderecos
SET 
  uf = upper(trim(uf)),
  cidade = initcap(trim(cidade)),
  comunidade = initcap(trim(comunidade)),
  endereco = initcap(trim(endereco));

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

-- Estatísticas após normalização
SELECT 
  'APÓS NORMALIZAÇÃO' as status,
  COUNT(*) as total_registros,
  COUNT(DISTINCT uf) as total_ufs,
  COUNT(DISTINCT cidade) as total_cidades,
  COUNT(DISTINCT comunidade) as total_comunidades
FROM public.enderecos;

-- Mostrar cidades normalizadas
SELECT DISTINCT cidade
FROM public.enderecos
ORDER BY cidade
LIMIT 20;

-- Verificar UFs (devem estar em maiúsculo)
SELECT DISTINCT uf
FROM public.enderecos
ORDER BY uf;

-- Verificar se há problemas de capitalização
SELECT 
  cidade,
  COUNT(*) as quantidade
FROM public.enderecos
WHERE cidade != initcap(cidade)
GROUP BY cidade;

-- Se retornar 0 linhas, está tudo normalizado!
