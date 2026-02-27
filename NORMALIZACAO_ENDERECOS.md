# Normalização de Endereços - Title Case

## Objetivo

Padronizar a capitalização dos campos `cidade` e `comunidade` na tabela `enderecos` para Title Case (primeira letra maiúscula, resto minúsculo) e remover registros duplicados.

## Problema

Atualmente, a tabela `enderecos` pode ter inconsistências de capitalização:
- `HELIÓPOLIS` (tudo maiúsculo)
- `heliópolis` (tudo minúsculo)
- `Heliópolis` (title case)
- `HeLiÓpOlIs` (misto)

Isso causa:
- Duplicatas lógicas (mesmo endereço com capitalizações diferentes)
- Problemas nos selects (cidades aparecem múltiplas vezes)
- Inconsistência visual na interface

## Solução

### Função PostgreSQL: `initcap()`

A função `initcap()` converte texto para Title Case:
```sql
SELECT initcap('HELIÓPOLIS');  -- Retorna: Heliópolis
SELECT initcap('heliópolis');  -- Retorna: Heliópolis
SELECT initcap('HeLiÓpOlIs');  -- Retorna: Heliópolis
```

### Processo de Normalização

#### 1. Criar Tabela Temporária
```sql
CREATE TEMP TABLE enderecos_normalized AS
SELECT 
  id,
  initcap(cidade) as cidade_normalized,
  initcap(comunidade) as comunidade_normalized,
  ROW_NUMBER() OVER (
    PARTITION BY uf, initcap(cidade), initcap(comunidade), endereco 
    ORDER BY criado_em ASC
  ) as row_num
FROM public.enderecos;
```

**O que faz:**
- Normaliza cidade e comunidade para Title Case
- Usa `ROW_NUMBER()` para identificar duplicatas
- `PARTITION BY` agrupa por localização normalizada
- `ORDER BY criado_em ASC` mantém o registro mais antigo

#### 2. Identificar Duplicatas
```sql
CREATE TEMP TABLE enderecos_to_delete AS
SELECT id
FROM enderecos_normalized
WHERE row_num > 1;
```

**O que faz:**
- Seleciona IDs dos registros duplicados (row_num > 1)
- Mantém apenas o primeiro registro de cada grupo (row_num = 1)

#### 3. Atualizar Referências
Antes de deletar duplicatas, atualiza referências em outras tabelas:

**3.1 Tabela `proprietarios`:**
```sql
UPDATE public.proprietarios p
SET endereco_id = (endereço principal)
WHERE p.endereco_id IN (duplicatas);
```

**3.2 Tabela `instalacoes`:**
```sql
UPDATE public.instalacoes i
SET endereco_id = (endereço principal)
WHERE i.endereco_id IN (duplicatas);
```

**3.3 Tabela `inventario_historico`:**
```sql
UPDATE public.inventario_historico ih
SET endereco_id = (endereço principal)
WHERE ih.endereco_id IN (duplicatas);
```

#### 4. Deletar Duplicatas
```sql
DELETE FROM public.enderecos
WHERE id IN (SELECT id FROM enderecos_to_delete);
```

#### 5. Normalizar Capitalização
```sql
UPDATE public.enderecos
SET 
  cidade = initcap(cidade),
  comunidade = initcap(comunidade);
```

#### 6. Criar Índice
```sql
CREATE INDEX idx_enderecos_cidade_comunidade 
ON public.enderecos(uf, cidade, comunidade);
```

## Como Aplicar

### Opção 1: Via SQL Editor do Supabase (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/ompimrxcmajdxwpahbub
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o conteúdo de `normalize-enderecos.sql`
5. Clique em **Run** ou pressione `Ctrl+Enter`
6. Aguarde a execução (pode levar alguns segundos)
7. Verifique o relatório final

### Opção 2: Via Migration

A migration está em:
```
supabase/migrations/20260225190000_normalize_enderecos_capitalization.sql
```

Se tiver Supabase CLI instalado:
```bash
npx supabase db push
```

## Exemplo de Transformação

### Antes:
```
| id | uf | cidade        | comunidade    |
|----|----|--------------  |---------------|
| 1  | SP | SÃO PAULO     | HELIÓPOLIS    |
| 2  | SP | são paulo     | heliópolis    |
| 3  | SP | São Paulo     | Heliópolis    |
| 4  | RJ | RIO DE JANEIRO| ROCINHA       |
| 5  | RJ | rio de janeiro| rocinha       |
```

### Depois:
```
| id | uf | cidade         | comunidade |
|----|----|--------------  |------------|
| 1  | SP | São Paulo      | Heliópolis |
| 4  | RJ | Rio De Janeiro | Rocinha    |
```

**Resultado:**
- 3 duplicatas removidas (IDs 2, 3, 5)
- Capitalização normalizada para Title Case
- Referências em outras tabelas atualizadas

## Impacto

### Tabelas Afetadas
1. ✅ `enderecos` - Normalização e remoção de duplicatas
2. ✅ `proprietarios` - Referências atualizadas
3. ✅ `instalacoes` - Referências atualizadas
4. ✅ `inventario_historico` - Referências atualizadas

### Benefícios
- ✅ Selects de cidade/comunidade sem duplicatas
- ✅ Interface mais limpa e consistente
- ✅ Melhor performance com índice
- ✅ Dados padronizados para futuras inserções

### Riscos
- ⚠️ Operação irreversível (criar backup antes se necessário)
- ⚠️ Pode levar tempo em tabelas grandes
- ⚠️ Bloqueia tabela durante execução

## Backup (Opcional)

Antes de executar, criar backup:
```sql
CREATE TABLE enderecos_backup AS 
SELECT * FROM public.enderecos;
```

Para restaurar (se necessário):
```sql
DELETE FROM public.enderecos;
INSERT INTO public.enderecos 
SELECT * FROM enderecos_backup;
```

## Verificação Pós-Execução

### 1. Verificar Capitalização
```sql
SELECT DISTINCT cidade, comunidade
FROM public.enderecos
ORDER BY cidade, comunidade
LIMIT 20;
```

**Esperado:** Todas em Title Case (ex: "São Paulo", "Heliópolis")

### 2. Verificar Duplicatas
```sql
SELECT uf, cidade, comunidade, endereco, COUNT(*) as quantidade
FROM public.enderecos
GROUP BY uf, cidade, comunidade, endereco
HAVING COUNT(*) > 1;
```

**Esperado:** Nenhum resultado (sem duplicatas)

### 3. Verificar Referências
```sql
-- Verificar proprietarios
SELECT COUNT(*) FROM public.proprietarios 
WHERE endereco_id NOT IN (SELECT id FROM public.enderecos);

-- Verificar instalacoes
SELECT COUNT(*) FROM public.instalacoes 
WHERE endereco_id NOT IN (SELECT id FROM public.enderecos);

-- Verificar inventario_historico
SELECT COUNT(*) FROM public.inventario_historico 
WHERE endereco_id NOT IN (SELECT id FROM public.enderecos);
```

**Esperado:** Todos retornam 0 (sem referências órfãs)

### 4. Verificar Índice
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'enderecos'
AND indexname = 'idx_enderecos_cidade_comunidade';
```

**Esperado:** Índice criado com sucesso

## Relatório de Execução

O script exibe um relatório ao final:
```
=== RELATÓRIO DE NORMALIZAÇÃO ===
Total de registros antes: 1500
Total de registros depois: 1200
Total de duplicatas removidas: 300
Capitalização normalizada: Title Case aplicado
================================
```

## Próximos Passos

### 1. Adicionar Constraint (Opcional)
Após validar os dados, adicionar constraint para evitar duplicatas futuras:
```sql
ALTER TABLE public.enderecos 
ADD CONSTRAINT enderecos_unique_location 
UNIQUE (uf, cidade, comunidade, endereco);
```

### 2. Atualizar Código
Garantir que novos endereços sejam inseridos com Title Case:
```typescript
const cidade = cidadeInput.trim();
const comunidade = comunidadeInput.trim();

// Aplicar Title Case no frontend
const cidadeFormatted = cidade
  .toLowerCase()
  .split(' ')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');
```

### 3. Validação Contínua
Criar trigger para normalizar automaticamente na inserção:
```sql
CREATE OR REPLACE FUNCTION normalize_endereco()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cidade = initcap(NEW.cidade);
  NEW.comunidade = initcap(NEW.comunidade);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_normalize_endereco
BEFORE INSERT OR UPDATE ON public.enderecos
FOR EACH ROW
EXECUTE FUNCTION normalize_endereco();
```

## Arquivos Relacionados

- `supabase/migrations/20260225190000_normalize_enderecos_capitalization.sql` - Migration completa
- `normalize-enderecos.sql` - Script simplificado para SQL Editor
- `NORMALIZACAO_ENDERECOS.md` - Esta documentação

## Conclusão

A normalização garante:
- ✅ Dados consistentes e padronizados
- ✅ Interface sem duplicatas
- ✅ Melhor experiência do usuário
- ✅ Base sólida para crescimento do sistema

Execute o script e verifique os resultados!
