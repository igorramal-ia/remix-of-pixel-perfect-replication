# Resumo: Normalização de Endereços

## O Que Foi Criado

### 1. Migration Principal
**Arquivo:** `supabase/migrations/20260225190000_normalize_enderecos_capitalization.sql`

**O que faz:**
- ✅ Normaliza cidade e comunidade para Title Case usando `initcap()`
- ✅ Identifica e remove duplicatas
- ✅ Atualiza referências em `proprietarios`, `instalacoes`, `inventario_historico`
- ✅ Cria índice para melhor performance
- ✅ Gera relatório de execução

**Exemplo:**
```
ANTES: HELIÓPOLIS, heliópolis, HeLiÓpOlIs
DEPOIS: Heliópolis (apenas 1 registro)
```

### 2. Script SQL Simplificado
**Arquivo:** `normalize-enderecos.sql`

**O que faz:**
- Versão simplificada para executar no SQL Editor
- Mesma funcionalidade da migration
- Inclui verificações e relatórios

### 3. Migration de Trigger
**Arquivo:** `supabase/migrations/20260225190100_add_normalize_trigger.sql`

**O que faz:**
- ✅ Cria função `normalize_endereco_before_save()`
- ✅ Cria trigger que executa ANTES de INSERT/UPDATE
- ✅ Normaliza automaticamente:
  - `cidade` → Title Case
  - `comunidade` → Title Case
  - `uf` → MAIÚSCULO

**Benefício:** Novos endereços são normalizados automaticamente!

### 4. Documentação
**Arquivo:** `NORMALIZACAO_ENDERECOS.md`

**Conteúdo:**
- Explicação detalhada do processo
- Exemplos de transformação
- Guia de aplicação
- Verificações pós-execução
- Próximos passos

## Como Aplicar

### Passo 1: Normalizar Dados Existentes

**Via SQL Editor (Recomendado):**
1. Acesse: https://supabase.com/dashboard/project/ompimrxcmajdxwpahbub
2. SQL Editor → New Query
3. Cole o conteúdo de `normalize-enderecos.sql`
4. Execute (Ctrl+Enter)
5. Aguarde conclusão

**Ou via Migration:**
```bash
# Se tiver Supabase CLI
npx supabase db push
```

### Passo 2: Adicionar Trigger (Automático)

**Via SQL Editor:**
1. SQL Editor → New Query
2. Cole o conteúdo de `supabase/migrations/20260225190100_add_normalize_trigger.sql`
3. Execute

**Ou via Migration:**
```bash
npx supabase db push
```

## Resultado Esperado

### Antes da Normalização
```sql
SELECT cidade, comunidade, COUNT(*) 
FROM enderecos 
GROUP BY cidade, comunidade;

-- Resultado:
| cidade        | comunidade  | count |
|---------------|-------------|-------|
| SÃO PAULO     | HELIÓPOLIS  | 50    |
| são paulo     | heliópolis  | 30    |
| São Paulo     | Heliópolis  | 20    |
| RIO DE JANEIRO| ROCINHA     | 40    |
| rio de janeiro| rocinha     | 25    |
```

### Depois da Normalização
```sql
SELECT cidade, comunidade, COUNT(*) 
FROM enderecos 
GROUP BY cidade, comunidade;

-- Resultado:
| cidade         | comunidade | count |
|----------------|------------|-------|
| São Paulo      | Heliópolis | 100   |
| Rio De Janeiro | Rocinha    | 65    |
```

## Impacto no Sistema

### Interface do Usuário
**Antes:**
```
Select Cidade:
- SÃO PAULO
- são paulo
- São Paulo
- RIO DE JANEIRO
- rio de janeiro
```

**Depois:**
```
Select Cidade:
- Rio De Janeiro
- São Paulo
```

### Performance
- ✅ Menos registros = queries mais rápidas
- ✅ Índice criado = buscas otimizadas
- ✅ Sem duplicatas = menos confusão

### Integridade
- ✅ Referências atualizadas em todas as tabelas
- ✅ Sem registros órfãos
- ✅ Trigger previne novos problemas

## Verificação

### 1. Verificar Normalização
```sql
-- Deve retornar apenas Title Case
SELECT DISTINCT cidade, comunidade
FROM enderecos
ORDER BY cidade
LIMIT 10;
```

### 2. Verificar Duplicatas
```sql
-- Deve retornar 0 linhas
SELECT uf, cidade, comunidade, endereco, COUNT(*)
FROM enderecos
GROUP BY uf, cidade, comunidade, endereco
HAVING COUNT(*) > 1;
```

### 3. Verificar Trigger
```sql
-- Inserir teste
INSERT INTO enderecos (uf, cidade, comunidade, endereco, status)
VALUES ('sp', 'TESTE CIDADE', 'teste comunidade', 'Rua Teste', 'disponivel');

-- Verificar se foi normalizado
SELECT uf, cidade, comunidade 
FROM enderecos 
WHERE endereco = 'Rua Teste';

-- Esperado: uf='SP', cidade='Teste Cidade', comunidade='Teste Comunidade'

-- Limpar teste
DELETE FROM enderecos WHERE endereco = 'Rua Teste';
```

## Estatísticas Esperadas

Baseado em um banco típico:
- **Registros antes:** ~1500
- **Duplicatas removidas:** ~300 (20%)
- **Registros depois:** ~1200
- **Tempo de execução:** 5-30 segundos

## Próximos Passos (Opcional)

### 1. Adicionar Constraint UNIQUE
```sql
ALTER TABLE enderecos 
ADD CONSTRAINT enderecos_unique_location 
UNIQUE (uf, cidade, comunidade, endereco);
```

**Benefício:** Impede duplicatas no nível do banco

### 2. Normalizar Outros Campos
```sql
-- Normalizar campo 'endereco' também
UPDATE enderecos
SET endereco = initcap(endereco);
```

### 3. Criar Função Helper
```sql
CREATE OR REPLACE FUNCTION get_cidades_by_uf(uf_param TEXT)
RETURNS TABLE(cidade TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT e.cidade
  FROM enderecos e
  WHERE e.uf = upper(uf_param)
  ORDER BY e.cidade;
END;
$$ LANGUAGE plpgsql;
```

## Arquivos Criados

1. ✅ `supabase/migrations/20260225190000_normalize_enderecos_capitalization.sql`
2. ✅ `supabase/migrations/20260225190100_add_normalize_trigger.sql`
3. ✅ `normalize-enderecos.sql`
4. ✅ `NORMALIZACAO_ENDERECOS.md`
5. ✅ `RESUMO_NORMALIZACAO.md`

## Conclusão

✅ **Migration criada** para normalizar dados existentes
✅ **Trigger criado** para normalizar novos dados automaticamente
✅ **Documentação completa** com exemplos e verificações
✅ **Script simplificado** para execução rápida

**Próximo passo:** Executar `normalize-enderecos.sql` no SQL Editor do Supabase!

## Suporte

Se encontrar problemas:
1. Verificar logs de erro no Supabase
2. Criar backup antes de executar
3. Testar em ambiente de desenvolvimento primeiro
4. Consultar `NORMALIZACAO_ENDERECOS.md` para detalhes
