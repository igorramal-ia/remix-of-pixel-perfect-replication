# Executar Diagnóstico - Territórios não persistem

## 🎯 Objetivo
Descobrir por que o UPDATE retorna sucesso mas os dados voltam vazios ao recarregar.

---

## 📋 Passo 1: Verificar no Banco de Dados

### Abrir SQL Editor do Supabase

Copiar e colar este script:

```sql
-- 1. Verificar tipo da coluna territorios
SELECT 
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'territorios';

-- Resultado esperado: data_type = 'jsonb' ou 'json'
```

```sql
-- 2. Ver dados atuais do coordenador
SELECT 
  id, 
  nome, 
  email,
  territorios,
  territorios::text as territorios_texto
FROM profiles 
WHERE email = 'coordenador@df.com';

-- Anotar o ID do usuário para usar no próximo teste
```

```sql
-- 3. Testar UPDATE manual (SUBSTITUIR [user_id] pelo ID do passo 2)
UPDATE profiles 
SET territorios = '{"cidades": ["São Paulo"], "comunidades": ["Heliópolis"]}'::jsonb
WHERE id = '[user_id]'
RETURNING id, nome, territorios;

-- Se retornar erro → problema de permissão ou tipo
-- Se retornar sucesso → continuar para passo 4
```

```sql
-- 4. Verificar se persistiu
SELECT id, nome, territorios 
FROM profiles 
WHERE id = '[user_id]';

-- Se territorios está NULL → problema de RLS ou trigger
-- Se territorios tem dados → problema está no app, não no banco
```

```sql
-- 5. Verificar RLS policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Procurar por policies que bloqueiam UPDATE
```

---

## 📋 Passo 2: Testar no App

### Abrir Console do Navegador (F12)

1. Ir para página de Usuários
2. Clicar em "Editar" em um coordenador
3. Adicionar território:
   - UF: "SP"
   - Cidade: "São Paulo"
   - Comunidade: "Heliópolis"
   - Clicar em "Adicionar Território"
4. Clicar em "Salvar"

### Coletar Logs

Copiar TODOS os logs que aparecerem:

```
🔄 [TerritoriosEditor] Notificando mudança:
  territorios internos: [...]
  cidades extraídas: [...]
  comunidades extraídas: [...]

💾 [CLIQUE EM SALVAR]
  editTerritorios: { cidades: [...], comunidades: [...] }

🔵 [ANTES DO UPDATE]
  userId: "..."
  territorios: { cidades: [...], comunidades: [...] }

🟢 [DEPOIS DO UPDATE]
  data: [...]
  data stringified: "..."
  error: null

✅ [UPDATE SUCESSO - DADOS RETORNADOS]
  territorios salvos: { cidades: [...], comunidades: [...] }

🔄 [INVALIDANDO QUERIES]

📥 [BUSCANDO USUÁRIOS]
📊 [PROFILES DO BANCO]: [...]
✅ ou ⚠️ Territórios de [Nome]: ...
```

---

## 🔍 Análise dos Resultados

### Cenário 1: UPDATE manual funciona no SQL Editor
✅ Dados persistem no banco
❌ Problema está no app (permissão, cache, ou query)

**Solução**: Verificar RLS policies para o usuário logado

### Cenário 2: UPDATE manual falha no SQL Editor
❌ Problema está no banco (constraint, trigger, ou tipo)

**Solução**: Verificar tipo da coluna e triggers

### Cenário 3: UPDATE retorna dados mas fetchUsers retorna vazio
✅ UPDATE funciona
❌ Problema no SELECT ou cache

**Solução**: Verificar se campo territorios está no SELECT (já está)

### Cenário 4: territorios salvos no log mas vazio no banco
❌ RLS policy ou trigger revertendo mudança

**Solução**: Ajustar RLS policy ou desabilitar trigger

---

## 🚨 Problemas Comuns

### Problema: Coluna territorios é TEXT em vez de JSONB
```sql
-- Verificar tipo
SELECT data_type FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'territorios';

-- Se for TEXT, converter para JSONB
ALTER TABLE profiles 
ALTER COLUMN territorios TYPE jsonb USING territorios::jsonb;
```

### Problema: RLS policy bloqueando UPDATE
```sql
-- Ver policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Criar policy para permitir UPDATE (se necessário)
CREATE POLICY "Admins podem atualizar profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'administrador'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'administrador'
  )
);
```

### Problema: Trigger revertendo mudanças
```sql
-- Ver triggers
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- Desabilitar trigger (se necessário)
-- ALTER TABLE profiles DISABLE TRIGGER [trigger_name];
```

---

## 📤 Enviar Resultados

Após executar os testes, enviar:

1. **Resultado do SQL Editor**:
   - Tipo da coluna territorios
   - Dados atuais do coordenador
   - Resultado do UPDATE manual
   - RLS policies

2. **Logs do Console**:
   - Todos os logs desde "🔄 [TerritoriosEditor]" até "📋 [USUÁRIOS FORMATADOS]"

3. **Observações**:
   - UPDATE manual funcionou?
   - Dados persistiram no banco?
   - Logs mostram dados corretos?

---

## ✅ Checklist

- [ ] Executar queries SQL no Supabase
- [ ] Anotar tipo da coluna territorios
- [ ] Testar UPDATE manual
- [ ] Verificar se dados persistiram
- [ ] Verificar RLS policies
- [ ] Testar no app com console aberto
- [ ] Coletar todos os logs
- [ ] Comparar dados do UPDATE vs fetchUsers
- [ ] Enviar resultados para análise
