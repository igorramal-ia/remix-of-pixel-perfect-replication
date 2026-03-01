-- Verificar estrutura da tabela enderecos
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'enderecos'
ORDER BY ordinal_position;

-- Verificar se tem latitude e longitude
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'enderecos' AND column_name = 'latitude'
    ) THEN 'latitude existe'
    ELSE 'latitude NÃO existe'
  END as status_latitude,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'enderecos' AND column_name = 'longitude'
    ) THEN 'longitude existe'
    ELSE 'longitude NÃO existe'
  END as status_longitude;
