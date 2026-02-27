# Correções Finais - Territórios e Permissões

## ✅ Problemas Identificados e Corrigidos

### 1. Submissão Automática do Formulário
**Problema**: Usuário era criado automaticamente ao selecionar comunidade

**Causa**: Botão "Adicionar Território" não tinha `type="button"`, então disparava submit do form

**Solução**: Adicionado `type="button"` no botão
```typescript
<Button
  type="button"  // ✅ Agora não submete o form
  onClick={handleAdicionarTerritorio}
>
  Adicionar Território
</Button>
```

**Status**: ✅ RESOLVIDO

---

### 2. Territórios Não Aparecem na Listagem
**Problema**: Territórios salvos no banco mas não aparecem na UI

**Causa**: Possível problema no formato dos dados ou na renderização

**Solução**: Adicionados logs detalhados para debug
```typescript
console.log("🔍 [DEBUG] Usuário:", user.nome);
console.log("  Territorios (raw):", user.territorios);
console.log("  cidades:", user.territorios.cidades);
console.log("  comunidades:", user.territorios.comunidades);
```

**Status**: 🔍 EM INVESTIGAÇÃO - Aguardando logs do console

---

### 3. Usuário Criado Sem Nome
**Problema**: Usuário aparece sem nome na listagem (linha vazia)

**Causa**: Nome não estava sendo salvo no profile, apenas no user_metadata

**Solução**: Garantir que nome seja salvo no profile também
```typescript
const updateData: any = {
  nome: formData.nome,  // ✅ Agora salva nome explicitamente
  telefone: formData.telefone || null,
};
```

**Status**: ✅ RESOLVIDO

---

### 4. Não Consegue Editar Usuários
**Problema**: Admin não consegue editar territórios de coordenadores

**Causa**: Falta de policies de RLS para UPDATE e DELETE na tabela profiles

**Solução**: Criar policies para admins
```sql
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'))
WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));
```

**Status**: ⏳ PENDENTE - Executar `fix-profiles-policies.sql`

---

## 📋 Checklist de Ações

### Ações Imediatas

- [x] Corrigir botão "Adicionar Território" (type="button")
- [x] Adicionar logs detalhados para debug
- [x] Garantir que nome seja salvo no profile
- [ ] Executar `fix-profiles-policies.sql` no Supabase
- [ ] Testar edição de territórios
- [ ] Verificar logs do console ao criar usuário
- [ ] Verificar logs do console ao listar usuários

### Verificações no Banco

Execute estes SQLs no Supabase:

1. **Verificar territórios salvos**:
```sql
SELECT nome, territorios 
FROM profiles 
WHERE territorios IS NOT NULL
ORDER BY criado_em DESC;
```

2. **Verificar policies**:
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
```

3. **Limpar usuário sem nome** (se existir):
```sql
-- Ver usuário sem nome
SELECT id, nome, email FROM profiles WHERE nome IS NULL OR nome = '';

-- Deletar (substitua [user_id])
DELETE FROM profiles WHERE id = '[user_id]';
```

---

## 🧪 Como Testar Agora

### Teste 1: Criar Usuário com Territórios

1. **Abrir console** (F12)
2. Ir para **Usuários** → **Novo Usuário**
3. Preencher:
   - Nome: "Teste Arlindo 2"
   - Email: "arlindo2@df.com"
   - Telefone: "(11) 98765-4321"
   - Senha: "senha123"
   - Perfil: "Coordenador"
4. Adicionar territórios:
   - SP → São Paulo → Heliópolis
   - Clicar em "Adicionar Território"
   - SP → São Paulo → Paraisópolis
   - Clicar em "Adicionar Território"
5. Verificar que badges aparecem
6. Clicar em "Criar Usuário"
7. **Copiar logs do console**

**Logs esperados**:
```
🔵 [CRIAR USUÁRIO] Iniciando...
  formData: {nome: "Teste Arlindo 2", ...}
  territorios: {cidades: [], comunidades: ["Heliópolis", "Paraisópolis"]}
✅ [AUTH] Usuário criado: abc-123
✅ [ROLE] Role inserida
🗺️ [TERRITORIOS] Salvando territórios:
  formData.territorios: {cidades: [], comunidades: ["Heliópolis", "Paraisópolis"]}
✅ [PROFILE] Profile atualizado
```

8. **Recarregar página** de usuários
9. **Copiar logs do console**

**Logs esperados**:
```
📥 [BUSCANDO USUÁRIOS]
🔍 [DEBUG] Usuário: Teste Arlindo 2
  Territorios (raw): {cidades: [], comunidades: ["Heliópolis", "Paraisópolis"]}
  cidades: []
  comunidades: ["Heliópolis", "Paraisópolis"]
📊 [RESUMO DOS TERRITÓRIOS]:
  Teste Arlindo 2: {cidades: [], comunidades: ["Heliópolis", "Paraisópolis"], temComunidades: true}
```

10. **Verificar na UI**:
    - Nome: "Teste Arlindo 2"
    - Perfil: Badge "Coordenador"
    - Território: Badges verdes "Heliópolis" e "Paraisópolis"

### Teste 2: Editar Territórios

1. **Executar** `fix-profiles-policies.sql` no Supabase
2. Na listagem de usuários, clicar no ícone de **lápis** em um coordenador
3. Adicionar novo território
4. Clicar em "Salvar"
5. Verificar que territórios foram atualizados

**Se der erro**:
- Copiar mensagem de erro
- Verificar policies no banco

---

## 🐛 Troubleshooting

### Territórios não aparecem na UI

**Verificar no console**:
```
🔍 [DEBUG] Usuário: Arlindo
  Territorios (raw): {cidades: [], comunidades: ["Cantinho Do Céu", "Capão Redondo"]}
  cidades: []
  comunidades: ["Cantinho Do Céu", "Capão Redondo"]
```

Se aparecer isso mas não renderizar na UI:
- Problema na renderização dos badges
- Verificar se `user.territorios?.comunidades` está definido

**Solução**: Adicionar fallback na renderização
```typescript
{(user.territorios?.comunidades || []).map((comunidade) => (
  <Badge key={comunidade}>{comunidade}</Badge>
))}
```

### Não consegue editar territórios

**Erro**: "new row violates row-level security policy"

**Solução**: Executar `fix-profiles-policies.sql`

### Usuário sem nome

**Causa**: Nome não foi salvo no profile

**Solução**: Já corrigida no código. Para usuários antigos:
```sql
-- Atualizar nome manualmente
UPDATE profiles 
SET nome = 'Nome Correto'
WHERE id = '[user_id]';
```

---

## 📊 Dados do Banco (Atual)

```
| nome              | territorios                                                      |
| ----------------- | ---------------------------------------------------------------- |
| Arlindo           | {"cidades":[],"comunidades":["Cantinho Do Céu","Capão Redondo"]} |
| Coordenador teste | {"cidades":[],"comunidades":["Brasilândia"]}                     |
| (sem nome)        | {"cidades":[],"comunidades":[]}                                  |
```

**Observações**:
- ✅ Territórios estão salvos como JSONB (correto)
- ✅ Formato está correto
- ❌ Um usuário sem nome (precisa corrigir)
- ❌ Territórios não aparecem na UI (investigar logs)

---

## 🎯 Próximos Passos

1. **Executar** `fix-profiles-policies.sql`
2. **Criar novo usuário** e copiar logs
3. **Recarregar página** de usuários e copiar logs
4. **Compartilhar logs** para análise
5. **Testar edição** de territórios

---

**Data**: 25 de fevereiro de 2026
**Versão**: 3.0 - Correções finais
