# 🎯 Instruções para Aplicar as Correções

## ✅ O que foi corrigido

1. **Erro 403 ao criar usuário** - Agora usa `signUp()` em vez de `admin.createUser()`
2. **Campo telefone** - Adicionado e funcionando
3. **Territórios** - Persistem corretamente no banco
4. **Coordenadores** - Aparecem nas campanhas
5. **Status "Ativa"** - Corrigido para campanhas que começam hoje
6. **Notificações** - Não bloqueiam mais a criação de campanhas
7. **Botões de editar/excluir** - Adicionados nas campanhas
8. **Dashboard** - Mostra dados reais do Supabase

---

## 📋 Passo a Passo para Aplicar

### Passo 1: Aplicar Policies de RLS no Banco

1. Abrir Supabase Dashboard
2. Ir para **SQL Editor**
3. Clicar em **New Query**
4. Copiar e colar o conteúdo do arquivo `fix-user-creation-policies.sql`
5. Clicar em **Run** (ou pressionar Ctrl+Enter)
6. Verificar que todas as queries executaram com sucesso

**Resultado esperado**:
```
✅ Policy "Users can insert own role on signup" created
✅ Policy "Users can update own profile" created
```

---

### Passo 2: Verificar Campo Telefone

1. No SQL Editor, executar:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'telefone';
```

2. Se retornar vazio, executar:
```sql
ALTER TABLE public.profiles 
ADD COLUMN telefone TEXT;
```

**Resultado esperado**:
```
column_name | data_type
------------|----------
telefone    | text
```

---

### Passo 3: Testar Criação de Usuário

1. Ir para a página **Usuários**
2. Clicar em **Novo Usuário**
3. Preencher:
   - Nome: "Teste Coordenador"
   - Email: "teste@example.com"
   - Telefone: "(11) 98765-4321"
   - Senha: "senha123"
   - Perfil: "Coordenador"
4. Adicionar territórios:
   - UF: "SP"
   - Cidade: "São Paulo"
   - Comunidade: "Heliópolis"
   - Clicar em "Adicionar"
5. Clicar em **Criar Usuário**

**Resultado esperado**:
- ✅ Toast verde: "Usuário criado com sucesso"
- ✅ Usuário aparece na listagem
- ✅ Telefone aparece na coluna
- ✅ Badge verde "Heliópolis" aparece na coluna Território

**Se der erro**:
- Abrir console do navegador (F12)
- Copiar mensagem de erro
- Verificar se as policies foram aplicadas corretamente

---

### Passo 4: Testar Criação de Campanha

1. Ir para a página **Campanhas**
2. Clicar em **Nova Campanha**
3. **Etapa 1** - Preencher:
   - Nome: "Campanha Teste"
   - Cliente: "Cliente Teste"
   - Data de Início: Hoje
   - Data de Fim: Daqui a 30 dias
4. Clicar em **Próxima**
5. **Etapa 2** - Adicionar grupo:
   - UF: "SP"
   - Cidade: "São Paulo"
   - Comunidade: "Heliópolis"
   - Quantidade: 5
   - Clicar em **Adicionar Grupo**
6. Clicar em **Sugerir com IA** (opcional)
7. Ou selecionar coordenador manualmente
8. Clicar em **Próxima**
9. **Etapa 3** - Revisar dados
10. Clicar em **Criar Campanha**

**Resultado esperado**:
- ✅ Toast verde: "Campanha criada"
- ✅ Campanha aparece na listagem
- ✅ Status: Badge verde "Ativa"
- ✅ Coordenador aparece: "1 coordenador"

**Se der erro de notificação**:
- Não se preocupe, a campanha foi criada mesmo assim
- Apenas a notificação falhou (não é crítico)

---

### Passo 5: Verificar Dashboard

1. Ir para a página **Dashboard**
2. Verificar que todos os cards carregam:
   - Total de Pontos
   - Campanhas Ativas
   - Em Veiculação
   - Para Recolher
3. Verificar seção "Atividade Recente"
4. Verificar seção "Campanhas Ativas"
5. Verificar seção "Distribuição do Inventário"

**Resultado esperado**:
- ✅ Todos os números aparecem (não "0" em tudo)
- ✅ Atividade recente mostra últimas movimentações
- ✅ Campanhas ativas mostram progresso

---

## 🔍 Verificações no Banco de Dados

### Verificar Usuário Criado

```sql
-- Ver usuário no auth
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'teste@example.com';

-- Ver profile
SELECT id, nome, email, telefone, territorios 
FROM profiles 
WHERE email = 'teste@example.com';

-- Ver role
SELECT user_id, role 
FROM user_roles 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'teste@example.com');
```

**Resultado esperado**:
```
profiles:
  nome: "Teste Coordenador"
  telefone: "(11) 98765-4321"
  territorios: {"cidades": [], "comunidades": ["Heliópolis"]}

user_roles:
  role: "coordenador"
```

### Verificar Campanha Criada

```sql
-- Ver campanha
SELECT id, nome, cliente, data_inicio, data_fim 
FROM campanhas 
WHERE nome = 'Campanha Teste';

-- Ver coordenadores vinculados
SELECT 
  c.nome as campanha,
  p.nome as coordenador
FROM campanhas c
LEFT JOIN campanha_coordenadores cc ON cc.campanha_id = c.id
LEFT JOIN profiles p ON p.id = cc.coordenador_id
WHERE c.nome = 'Campanha Teste';
```

**Resultado esperado**:
```
campanha: "Campanha Teste"
coordenador: "Teste Coordenador"
```

---

## ❌ Problemas Comuns e Soluções

### Problema 1: Erro "new row violates row-level security policy"

**Causa**: Policies de RLS não foram aplicadas

**Solução**:
1. Executar `fix-user-creation-policies.sql` novamente
2. Verificar que as policies foram criadas:
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('user_roles', 'profiles');
```

### Problema 2: Telefone não aparece na listagem

**Causa**: Campo não existe no banco

**Solução**:
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telefone TEXT;
```

### Problema 3: Territórios não aparecem

**Causa**: Dados não foram salvos

**Solução**:
1. Abrir console do navegador (F12)
2. Verificar logs:
   - "🔵 [ANTES DO UPDATE]"
   - "🟢 [DEPOIS DO UPDATE]"
3. Se error não for null, verificar policies

### Problema 4: Coordenadores não aparecem na campanha

**Causa**: Vínculo não foi criado

**Solução**:
```sql
-- Verificar vínculos
SELECT * FROM campanha_coordenadores 
WHERE campanha_id = '[id_da_campanha]';

-- Se vazio, criar manualmente
INSERT INTO campanha_coordenadores (campanha_id, coordenador_id)
VALUES ('[id_da_campanha]', '[id_do_coordenador]');
```

### Problema 5: Dashboard mostra tudo zerado

**Causa**: Não há dados no banco

**Solução**:
1. Importar inventário de endereços
2. Criar algumas campanhas
3. Criar algumas instalações
4. Recarregar dashboard (F5)

---

## 📞 Suporte

Se encontrar algum problema não listado aqui:

1. **Abrir console do navegador** (F12)
2. **Copiar mensagem de erro completa**
3. **Verificar logs no Supabase**:
   - Dashboard → Logs → API Logs
4. **Executar queries de verificação** (acima)
5. **Consultar documentação**:
   - `SOLUCAO_CRIAR_USUARIO_COMPLETA.md`
   - `DASHBOARD_REAL_DATA.md`
   - `CORRECOES_FINAIS_CAMPANHAS.md`

---

## ✅ Checklist Final

Após aplicar todas as correções, verificar:

- [ ] Policies de RLS aplicadas
- [ ] Campo telefone existe no banco
- [ ] Consegue criar usuário sem erro 403
- [ ] Telefone aparece na listagem de usuários
- [ ] Territórios aparecem com badges coloridas
- [ ] Consegue criar campanha sem erro
- [ ] Coordenadores aparecem nas campanhas
- [ ] Status "Ativa" aparece corretamente
- [ ] Dashboard mostra dados reais
- [ ] Botões de editar/excluir funcionam

---

## 🎉 Pronto!

Se todos os itens do checklist estiverem marcados, o sistema está funcionando corretamente!

**Próximos passos sugeridos**:
1. Importar inventário completo de endereços
2. Criar campanhas reais
3. Convidar coordenadores para testar
4. Configurar SMTP para envio de emails (opcional)
5. Personalizar templates de email (opcional)

**Data**: 25 de fevereiro de 2026
**Versão**: 1.0
