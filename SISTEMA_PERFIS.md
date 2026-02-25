# Sistema de Perfis e Autenticação

## Perfis de Usuário

O sistema possui três perfis de acesso:

### 1. Administrador
- Acesso total ao sistema
- Pode criar, editar e excluir usuários
- Acesso a todas as funcionalidades

### 2. Operações
- Acesso ao dashboard
- Criação e gerenciamento de campanhas
- Extração de relatórios
- Gerenciamento de inventário

### 3. Coordenador
- Acesso apenas às campanhas vinculadas pelo time de operações
- Pode executar registros de instalação
- Upload de fotos
- Atualização de status das instalações

## Controle de Acesso por Rota

| Rota | Administrador | Operações | Coordenador |
|------|---------------|-----------|-------------|
| /usuarios | ✅ | ❌ | ❌ |
| /campanhas (criar/editar/deletar) | ✅ | ✅ | ❌ |
| /campanhas (visualizar/executar) | ✅ | ✅ | ✅ |
| /relatorios | ✅ | ✅ | ❌ |
| /dashboard | ✅ | ✅ | ❌ |
| /inventario | ✅ | ✅ | ❌ |
| /mapa | ✅ | ✅ | ✅ |
| /ia | ✅ | ✅ | ❌ |

## Cadastro de Usuários

- Apenas administradores podem cadastrar novos usuários
- A tela de login não possui opção de cadastro
- Novos usuários são criados em `/usuarios` com:
  - Nome completo
  - E-mail
  - Senha temporária
  - Perfil (administrador, operações ou coordenador)

## Vinculação de Coordenadores

Coordenadores são vinculados a campanhas específicas através da tabela `campanha_coordenadores`:

```sql
-- Vincular coordenador a uma campanha
INSERT INTO campanha_coordenadores (campanha_id, coordenador_id)
VALUES ('uuid-da-campanha', 'uuid-do-coordenador');
```

## Migrations

### 20260225153000_update_roles_system.sql
- Atualiza o enum de perfis
- Cria tabela `campanha_coordenadores`
- Atualiza políticas RLS
- Migra dados existentes para os novos perfis

## Arquivos Modificados

### Backend (Supabase)
- `supabase/migrations/20260225153000_update_roles_system.sql`

### Frontend
- `src/contexts/AuthContext.tsx` - Adiciona verificação de perfil
- `src/pages/Login.tsx` - Remove opção de cadastro
- `src/pages/Users.tsx` - Nova página de gerenciamento de usuários
- `src/components/AppSidebar.tsx` - Filtra menu por perfil
- `src/components/RoleProtectedRoute.tsx` - Novo componente de proteção
- `src/App.tsx` - Adiciona proteção por perfil nas rotas

## Como Usar

### Criar um usuário administrador inicial

Execute no SQL Editor do Supabase:

```sql
-- Criar usuário admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@exemplo.com',
  crypt('senha123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"nome":"Administrador"}',
  now(),
  now()
);

-- Adicionar perfil de administrador
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'administrador'::app_role 
FROM auth.users 
WHERE email = 'admin@exemplo.com';
```

### Vincular coordenador a campanha

No código ou via SQL:

```typescript
// Via código
await supabase
  .from('campanha_coordenadores')
  .insert({
    campanha_id: 'uuid-da-campanha',
    coordenador_id: 'uuid-do-coordenador'
  });
```

```sql
-- Via SQL
INSERT INTO campanha_coordenadores (campanha_id, coordenador_id)
VALUES ('uuid-da-campanha', 'uuid-do-coordenador');
```
