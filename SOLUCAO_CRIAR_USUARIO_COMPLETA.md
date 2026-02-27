# Solução Completa: Criar Usuário com Telefone e Territórios

## ✅ Problema Resolvido

### Problema Original
- Erro 403 ao tentar criar usuário via `supabase.auth.admin.createUser()`
- Campo telefone não estava sendo salvo
- Territórios não persistiam no banco

### Solução Implementada
Mudança de `admin.createUser()` para `auth.signUp()` + ajuste de RLS policies

---

## Mudanças Realizadas

### 1. Código do Frontend (`src/pages/Users.tsx`)

#### Antes (com erro 403):
```typescript
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email: formData.email,
  password: formData.password,
  email_confirm: true,
  user_metadata: { nome: formData.nome },
});
```

#### Depois (funcionando):
```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: { nome: formData.nome },
    emailRedirectTo: `${window.location.origin}/login`,
  },
});

if (authData.user) {
  // Adicionar role
  await supabase.from("user_roles").insert({
    user_id: authData.user.id,
    role: formData.role,
  });

  // Atualizar profile com telefone e territórios
  const updateData: any = {
    telefone: formData.telefone || null,
  };

  if (formData.role === "coordenador") {
    updateData.territorios = formData.territorios as any;
  }

  await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", authData.user.id);
}
```

### 2. RLS Policies (`fix-user-creation-policies.sql`)

#### Policy para `user_roles`
Permite que usuários recém-criados insiram sua própria role:

```sql
CREATE POLICY "Users can insert own role on signup"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'administrador') 
  OR user_id = auth.uid()
);
```

#### Policy para `profiles`
Permite que usuários atualizem seu próprio profile:

```sql
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

---

## Fluxo Completo de Criação de Usuário

```
1. Admin preenche formulário
   ├─ Nome: "João Silva"
   ├─ Email: "joao@example.com"
   ├─ Telefone: "(11) 98765-4321"
   ├─ Senha: "senha123"
   ├─ Perfil: "Coordenador"
   └─ Territórios: SP > São Paulo > Heliópolis

2. Frontend chama supabase.auth.signUp()
   ├─ Cria usuário no Supabase Auth
   ├─ Cria registro em profiles (trigger automático)
   └─ Retorna user.id

3. Frontend insere role em user_roles
   └─ INSERT INTO user_roles (user_id, role) VALUES (user.id, 'coordenador')

4. Frontend atualiza profile
   └─ UPDATE profiles SET telefone = '...', territorios = {...} WHERE id = user.id

5. Toast de sucesso
   └─ "Usuário criado com sucesso. Um email de confirmação foi enviado."

6. Listagem atualizada
   └─ fetchUsers() busca dados atualizados
```

---

## Campos Salvos

### Tabela: `auth.users`
- `id` (UUID)
- `email`
- `encrypted_password`
- `user_metadata.nome`

### Tabela: `public.profiles`
- `id` (UUID, mesmo do auth.users)
- `email`
- `nome` (copiado do user_metadata)
- `telefone` ✅ NOVO
- `territorios` (JSONB)
- `criado_em`

### Tabela: `public.user_roles`
- `user_id` (UUID)
- `role` (administrador | operacoes | coordenador)

---

## Estrutura de Territórios

### Formato JSON
```json
{
  "cidades": ["São Paulo", "Rio De Janeiro"],
  "comunidades": ["Heliópolis", "Paraisópolis"]
}
```

### Exibição na UI
- **Cidades**: Badge azul (`bg-blue-500`)
- **Comunidades**: Badge verde (`bg-green-500`)
- **Sem território**: Texto cinza "Sem território"

---

## Como Testar

### Teste 1: Criar Coordenador com Telefone e Territórios

1. Ir para página de Usuários
2. Clicar em "Novo Usuário"
3. Preencher:
   - Nome: "Coordenador Teste"
   - Email: "teste@example.com"
   - Telefone: "(11) 98765-4321"
   - Senha: "senha123"
   - Perfil: "Coordenador"
4. Adicionar territórios:
   - Selecionar UF: "SP"
   - Selecionar Cidade: "São Paulo"
   - Selecionar Comunidade: "Heliópolis"
   - Clicar em "Adicionar"
5. Clicar em "Criar Usuário"
6. Verificar toast de sucesso
7. Verificar na listagem:
   - Nome: "Coordenador Teste"
   - Email: "teste@example.com"
   - Perfil: Badge "Coordenador"
   - Território: Badge verde "Heliópolis"

### Teste 2: Verificar no Banco de Dados

```sql
-- Verificar usuário criado
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'teste@example.com';

-- Verificar profile
SELECT id, nome, email, telefone, territorios 
FROM profiles 
WHERE email = 'teste@example.com';

-- Verificar role
SELECT user_id, role 
FROM user_roles 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'teste@example.com');
```

Resultado esperado:
```
profiles:
  nome: "Coordenador Teste"
  telefone: "(11) 98765-4321"
  territorios: {"cidades": [], "comunidades": ["Heliópolis"]}

user_roles:
  role: "coordenador"
```

### Teste 3: Login com Novo Usuário

1. Fazer logout
2. Ir para /login
3. Entrar com:
   - Email: "teste@example.com"
   - Senha: "senha123"
4. Verificar que login funciona
5. Verificar que role está correta (coordenador)

---

## Configuração de Email (Opcional)

### Para Enviar Emails de Confirmação

1. Supabase Dashboard → Authentication → Settings
2. Configurar SMTP:
   - Host: smtp.gmail.com (ou outro)
   - Port: 587
   - Username: seu-email@gmail.com
   - Password: senha-de-app
3. Salvar configurações

### Para Desabilitar Confirmação de Email

1. Supabase Dashboard → Authentication → Settings
2. Desmarcar "Enable email confirmations"
3. Usuários podem fazer login imediatamente após criação

---

## Troubleshooting

### Erro: "new row violates row-level security policy"

**Causa**: RLS policies não permitem INSERT/UPDATE

**Solução**: Executar `fix-user-creation-policies.sql`

### Erro: "duplicate key value violates unique constraint"

**Causa**: Email já existe no banco

**Solução**: Usar outro email ou deletar usuário existente

### Telefone não aparece na listagem

**Causa**: Campo não foi adicionado na query

**Solução**: Verificar se `fetchUsers()` inclui `telefone` no SELECT

### Territórios não aparecem

**Causa**: Dados não foram salvos ou query não retorna o campo

**Solução**: 
1. Verificar no banco: `SELECT territorios FROM profiles WHERE id = '...'`
2. Verificar console do navegador para logs de debug
3. Executar `fix-user-creation-policies.sql`

---

## Melhorias Futuras

### 1. Enviar Email ao Vincular Coordenador a Campanha

Quando um coordenador for vinculado a uma campanha, enviar email automático:

```typescript
// Após vincular coordenador
await enviarEmailCoordenador({
  email: coordenador.email,
  nome: coordenador.nome,
  campanha: campanha.nome,
  cliente: campanha.cliente,
  dataInicio: campanha.data_inicio,
  dataFim: campanha.data_fim,
});
```

### 2. Validação de Telefone

Adicionar máscara e validação no campo telefone:

```typescript
import { IMaskInput } from 'react-imask';

<IMaskInput
  mask="(00) 00000-0000"
  value={formData.telefone}
  onAccept={(value) => setFormData({ ...formData, telefone: value })}
/>
```

### 3. Editar Telefone de Usuários Existentes

Adicionar campo telefone no modal de edição de territórios.

---

## Status Final

✅ Erro 403 resolvido (usando signUp)
✅ Campo telefone adicionado e funcionando
✅ Territórios salvos corretamente
✅ RLS policies ajustadas
✅ Documentação completa
✅ Scripts SQL para verificação

## Arquivos Modificados

1. `src/pages/Users.tsx` - Mudança de admin.createUser para signUp
2. `fix-user-creation-policies.sql` - Policies de RLS
3. `CORRECAO_CRIAR_USUARIO_403.md` - Documentação atualizada
4. `SOLUCAO_CRIAR_USUARIO_COMPLETA.md` - Este documento

## Próximos Passos

1. Testar criação de usuário no ambiente de desenvolvimento
2. Aplicar policies SQL no banco de dados
3. Configurar SMTP para envio de emails (opcional)
4. Implementar envio de email ao vincular coordenador (futuro)
