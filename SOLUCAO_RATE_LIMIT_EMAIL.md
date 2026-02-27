# Solução: Rate Limit de Emails no Supabase

## Problema

Ao tentar criar múltiplos usuários em sequência, aparece o erro:

```
email rate limit exceeded
```

## Causa

O Supabase Auth tem limites de emails para prevenir spam e abuso:

**Limites padrão (Free Tier)**:
- 3-4 emails de confirmação por hora
- Limite por IP e por projeto
- Resetado a cada hora

**Por que existe?**
- Proteção contra spam
- Prevenir abuso de recursos
- Conformidade com provedores de email (SendGrid, etc)

## Soluções

### 1. Tratamento de Erro Melhorado ✅ (Implementado)

**Arquivo**: `src/pages/Users.tsx`

```typescript
catch (error: any) {
  // Tratamento específico para rate limit
  if (error.message?.includes("email rate limit exceeded") || 
      error.message?.includes("rate limit")) {
    toast({
      title: "Limite de emails atingido",
      description: "Você criou muitos usuários em pouco tempo. Aguarde alguns minutos e tente novamente.",
      variant: "destructive",
    });
  } else {
    toast({
      title: "Erro ao criar usuário",
      description: error.message,
      variant: "destructive",
    });
  }
}
```

**Resultado**: Mensagem clara explicando o problema e o que fazer.

---

### 2. Aguardar Entre Criações (Recomendado)

Se precisar criar vários usuários:

**Opção A**: Aguardar manualmente
- Criar 1 usuário
- Aguardar 15-20 minutos
- Criar próximo usuário

**Opção B**: Criar em lote com delay (futuro)
```typescript
async function criarUsuariosEmLote(usuarios: User[]) {
  for (const usuario of usuarios) {
    await criarUsuario(usuario);
    // Aguardar 20 minutos entre cada criação
    await new Promise(resolve => setTimeout(resolve, 20 * 60 * 1000));
  }
}
```

---

### 3. Desabilitar Email de Confirmação (Desenvolvimento)

**⚠️ APENAS PARA DESENVOLVIMENTO/TESTES**

No Supabase Dashboard:
1. Authentication → Settings
2. Email Auth → Disable "Enable email confirmations"
3. Usuários são criados sem precisar confirmar email

**Vantagens**:
- Sem limite de rate
- Criação instantânea
- Bom para testes

**Desvantagens**:
- ⚠️ Menos seguro
- ⚠️ Não recomendado para produção
- ⚠️ Usuários não verificam email

---

### 4. Aumentar Limite (Plano Pago)

**Supabase Pro Plan** ($25/mês):
- Limites maiores de email
- Mais recursos
- Suporte prioritário

**Como verificar limites atuais**:
1. Supabase Dashboard
2. Settings → Billing
3. Ver "Email Rate Limits"

---

### 5. Usar Convites em Vez de SignUp (Alternativa)

Em vez de criar usuários diretamente, enviar convites:

```typescript
// Criar usuário sem email de confirmação
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'senha-temporaria',
  email_confirm: true, // ← Confirma email automaticamente
});
```

**Vantagens**:
- Não envia email de confirmação
- Não conta no rate limit
- Usuário já está ativo

**Desvantagens**:
- Requer permissões de admin
- Pode dar erro 403 (como vimos antes)

---

## Solução Atual Implementada

### Tratamento de Erro

```typescript
// src/pages/Users.tsx

if (error.message?.includes("email rate limit exceeded")) {
  toast({
    title: "Limite de emails atingido",
    description: "Você criou muitos usuários em pouco tempo. Aguarde alguns minutos e tente novamente.",
    variant: "destructive",
  });
}
```

### Mensagem ao Usuário

Antes:
```
❌ Erro ao criar usuário
email rate limit exceeded
```

Depois:
```
⚠️ Limite de emails atingido
Você criou muitos usuários em pouco tempo. 
Aguarde alguns minutos e tente novamente.
```

---

## Recomendações

### Para Desenvolvimento
1. ✅ Usar tratamento de erro implementado
2. ✅ Aguardar 15-20 minutos entre criações
3. ⚠️ Considerar desabilitar confirmação de email (apenas dev)

### Para Produção
1. ✅ Manter confirmação de email ativa
2. ✅ Educar usuários sobre o limite
3. ✅ Considerar upgrade para Pro se criar muitos usuários
4. ✅ Implementar sistema de convites (futuro)

### Para Testes
1. ✅ Criar 2-3 usuários de teste
2. ✅ Reutilizar usuários existentes
3. ✅ Usar script SQL para criar coordenador de teste (não envia email)

---

## Script SQL Alternativo (Sem Email)

Para criar usuários de teste sem enviar email:

```sql
-- Inserir usuário diretamente no auth.users (apenas dev/teste)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'teste@example.com',
  crypt('senha123', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Pegar o ID do usuário criado
-- Depois criar profile e role manualmente
```

**⚠️ Não recomendado**: Pode causar problemas de sincronização.

---

## Monitoramento

Para verificar quantos emails foram enviados:

1. Supabase Dashboard
2. Authentication → Users
3. Ver "Email Logs" (se disponível)

Ou verificar no código:
```typescript
// Adicionar contador de criações
let criacoesNaUltimaHora = 0;

if (criacoesNaUltimaHora >= 3) {
  toast({
    title: "Limite próximo",
    description: "Você já criou 3 usuários. Aguarde antes de criar mais.",
    variant: "warning",
  });
  return;
}
```

---

## Resumo

| Solução | Implementado | Recomendado | Produção |
|---------|--------------|-------------|----------|
| Tratamento de erro | ✅ Sim | ✅ Sim | ✅ Sim |
| Aguardar entre criações | ⚠️ Manual | ✅ Sim | ✅ Sim |
| Desabilitar confirmação | ❌ Não | ⚠️ Dev apenas | ❌ Não |
| Upgrade Pro | ❌ Não | ⚠️ Se necessário | ✅ Sim |
| Sistema de convites | ❌ Não | ✅ Futuro | ✅ Sim |

---

## Arquivo Modificado

- `src/pages/Users.tsx` - Tratamento de rate limit

---

## Status

✅ **IMPLEMENTADO** - Mensagem clara quando atingir rate limit
⚠️ **AGUARDAR** - 15-20 minutos entre criações de usuários
