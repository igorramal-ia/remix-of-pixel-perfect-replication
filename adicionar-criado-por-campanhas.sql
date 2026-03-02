-- Adicionar coluna criado_por na tabela campanhas
ALTER TABLE campanhas 
ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES auth.users(id);

-- Para campanhas existentes, definir o gestor como criador (se existir)
UPDATE campanhas 
SET criado_por = gestor_id 
WHERE criado_por IS NULL AND gestor_id IS NOT NULL;

-- Verificar resultado
SELECT 
  COUNT(*) as total_campanhas,
  COUNT(criado_por) as com_criador,
  COUNT(*) - COUNT(criado_por) as sem_criador
FROM campanhas;
