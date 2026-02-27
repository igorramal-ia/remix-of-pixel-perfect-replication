# Correção de Relacionamentos Supabase

## Problema

Erro: `Could not find a relationship between profiles and user_roles in the schema cache`

O Supabase não reconhece automaticamente relacionamentos entre tabelas quando usamos a sintaxe de JOIN com `!inner`.

## Causa

Queries que tentavam fazer JOIN direto:

```typescript
// ❌ NÃO FUNCIONA
const { data } = await supabase
  .from("profiles")
  .select(`
    id,
    nome,
    user_roles!inner (role)
  `)
  .eq("user_roles.role", "coordenador");
```

O Supabase precisa que os relacionamentos estejam explicitamente definidos no schema ou usa a convenção de foreign keys. Como `user_roles` não tem FK para `profiles`, o relacionamento não é reconhecido.

## Solução

Fazer duas queries separadas e merge no JavaScript:

```typescript
// ✅ FUNCIONA
// 1. Buscar profiles
const { data: profilesData } = await supabase
  .from("profiles")
  .select("id, nome");

// 2. Buscar roles
const { data: rolesData } = await supabase
  .from("user_roles")
  .select("user_id, role")
  .eq("role", "coordenador");

// 3. Merge no JavaScript
const coordenadores = profilesData?.filter((profile) =>
  rolesData?.some((role) => role.user_id === profile.id)
);
```

## Arquivos Corrigidos

### 1. src/pages/Users.tsx

**Antes:**
```typescript
const { data, error } = await supabase
  .from("profiles")
  .select(`
    id,
    email,
    nome,
    criado_em,
    territorios,
    user_roles!inner(role)
  `);
```

**Depois:**
```typescript
// Buscar profiles
const { data: profilesData } = await supabase
  .from("profiles")
  .select("id, email, nome, criado_em, territorios");

// Buscar roles
const { data: rolesData } = await supabase
  .from("user_roles")
  .select("user_id, role");

// Merge
const formattedUsers = profilesData?.map((user) => {
  const userRole = rolesData?.find((r) => r.user_id === user.id);
  return {
    ...user,
    role: userRole?.role || "coordenador",
  };
});
```

### 2. src/hooks/useCampaignsData.ts - useCoordenadores()

**Antes:**
```typescript
const { data } = await supabase
  .from("profiles")
  .select(`
    id,
    nome,
    user_roles!inner (role)
  `)
  .eq("user_roles.role", "coordenador");
```

**Depois:**
```typescript
// Buscar profiles
const { data: profilesData } = await supabase
  .from("profiles")
  .select("id, nome");

// Buscar roles de coordenadores
const { data: rolesData } = await supabase
  .from("user_roles")
  .select("user_id, role")
  .eq("role", "coordenador");

// Filtrar apenas coordenadores
const coordenadores = profilesData?.filter((profile) =>
  rolesData?.some((role) => role.user_id === profile.id)
);
```

### 3. src/components/NovaCampanhaModalV2.tsx

**Antes:**
```typescript
const { data: coordenadoresData } = await supabase
  .from("profiles")
  .select(`
    id,
    nome,
    territorios,
    user_roles!inner (role)
  `)
  .eq("user_roles.role", "coordenador");
```

**Depois:**
```typescript
// Buscar profiles
const { data: profilesData } = await supabase
  .from("profiles")
  .select("id, nome, territorios");

// Buscar roles
const { data: rolesData } = await supabase
  .from("user_roles")
  .select("user_id, role")
  .eq("role", "coordenador");

// Filtrar coordenadores
const coordenadoresData = profilesData?.filter((profile) =>
  rolesData?.some((role) => role.user_id === profile.id)
);
```

### 4. src/hooks/useCampaignsData.ts - useCampaigns() e useCampaignDetail()

**Problema Adicional:** Relacionamento `profiles:gestor_id` também não funcionava.

**Antes:**
```typescript
const { data: campanhas } = await supabase
  .from("campanhas")
  .select(`
    *,
    profiles:gestor_id (nome)
  `);

// Usar: campanha.profiles?.nome
```

**Depois:**
```typescript
const { data: campanhas } = await supabase
  .from("campanhas")
  .select("*");

// Para cada campanha, buscar gestor
for (const campanha of campanhas) {
  let gestorNome = null;
  if (campanha.gestor_id) {
    const { data: gestorData } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", campanha.gestor_id)
      .single();
    
    gestorNome = gestorData?.nome || null;
  }
}
```

## Correções Adicionais

### Tipo de Status em Instalações

**Problema:**
```typescript
status: "pendente"  // ❌ TypeScript não reconhece como literal
```

**Solução:**
```typescript
status: "pendente" as const  // ✅ Força tipo literal
```

### Tipo de Territorios

**Problema:**
```typescript
territorios: formData.territorios  // ❌ Tipo Territorios não é Json
```

**Solução:**
```typescript
territorios: formData.territorios as any  // ✅ Cast para any
```

## Padrão de Queries Separadas

### Quando Usar

Use queries separadas quando:
- ✅ Relacionamento não é reconhecido automaticamente
- ✅ Não há foreign key explícita
- ✅ Tabelas de junção (many-to-many)
- ✅ Relacionamentos customizados

### Vantagens

- ✅ Funciona sempre (sem depender de schema cache)
- ✅ Mais controle sobre os dados
- ✅ Fácil de debugar
- ✅ Flexível para lógica customizada

### Desvantagens

- ⚠️ Duas queries em vez de uma (pode ser mais lento)
- ⚠️ Mais código para escrever
- ⚠️ Merge manual necessário

### Performance

Para otimizar:
```typescript
// Fazer queries em paralelo
const [profilesData, rolesData] = await Promise.all([
  supabase.from("profiles").select("id, nome"),
  supabase.from("user_roles").select("user_id, role").eq("role", "coordenador")
]);
```

## Alternativa: Definir Relacionamentos no Schema

Se tiver acesso ao schema do Supabase, pode definir relacionamentos explícitos:

```sql
-- Adicionar foreign key (se possível)
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id);
```

Mas isso pode não ser possível se `profiles.id` referencia `auth.users.id`.

## Verificação

Após as correções, todas as páginas devem funcionar:

- ✅ `/usuarios` - Lista usuários com roles
- ✅ `/campanhas` - Lista campanhas com coordenadores
- ✅ Modal de nova campanha - Busca coordenadores
- ✅ Sugestão com IA - Busca coordenadores com territórios

## Conclusão

✅ Erro de relacionamento corrigido
✅ Queries separadas implementadas
✅ Merge de dados no JavaScript
✅ Tipos corrigidos
✅ Sistema funcionando

A abordagem de queries separadas é mais robusta e não depende do schema cache do Supabase.
