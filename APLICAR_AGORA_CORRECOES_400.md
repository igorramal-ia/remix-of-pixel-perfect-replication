# 🚨 APLICAR AGORA: Correções para Erros 400

## Problema
Ao abrir a página, aparecem erros 400 (Bad Request) porque:
1. Coluna `ativo` não existe na tabela `enderecos`
2. Coluna `data_retirada_real` pode não existir na tabela `instalacoes`

## Solução

### 1. Verificar e Adicionar Coluna `ativo`

Execute este SQL no Supabase:

\`\`\`sql
-- Verificar se a coluna 'ativo' existe
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'enderecos' AND column_name = 'ativo';

-- Se não existir, adicionar
ALTER TABLE enderecos 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true NOT NULL;

-- Atualizar todos os registros existentes
UPDATE enderecos SET ativo = true WHERE ativo IS NULL;

-- Verificar resultado
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE ativo = true) as ativos
FROM enderecos;
\`\`\`

### 2. Verificar Colunas de Instalações

Execute este SQL:

\`\`\`sql
-- Verificar colunas da tabela instalacoes
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'instalacoes'
  AND column_name IN ('data_retirada_real', 'data_retirada_prevista', 'fotos_instalacao', 'fotos_retirada');
\`\`\`

Se alguma coluna não existir, aplique a migration completa:

\`\`\`bash
# No terminal
cat aplicar-gestao-instalacoes-completa.sql | supabase db execute
\`\`\`

### 3. Verificar Resultado

Após aplicar, recarregue a página. Os erros 400 devem desaparecer.

## Alternativa Temporária

Se não puder aplicar as migrations agora, o código já foi ajustado para:
- Não filtrar por `ativo` (busca todos os endereços)
- Isso permite que o sistema funcione mesmo sem a coluna

## Próximos Passos

Depois de aplicar as correções:
1. Recarregue a página
2. Verifique que não há mais erros 400
3. Teste criar novo endereço
4. Teste o mapa com filtros
