-- Script para verificar se tudo foi configurado corretamente

-- 1. Verificar novas colunas em instalacoes
SELECT column_name, data_type, is_nullable
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
  )
ORDER BY column_name;

-- 2. Verificar se tabela historico_instalacoes existe
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'historico_instalacoes';

-- 3. Verificar funções criadas
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN (
  'registrar_historico_instalacao',
  'buscar_instalacoes_aviso_retirada',
  'buscar_instalacoes_atrasadas',
  'atualizar_timestamp_instalacao'
)
ORDER BY routine_name;

-- 4. Verificar view
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'view_instalacoes_completa';

-- 5. Verificar bucket de storage
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'instalacoes-fotos';

-- 6. Verificar policies do storage
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%instalacoes%'
ORDER BY policyname;

-- 7. Testar função de aviso (deve retornar vazio se não houver dados)
SELECT * FROM buscar_instalacoes_aviso_retirada(7);

-- 8. Testar função de atrasados (deve retornar vazio se não houver dados)
SELECT * FROM buscar_instalacoes_atrasadas();

-- 9. Ver estrutura completa da tabela instalacoes
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'instalacoes'
ORDER BY ordinal_position;
