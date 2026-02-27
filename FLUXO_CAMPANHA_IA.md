# Fluxo Completo de Criação de Campanha com IA

## Visão Geral

Sistema completo de criação de campanhas com wizard de 3 etapas, integração com Google Gemini AI para sugestões inteligentes e sistema de notificações em tempo real.

## Arquitetura

### 1. Banco de Dados

#### Tabela `campanha_coordenadores`
- Coluna `endereco_ids` (UUID[]): Array de IDs de endereços vinculados especificamente a cada coordenador
- Permite vincular endereços específicos a coordenadores dentro de uma campanha

#### Tabela `notificacoes`
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- titulo: TEXT
- mensagem: TEXT
- lida: BOOLEAN (default: false)
- criado_em: TIMESTAMPTZ
```

#### Funções do Banco
- `marcar_notificacao_lida(notificacao_id)`: Marca uma notificação como lida
- `marcar_todas_notificacoes_lidas()`: Marca todas as notificações do usuário como lidas
- `contar_notificacoes_nao_lidas()`: Retorna o número de notificações não lidas

### 2. Hooks React Query

#### `useNotificacoes.ts`
- `useNotificacoes()`: Lista notificações do usuário (últimas 20)
- `useNotificacoesNaoLidas()`: Conta notificações não lidas (atualiza a cada 30s)
- `useMarcarNotificacaoLida()`: Marca notificação como lida
- `useMarcarTodasLidas()`: Marca todas como lidas
- `useCriarNotificacao()`: Cria nova notificação

### 3. Componentes

#### `NotificationBell.tsx`
- Sino de notificações no header
- Badge com contagem de não lidas
- Dropdown com lista de notificações
- Formatação de tempo relativo (ex: "há 5 minutos")
- Indicador visual para notificações não lidas
- Botão "Marcar todas como lidas"

#### `NovaCampanhaModalV2.tsx`
Modal com wizard de 3 etapas:

**Etapa 1 - Dados Básicos:**
- Nome da campanha
- Cliente
- Data de início
- Data de fim

**Etapa 2 - Grupos de Instalação:**
- Adicionar múltiplos grupos
- Cada grupo tem:
  - Região (cidade/comunidade)
  - Quantidade de pontos
  - Coordenador responsável
  - Endereços vinculados

**Funcionalidade "Sugerir com IA":**
1. Busca endereços disponíveis na região (status = "disponivel")
2. Busca coordenadores com seus territórios
3. Monta prompt estruturado para o Gemini
4. IA retorna sugestão em JSON:
   ```json
   {
     "coordenador_id": "uuid",
     "coordenador_nome": "Nome",
     "endereco_ids": ["uuid1", "uuid2"],
     "justificativa": "Explicação da escolha"
   }
   ```
5. Usuário pode aceitar, rejeitar ou ajustar manualmente

**Etapa 3 - Revisão:**
- Resumo de todos os dados
- Confirmação antes de salvar

### 4. Fluxo de Salvamento

Ao clicar em "Criar Campanha":

1. **Criar campanha** na tabela `campanhas`
2. **Para cada grupo:**
   - Criar instalações na tabela `instalacoes` (status: "pendente")
   - Vincular coordenador em `campanha_coordenadores` com `endereco_ids`
   - Criar notificação para o coordenador:
     ```
     Título: "Nova campanha atribuída"
     Mensagem: "Você foi vinculado à campanha [Nome] do cliente [Cliente]. 
                Período: [Data Início] a [Data Fim]."
     ```
3. **Invalidar queries** do React Query para atualizar UI
4. **Fechar modal** e resetar formulário

### 5. Integração com Gemini AI

#### Serviço `gemini.ts`
- `askGemini(prompt)`: Função base para consultas
- `testGeminiConnection()`: Testa conexão com API
- `gerarEstrategiaCampanha(dados)`: Gera estratégias OOH
- `analisarCampanha(dados)`: Analisa performance

#### Prompt para Sugestões
O prompt enviado ao Gemini inclui:
- Região alvo e quantidade de pontos
- Lista de endereços disponíveis com localização
- Lista de coordenadores com seus territórios (cidades e comunidades)
- Instruções para escolher o melhor coordenador e endereços
- Formato JSON esperado na resposta

### 6. Sistema de Notificações

#### Header com Sino
- Integrado no `AppLayout.tsx`
- Badge vermelho com contagem
- Atualização automática a cada 30 segundos
- Dropdown com scroll para muitas notificações

#### Comportamento
- Notificações não lidas aparecem com fundo destacado
- Ponto azul indica não lida
- Clicar marca como lida automaticamente
- Tempo relativo em português (ex: "há 2 horas")

## Variáveis de Ambiente

```env
VITE_GEMINI_KEY=AIzaSyCOAE9gGvQVHccj96py3OY_2MI8B2xaPXU
VITE_GOOGLE_MAPS_KEY=AIzaSyCOAE9gGvQVHccj96py3OY_2MI8B2xaPXU
```

## Próximos Passos (Não Implementados)

### Edge Function para E-mail
Criar função Supabase Edge para enviar e-mails aos coordenadores:
```typescript
// supabase/functions/enviar-email-campanha/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { coordenador_email, campanha_nome, cliente, data_inicio, data_fim } = await req.json()
  
  // Integrar com serviço de e-mail (SendGrid, Resend, etc)
  // Enviar e-mail formatado
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

### Melhorias Futuras
1. Permitir editar grupos após criação
2. Visualizar endereços sugeridos no mapa antes de aceitar
3. Histórico de sugestões da IA
4. Feedback sobre qualidade das sugestões
5. Notificações push no navegador
6. Filtros avançados de notificações

## Arquivos Criados/Modificados

### Criados
- `src/hooks/useNotificacoes.ts`
- `src/components/NotificationBell.tsx`
- `src/components/NovaCampanhaModalV2.tsx`
- `supabase/migrations/20260225170000_add_grupos_and_notificacoes.sql`
- `FLUXO_CAMPANHA_IA.md`

### Modificados
- `src/components/AppLayout.tsx` - Adicionado header com sino
- `src/pages/Campaigns.tsx` - Substituído modal antigo pelo novo
- `src/integrations/supabase/types.ts` - Adicionadas tabelas e funções

## Como Usar

1. **Criar Nova Campanha:**
   - Clicar em "Nova Campanha" na página /campanhas
   - Preencher dados básicos (Etapa 1)
   - Adicionar grupos de instalação (Etapa 2)
   - Para cada grupo, clicar em "Sugerir com IA" ou selecionar manualmente
   - Revisar e confirmar (Etapa 3)

2. **Receber Notificações:**
   - Coordenadores veem badge no sino quando atribuídos
   - Clicar no sino para ver detalhes
   - Clicar na notificação marca como lida

3. **Gerenciar Notificações:**
   - "Marcar todas como lidas" no dropdown
   - Notificações antigas são mantidas no histórico
   - Limite de 20 notificações mais recentes no dropdown

## Tecnologias Utilizadas

- React + TypeScript
- React Query (TanStack Query)
- Supabase (PostgreSQL + RLS)
- Google Gemini AI (gemini-1.5-flash)
- shadcn/ui (componentes)
- date-fns (formatação de datas)
- Tailwind CSS (estilização)
