# Diagnóstico de Problema com Supabase

## Passos para Verificar

### 1. Verificar Status do Supabase
- Acesse: https://status.supabase.com/
- Verifique se há algum incidente reportado

### 2. Verificar Dashboard do Supabase
- Acesse: https://supabase.com/dashboard
- Faça login
- Verifique se seu projeto está online (deve ter um indicador verde)
- Vá em "Project Settings" > "Database" e veja se está "Healthy"

### 3. Verificar Conexão Local
- Abra o console do navegador (F12)
- Vá na aba "Network"
- Recarregue a página
- Procure por requisições para `supabase.co` que estejam falhando
- Anote os códigos de erro (401, 403, 500, etc)

### 4. Verificar Variáveis de Ambiente
Execute no terminal:
```bash
cat .env
```

Verifique se as variáveis estão corretas:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

### 5. Possíveis Causas Comuns

#### A) Projeto Pausado (Plano Free)
- Projetos free do Supabase pausam após 7 dias de inatividade
- Solução: Ir no dashboard e clicar em "Resume Project"

#### B) Limite de Conexões
- Muitas queries simultâneas podem esgotar o pool de conexões
- Solução: Aguardar alguns minutos

#### C) Problema de Autenticação
- Token expirado ou inválido
- Solução: Fazer logout e login novamente

#### D) Problema de Rede
- Firewall ou proxy bloqueando
- Solução: Verificar configurações de rede

#### E) Migrations com Erro
- Alguma migration pode ter falhado
- Solução: Verificar logs no dashboard do Supabase

### 6. Ações Imediatas

1. **Recarregar a página** (Ctrl + Shift + R para hard refresh)
2. **Limpar cache do navegador**
3. **Fazer logout e login novamente**
4. **Verificar o dashboard do Supabase**

### 7. Se Nada Funcionar

**NÃO ENTRE EM PÂNICO!** Seus dados estão seguros no Supabase.

Opções:
1. Aguardar alguns minutos (pode ser instabilidade temporária)
2. Verificar se há backup recente no Supabase
3. Entrar em contato com suporte do Supabase se for crítico

## O Que NÃO Fazer

❌ Não execute migrations ou scripts SQL sem saber o que está acontecendo
❌ Não delete ou recrie o projeto
❌ Não altere as RLS policies sem backup
❌ Não force restart do banco sem necessidade

## Informações para Debug

Quando conseguir acessar, me envie:
1. Mensagem de erro exata que aparece
2. Status do projeto no dashboard
3. Últimas ações que você fez antes do problema
4. Logs do console do navegador (F12)
