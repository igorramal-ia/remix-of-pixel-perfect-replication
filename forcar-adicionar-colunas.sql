-- Script para forçar adição das colunas necessárias
-- Execute este se as colunas não foram criadas

-- Dropar colunas antigas se existirem (para evitar conflito)
ALTER TABLE public.instalacoes DROP COLUMN IF EXISTS fotos_instalacao;

-- Adicionar as novas colunas uma por uma
DO $$ 
BEGIN
  -- foto_recibo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instalacoes' AND column_name = 'foto_recibo'
  ) THEN
    ALTER TABLE public.instalacoes ADD COLUMN foto_recibo TEXT;
    RAISE NOTICE 'Coluna foto_recibo adicionada';
  ELSE
    RAISE NOTICE 'Coluna foto_recibo já existe';
  END IF;

  -- fotos_placa
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instalacoes' AND column_name = 'fotos_placa'
  ) THEN
    ALTER TABLE public.instalacoes ADD COLUMN fotos_placa TEXT[];
    RAISE NOTICE 'Coluna fotos_placa adicionada';
  ELSE
    RAISE NOTICE 'Coluna fotos_placa já existe';
  END IF;

  -- fotos_retirada
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instalacoes' AND column_name = 'fotos_retirada'
  ) THEN
    ALTER TABLE public.instalacoes ADD COLUMN fotos_retirada TEXT[];
    RAISE NOTICE 'Coluna fotos_retirada adicionada';
  ELSE
    RAISE NOTICE 'Coluna fotos_retirada já existe';
  END IF;

  -- data_retirada_prevista
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instalacoes' AND column_name = 'data_retirada_prevista'
  ) THEN
    ALTER TABLE public.instalacoes ADD COLUMN data_retirada_prevista DATE;
    RAISE NOTICE 'Coluna data_retirada_prevista adicionada';
  ELSE
    RAISE NOTICE 'Coluna data_retirada_prevista já existe';
  END IF;

  -- data_retirada_real
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instalacoes' AND column_name = 'data_retirada_real'
  ) THEN
    ALTER TABLE public.instalacoes ADD COLUMN data_retirada_real DATE;
    RAISE NOTICE 'Coluna data_retirada_real adicionada';
  ELSE
    RAISE NOTICE 'Coluna data_retirada_real já existe';
  END IF;

  -- observacoes_retirada
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instalacoes' AND column_name = 'observacoes_retirada'
  ) THEN
    ALTER TABLE public.instalacoes ADD COLUMN observacoes_retirada TEXT;
    RAISE NOTICE 'Coluna observacoes_retirada adicionada';
  ELSE
    RAISE NOTICE 'Coluna observacoes_retirada já existe';
  END IF;

  -- motivo_substituicao
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instalacoes' AND column_name = 'motivo_substituicao'
  ) THEN
    ALTER TABLE public.instalacoes ADD COLUMN motivo_substituicao TEXT;
    RAISE NOTICE 'Coluna motivo_substituicao adicionada';
  ELSE
    RAISE NOTICE 'Coluna motivo_substituicao já existe';
  END IF;

  -- substituido_por
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instalacoes' AND column_name = 'substituido_por'
  ) THEN
    ALTER TABLE public.instalacoes ADD COLUMN substituido_por UUID REFERENCES instalacoes(id);
    RAISE NOTICE 'Coluna substituido_por adicionada';
  ELSE
    RAISE NOTICE 'Coluna substituido_por já existe';
  END IF;

  -- atualizado_por
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instalacoes' AND column_name = 'atualizado_por'
  ) THEN
    ALTER TABLE public.instalacoes ADD COLUMN atualizado_por UUID REFERENCES profiles(id);
    RAISE NOTICE 'Coluna atualizado_por adicionada';
  ELSE
    RAISE NOTICE 'Coluna atualizado_por já existe';
  END IF;

  -- atualizado_em
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instalacoes' AND column_name = 'atualizado_em'
  ) THEN
    ALTER TABLE public.instalacoes ADD COLUMN atualizado_em TIMESTAMP DEFAULT NOW();
    RAISE NOTICE 'Coluna atualizado_em adicionada';
  ELSE
    RAISE NOTICE 'Coluna atualizado_em já existe';
  END IF;

END $$;

-- Verificar resultado
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'instalacoes'
  AND column_name IN (
    'foto_recibo',
    'fotos_placa',
    'fotos_retirada',
    'data_retirada_prevista',
    'data_retirada_real',
    'observacoes_retirada',
    'motivo_substituicao',
    'substituido_por',
    'atualizado_por',
    'atualizado_em'
  )
ORDER BY column_name;

-- Mensagem final
SELECT '✅ Colunas verificadas e adicionadas!' as status;
