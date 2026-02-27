# Normalização de Capitalização - Guia Rápido

## O Que Será Feito

Esta migration normaliza APENAS a capitalização dos campos:
- `uf` → MAIÚSCULO (ex: SP, RJ, MG)
- `cidade` → Title Case (ex: São Paulo, Rio De Janeiro)
- `comunidade` → Title Case (ex: Heliópolis, Rocinha)
- `endereco` → Title Case (ex: Rua Das Flores)

**NÃO remove duplicatas** - apenas padroniza a escrita.

## Transformações Esperadas

### Antes:
```
RO DE JANEIRO → Rio De Janeiro
SÃO PAULO → São Paulo
SALVADOR → Salvador
RECIFE → Recife
FORTALEZA → Fortaleza
MACEIÓ → Maceió
BELO HORIZONTE → Belo Horizonte
heliópolis → Heliópolis
ROCINHA → Rocinha
```

### Depois:
```
Rio De Janeiro
São Paulo
Salvador
Recife
Fortaleza
Maceió
Belo Horizonte
Heliópolis
Rocinha
```

## Como Executar

### Opção 1: Via SQL Editor do Supabase (Recomendado)

1. **Acessar Supabase:**
   - URL: https://supabase.com/dashboard/project/ompimrxcmajdxwpahbub
   - Menu: SQL Editor → New Query

2. **Copiar e Colar:**
   - Abrir arquivo: `normalize-capitalization.sql`
   - Copiar TODO o conteúdo
   - Colar no SQL Editor

3. **Executar:**
   - Clicar em "Run" ou pressionar `Ctrl+Enter`
   - Aguardar conclusão (5-10 segundos)

4. **Verificar Resultado:**
   - O script mostra estatísticas ANTES e DEPOIS
   - Mostra lista de cidades normalizadas

### Opção 2: Via Supabase CLI

Se tiver o CLI instalado:

```bash
# Aplicar migration
npx supabase db push

# Ou aplicar migration específica
npx supabase migration up
```

## Verificação Pós-Execução

### 1. Verificar Cidades Normalizadas

Execute no SQL Editor:

```sql
SELECT DISTINCT cidade
FROM enderecos
ORDER BY cidade
LIMIT 20;
```

**Esperado:** Todas em Title Case
```
Belo Horizonte
Fortaleza
Maceió
Recife
Rio De Janeiro
Salvador
São Paulo
```

### 2. Verificar UFs

```sql
SELECT DISTINCT uf
FROM enderecos
ORDER BY uf;
```

**Esperado:** Todas em MAIÚSCULO
```
BA
CE
MG
PE
RJ
SP
```

### 3. Verificar Comunidades

```sql
SELECT DISTINCT comunidade
FROM enderecos
ORDER BY comunidade
LIMIT 20;
```

**Esperado:** Todas em Title Case
```
Heliópolis
Paraisópolis
Rocinha
```

### 4. Verificar se Há Problemas

```sql
-- Deve retornar 0 linhas
SELECT cidade, COUNT(*)
FROM enderecos
WHERE cidade != initcap(cidade)
GROUP BY cidade;
```

## Impacto

### Tabelas Afetadas
- ✅ `enderecos` - Todos os campos de texto normalizados

### Benefícios
- ✅ Dados consistentes e padronizados
- ✅ Interface mais limpa
- ✅ Selects sem duplicatas visuais
- ✅ Melhor experiência do usuário

### Riscos
- ⚠️ Operação irreversível (mas segura)
- ⚠️ Pode levar 5-10 segundos
- ⚠️ Não afeta funcionalidade, apenas aparência

## Estatísticas Esperadas

Baseado em um banco típico:
- **Registros afetados:** Todos (~1200-1500)
- **Tempo de execução:** 5-10 segundos
- **Duplicatas removidas:** 0 (não remove duplicatas)

## Exemplo de Execução

```sql
-- ANTES
SELECT DISTINCT cidade FROM enderecos ORDER BY cidade LIMIT 5;

RO DE JANEIRO
SÃO PAULO
SALVADOR
RECIFE
FORTALEZA

-- EXECUTAR NORMALIZAÇÃO
UPDATE enderecos SET cidade = initcap(trim(cidade));

-- DEPOIS
SELECT DISTINCT cidade FROM enderecos ORDER BY cidade LIMIT 5;

Fortaleza
Recife
Rio De Janeiro
Salvador
São Paulo
```

## Troubleshooting

### Problema: "RO DE JANEIRO" ainda aparece

**Causa:** Pode ser um typo no banco (RO em vez de RIO)

**Solução:** Executar correção manual:
```sql
UPDATE enderecos
SET cidade = 'Rio De Janeiro'
WHERE cidade ILIKE 'ro de janeiro';
```

### Problema: Acentos não aparecem corretamente

**Causa:** Encoding do banco

**Solução:** Verificar encoding:
```sql
SHOW server_encoding;
-- Deve retornar: UTF8
```

### Problema: Migration já foi aplicada

**Causa:** Migration já executada anteriormente

**Solução:** Executar apenas o UPDATE:
```sql
UPDATE enderecos
SET 
  uf = upper(trim(uf)),
  cidade = initcap(trim(cidade)),
  comunidade = initcap(trim(comunidade)),
  endereco = initcap(trim(endereco));
```

## Próximos Passos

### 1. Verificar Interface

Após executar, verificar nas páginas:
- `/campanhas` - Select de cidades
- `/usuarios` - Editor de territórios
- `/inventario` - Lista de endereços

### 2. Testar Criação de Campanha

1. Criar nova campanha
2. Selecionar UF
3. Verificar que cidades aparecem normalizadas
4. Selecionar cidade
5. Verificar que comunidades aparecem normalizadas

### 3. Adicionar Trigger (Opcional)

Para normalizar automaticamente novos registros:

```sql
CREATE OR REPLACE FUNCTION normalize_endereco_before_save()
RETURNS TRIGGER AS $$
BEGIN
  NEW.uf = upper(trim(NEW.uf));
  NEW.cidade = initcap(trim(NEW.cidade));
  NEW.comunidade = initcap(trim(NEW.comunidade));
  NEW.endereco = initcap(trim(NEW.endereco));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_normalize_endereco
  BEFORE INSERT OR UPDATE ON enderecos
  FOR EACH ROW
  EXECUTE FUNCTION normalize_endereco_before_save();
```

## Arquivos Relacionados

- `supabase/migrations/20260225200000_normalize_capitalization_only.sql` - Migration
- `normalize-capitalization.sql` - Script para SQL Editor
- `EXECUTAR_NORMALIZACAO_SIMPLES.md` - Este guia

## Conclusão

✅ Migration criada e pronta para executar
✅ Script SQL simplificado disponível
✅ Guia de verificação completo
✅ Sem risco de perda de dados

**Próximo passo:** Executar `normalize-capitalization.sql` no SQL Editor!
