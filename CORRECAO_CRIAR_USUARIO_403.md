# Correção: Erro 403 ao Criar Usuário

## ✅ PROBLEMA RESOLVIDO

## Problema Original
Erro 403 (Forbidden) ao tentar criar novo usuário coordenador.

## Causa
O Supabase Auth não permite criar usuários via `supabase.auth.admin.createUser()` sem configuração adequada.

## Solução Implementada
Usar `supabase.auth.signUp()` em vez de `admin.createUser()`. Esta é a forma recomendada para criar usuários no frontend.

## Solução Implementada
Usar `supabase.auth.signUp()` em vez de `admin.createUser()`. Esta é a forma recomendada para criar usuários no frontend.

### Código Implementado

```typescript
// src/pages/Users.tsx - handleCreateUser()

const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      nome: formData.nome,
    },
    emailRedirectTo: `${window.location.origin}/login`,
  },
});

if (authError) throw authError;

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

### Vantagens desta Solução

1. **Não requer Service Role Key** - Funciona com a chave pública (anon key)
2. **Seguro** - Não expõe credenciais sensíveis no frontend
3. **Simples** - Usa a API padrão do Supabase Auth
4. **Email de confirmação** - Usuário recebe email automaticamente (se configurado)

### Comportamento

- Usuário é criado com email e senha
- Email de confirmação é enviado (se SMTP configurado)
- Role é adicionada na tabela `user_roles`
- Telefone e territórios são salvos no profile
- Toast mostra se email de confirmação foi enviado

### Configuração de Email (Opcional)

Para enviar emails de confirmação:

1. Supabase Dashboard → Authentication → Email Templates
2. Configurar SMTP ou usar o serviço padrão do Supabase
3. Personalizar template de confirmação

Se SMTP não estiver configurado, o usuário pode fazer login imediatamente com a senha fornecida.

---

## Soluções Alternativas (Não Implementadas)

### Opção 1: Usar Service Role Key (Não Recomendado para Frontend)

No código, você precisa usar o Service Role Key para operações admin:

```typescript
// Criar cliente Supabase com Service Role
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Service Role Key
);

// Usar supabaseAdmin para criar usuário
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: formData.email,
  password: formData.password,
  email_confirm: true,
});
```

**IMPORTANTE**: Service Role Key deve estar apenas no backend, NUNCA no frontend! Esta solução não é segura para aplicações web.

### Opção 2: Criar Edge Function (Mais Seguro)

Criar uma Edge Function no Supabase para criar usuários (se precisar de mais controle):

```typescript
// supabase/functions/create-user/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { email, password, nome, role } = await req.json()
  
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Criar usuário
  const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome }
  })

  if (error) throw error

  // Adicionar role
  await supabaseAdmin.from('user_roles').insert({
    user_id: user.user.id,
    role
  })

  return new Response(JSON.stringify({ user }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Opção 3: Usar Invite (Alternativa Simples)

Em vez de criar usuário diretamente, enviar convite:

```typescript
const { data, error } = await supabase.auth.admin.inviteUserByEmail(
  formData.email,
  {
    data: {
      nome: formData.nome,
      role: formData.role
    }
  }
);
```

O usuário recebe email e define a própria senha.

---

## Status Final

✅ **RESOLVIDO** - Usando `supabase.auth.signUp()` no frontend
✅ Campo telefone adicionado e funcionando
✅ Territórios salvos corretamente para coordenadores
✅ Toast com feedback sobre email de confirmação

## Como Testar

1. Ir para página de Usuários
2. Clicar em "Novo Usuário"
3. Preencher:
   - Nome: "Coordenador Teste"
   - Email: "teste@example.com"
   - Telefone: "(11) 98765-4321"
   - Senha: "senha123"
   - Perfil: "Coordenador"
   - Territórios: Adicionar UF, Cidade, Comunidade
4. Clicar em "Criar Usuário"
5. Verificar toast de sucesso
6. Verificar que usuário aparece na listagem com telefone e territórios

## Observações

- Se email confirmation estiver habilitado no Supabase, o usuário receberá um email
- Se não estiver configurado, o usuário pode fazer login imediatamente
- Para desabilitar confirmação de email: Supabase Dashboard → Authentication → Settings → "Enable email confirmations" (desmarcar)
