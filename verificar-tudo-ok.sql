-- Script rápido para verificar se tudo está funcionando

-- 1. Verificar colunas (deve retornar 9)
SELECT COUNT(*) as colunas_ok
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

-- 2. Verificar tabela historico (deve retornar 1)
SELECT COUNT(*) as historico_ok
FROM information_schema.tables
WHERE table_name = 'historico_instalacoes';

-- 3. Verificar funções (deve retornar 4)
SELECT COUNT(*) as funcoes_ok
FROM information_schema.routines 
WHERE routine_name IN (
  'registrar_historico_instalacao',
  'buscar_instalacoes_aviso_retirada',
  'buscar_instalacoes_atrasadas',
  'atualizar_timestamp_instalacao'
);

-- 4. Verificar view (deve retornar 1)
SELECT COUNT(*) as view_ok
FROM information_schema.tables
WHERE table_name = 'view_instalacoes_completa';

-- 5. Verificar bucket (deve retornar 1)
SELECT COUNT(*) as bucket_ok
FROM storage.buckets 
WHERE id = 'instalacoes-fotos';

-- 6. Verificar estrutura das novas colunas
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'instalacoes'
  AND column_name IN ('foto_recibo', 'fotos_placa', 'fotos_retirada')
ORDER BY column_name;

-- Mensagem final
SELECT '✅ Sistema de Gestão de Instalações configurado com sucesso!' as status;
