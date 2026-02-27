# Debug: Dropdown de Coordenadores Vazio

## Problema
O dropdown de coordenadores está vazio mesmo com coordenador cadastrado no banco.

## Logs Adicionados

### Hook useCoordenadores
```typescript
console.log("🔍 [useCoordenadores] Iniciando busca...");

// Após query de profiles
console.log("📊 [PROFILES] Resultado da query:");
console.log("  data:", profilesData);
console.log("  error:", profilesError);
console.log("  quantidade:", profilesData?.length || 0);

// Após query de user_roles
console.log("👥 [USER_ROLES] Resultado da query:");
console.log("  data:", rolesData);
console.log("  error:", rolesError);
console.log("  quantidade:", rolesData?.length || 0);

// Após merge
console.log("✅ [MERGE] Coordenadores após filtro:");
console.log("  coordenadores:", coordenadores);
console.log("  quantidade:", coordenadores?.length || 0);

// Resultado final
console.log("🎯 [RESULTADO FINAL]:", resultado);
```

## Como Testar

1. Abrir console do navegador (F12)
2. Ir para página de Campanhas
3. Clicar em "Nova Campanha"
4. Preencher Etapa 1 e avançar para Etapa 2
5. Verificar logs no console

## Cenários Possíveis

### Cenário 1: Query de profiles retorna vazio
```
📊 [PROFILES] Resultado da query:
  data: []
  error: null
  quantidade: 0
```

**Causa**: Tabela profiles está vazia ou RLS bloqueando
**Solução**: Verificar RLS policies da tabela profiles

### Cenário 2: Query de user_roles retorna vazio
```
📊 [PROFILES] Resultado da query:
  data: [{ id: "abc-123", nome: "João Silva", ... }]
  quantidade: 1

👥 [USER_ROLES] Resultado da query:
  data: []
  error: null
  quantidade: 0
```

**Causa**: Não há registros com role='coordenador' ou RLS bloqueando
**Solução**: Verificar se coordenador tem registro em user_roles

### Cenário 3: Merge retorna vazio (IDs não batem)
```
📊 [PROFILES] Resultado da query:
  data: [{ id: "abc-123", nome: "João Silva", ... }]
  quantidade: 1

👥 [USER_ROLES] Resultado da query:
  data: [{ user_id: "def-456", role: "coordenador" }]
  quantidade: 1

✅ [MERGE] Coordenadores após filtro:
  coordenadores: []
  quantidade: 0
```

**Causa**: IDs não correspondem (profile.id ≠ role.user_id)
**Solução**: Verificar integridade dos dados no banco

### Cenário 4: Erro em uma das queries
```
📊 [PROFILES] Resultado da query:
  data: null
  error: { message: "...", code: "..." }
```

**Causa**: Erro de permissão, sintaxe, ou conexão
**Solução**: Verificar mensagem de erro específica

## Verificações no Banco

### 1. Verificar se coordenador existe
```sql
SELECT 
  p.id as profile_id,
  p.nome,
  p.email,
  ur.user_id as role_user_id,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador';
```

**Resultado esperado:**
```
profile_id | nome        | email              | role_user_id | role
-----------|-------------|--------------------|--------------|-----------
abc-123    | João Silva  | coord@example.com  | abc-123      | coordenador
```

**Se profile_id ≠ role_user_id**: Problema de integridade de dados

### 2. Verificar RLS policies de profiles
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';
```

Deve permitir SELECT para usuários autenticados.

### 3. Verificar RLS policies de user_roles
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_roles';
```

Deve permitir SELECT para usuários autenticados.

### 4. Testar queries manualmente
```sql
-- Query 1: Profiles
SELECT id, nome, territorios 
FROM profiles 
ORDER BY nome;

-- Query 2: User roles
SELECT user_id, role 
FROM user_roles 
WHERE role = 'coordenador';

-- Query 3: Join manual
SELECT 
  p.id,
  p.nome,
  p.territorios
FROM profiles p
INNER JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador'
ORDER BY p.nome;
```

## Análise dos Logs

### Exemplo de logs corretos:
```
🔍 [useCoordenadores] Iniciando busca...

📊 [PROFILES] Resultado da query:
  data: [
    {
      id: "abc-123",
      nome: "João Silva",
      territorios: { cidades: ["São Paulo"], comunidades: [] }
    }
  ]
  error: null
  quantidade: 1

👥 [USER_ROLES] Resultado da query:
  data: [
    { user_id: "abc-123", role: "coordenador" }
  ]
  error: null
  quantidade: 1

✅ [MERGE] Coordenadores após filtro:
  coordenadores: [
    {
      id: "abc-123",
      nome: "João Silva",
      territorios: { cidades: ["São Paulo"], comunidades: [] }
    }
  ]
  quantidade: 1

🎯 [RESULTADO FINAL]: [
  {
    id: "abc-123",
    nome: "João Silva",
    territorios: { cidades: ["São Paulo"], comunidades: [] }
  }
]
```

## Soluções por Cenário

### Se profiles retorna vazio:
1. Verificar se há dados na tabela: `SELECT COUNT(*) FROM profiles;`
2. Verificar RLS: Desabilitar temporariamente para testar
3. Verificar autenticação: Usuário está logado?

### Se user_roles retorna vazio:
1. Verificar se há coordenadores: `SELECT * FROM user_roles WHERE role = 'coordenador';`
2. Criar coordenador de teste se necessário
3. Verificar RLS da tabela user_roles

### Se merge retorna vazio:
1. Comparar IDs: `profile.id` deve ser igual a `role.user_id`
2. Corrigir dados inconsistentes no banco
3. Verificar se há espaços ou caracteres especiais nos IDs

### Se há erro:
1. Ler mensagem de erro completa
2. Verificar permissões do usuário logado
3. Verificar se tabelas existem

## Próximos Passos

1. Executar teste e coletar logs do console
2. Identificar qual cenário está ocorrendo
3. Executar queries SQL correspondentes
4. Aplicar solução específica
5. Enviar logs e resultados das queries SQL

## Arquivo Modificado

- `src/hooks/useCampaignsData.ts` - Logs detalhados adicionados

## Checklist

- [ ] Abrir console do navegador
- [ ] Ir para modal de nova campanha
- [ ] Copiar todos os logs do useCoordenadores
- [ ] Executar queries SQL de verificação
- [ ] Comparar IDs entre profiles e user_roles
- [ ] Verificar RLS policies
- [ ] Enviar resultados para análise
