-- Migration: Normalizar capitalização de enderecos (sem remover duplicatas)

-- Aplicar initcap() em todos os campos de texto
UPDATE public.enderecos
SET 
  uf = upper(trim(uf)),
  cidade = initcap(trim(cidade)),
  comunidade = initcap(trim(comunidade)),
  endereco = initcap(trim(endereco));

-- Relatório
DO $$
DECLARE
  total_registros INTEGER;
  total_cidades INTEGER;
  total_comunidades INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_registros FROM public.enderecos;
  SELECT COUNT(DISTINCT cidade) INTO total_cidades FROM public.enderecos;
  SELECT COUNT(DISTINCT comunidade) INTO total_comunidades FROM public.enderecos;
  
  RAISE NOTICE '=== NORMALIZAÇÃO CONCLUÍDA ===';
  RAISE NOTICE 'Total de registros: %', total_registros;
  RAISE NOTICE 'Total de cidades únicas: %', total_cidades;
  RAISE NOTICE 'Total de comunidades únicas: %', total_comunidades;
  RAISE NOTICE 'Capitalização aplicada: Title Case';
  RAISE NOTICE '==============================';
END $$;
