# Especificação: Gestão de Instalações para Operações

## 🎯 Objetivo
Permitir que operações gerencie o ciclo completo de instalação de placas, desde a adição do endereço até a retirada, com registro fotográfico completo.

## 📊 Fluxo Completo do Ciclo de Vida

### Status Possíveis:
1. **Pendente** - Endereço adicionado, aguardando instalação
2. **Ativo** - Placa instalada e em veiculação
3. **Aviso de Retirada** - Próximo da data de retirada (7 dias antes)
4. **Finalizado** - Placa retirada, campanha encerrada neste endereço
5. **Substituído** - Endereço foi trocado por outro

## 🔄 Ciclo de Vida Detalhado

### 1. PENDENTE → ATIVO

**Quando**: Operador recebe confirmação do coordenador que instalou

**Dados Necessários**:
- ✅ Data de instalação (obrigatório)
- ✅ Data prevista de retirada (obrigatório)
- ✅ Foto do comprovante de instalação (1 foto, obrigatório)
- ✅ Fotos da placa instalada (2 fotos, obrigatório)

**Validações**:
- Data de instalação não pode ser futura
- Data de retirada deve ser posterior à data de instalação
- Mínimo 3 fotos (1 comprovante + 2 placa)

**Ação no Sistema**:
```sql
UPDATE instalacoes SET
  status = 'ativo',
  data_instalacao = '2026-02-15',
  data_retirada_prevista = '2026-03-15',
  fotos_instalacao = ['url1', 'url2', 'url3'],
  atualizado_em = NOW(),
  atualizado_por = user_id
WHERE id = instalacao_id;
```

### 2. ATIVO → AVISO DE RETIRADA

**Quando**: Sistema detecta automaticamente (7 dias antes da data de retirada)

**Ação no Sistema**:
- Notificação automática para operações
- Badge visual "⚠️ Retirar em X dias"
- Email/notificação para coordenador (futuro)

### 3. AVISO DE RETIRADA → FINALIZADO

**Quando**: Operador recebe confirmação que placa foi retirada

**Dados Necessários**:
- ✅ Data real de retirada (obrigatório)
- ✅ Fotos da retirada (mínimo 2 fotos, obrigatório)
- 📝 Observações (opcional)

**Ação no Sistema**:
```sql
UPDATE instalacoes SET
  status = 'finalizado',
  data_retirada_real = '2026-03-15',
  fotos_retirada = ['url1', 'url2'],
  observacoes_retirada = 'Retirada sem problemas',
  atualizado_em = NOW(),
  atualizado_por = user_id
WHERE id = instalacao_id;

-- Liberar endereço no inventário
UPDATE enderecos SET
  status = 'disponivel'
WHERE id = endereco_id;
```

### 4. SUBSTITUIR ENDEREÇO

**Quando**: Endereço não pode ser usado (proprietário recusou, local inadequado, etc.)

**Fluxo**:
1. Marcar endereço atual como "Substituído"
2. Adicionar novo endereço na campanha
3. Novo endereço entra como "Pendente"
4. Endereço antigo volta para inventário como "disponível"

**Dados Necessários**:
- 📝 Motivo da substituição (obrigatório)
- 🆕 Novo endereço (selecionar do inventário ou cadastrar novo)

## 🗄️ Estrutura de Dados

### Tabela: instalacoes (atualizar)

```sql
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS data_retirada_prevista DATE;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS data_retirada_real DATE;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS fotos_instalacao TEXT[];
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS fotos_retirada TEXT[];
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS observacoes_retirada TEXT;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS motivo_substituicao TEXT;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS substituido_por UUID REFERENCES instalacoes(id);
```

### Tabela: historico_instalacoes (nova)

```sql
CREATE TABLE historico_instalacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instalacao_id UUID REFERENCES instalacoes(id) ON DELETE CASCADE,
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50),
  alterado_por UUID REFERENCES profiles(id),
  alterado_em TIMESTAMP DEFAULT NOW(),
  observacoes TEXT
);
```

## 🎨 Interface - Página de Campanha

### Card de Endereço (Expandido)

```
┌─────────────────────────────────────────────────────┐
│ 📍 Rua Exemplo, 123 - Comunidade X                  │
│ Status: [Badge Pendente/Ativo/Aviso/Finalizado]     │
│                                                      │
│ Coordenador: João Silva                             │
│ Data Instalação: 15/02/2026                         │
│ Data Retirada: 15/03/2026 (em 7 dias) ⚠️           │
│                                                      │
│ [Ver Fotos] [Atualizar Status] [Substituir]        │
└─────────────────────────────────────────────────────┘
```

### Modal: Ativar Instalação

```
┌─────────────────────────────────────────────────────┐
│ Ativar Instalação                              [X]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📍 Rua Exemplo, 123 - Comunidade X                  │
│                                                      │
│ Data de Instalação: [__/__/____] 📅                │
│ Data de Retirada:   [__/__/____] 📅                │
│                                                      │
│ Foto do Comprovante (1 foto):                       │
│ [📷 Upload] ou [Arrastar arquivo]                   │
│ ┌─────────┐                                         │
│ │ Preview │                                         │
│ └─────────┘                                         │
│                                                      │
│ Fotos da Placa Instalada (2 fotos):                 │
│ [📷 Upload] ou [Arrastar arquivo]                   │
│ ┌─────────┐ ┌─────────┐                            │
│ │ Preview │ │ Preview │                            │
│ └─────────┘ └─────────┘                            │
│                                                      │
│ [Cancelar]              [Ativar Instalação] ✓      │
└─────────────────────────────────────────────────────┘
```

### Modal: Finalizar Instalação

```
┌─────────────────────────────────────────────────────┐
│ Finalizar Instalação                           [X]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📍 Rua Exemplo, 123 - Comunidade X                  │
│                                                      │
│ Data Real de Retirada: [__/__/____] 📅             │
│                                                      │
│ Fotos da Retirada (mínimo 2):                       │
│ [📷 Upload] ou [Arrastar arquivo]                   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│ │ Preview │ │ Preview │ │ Preview │               │
│ └─────────┘ └─────────┘ └─────────┘               │
│                                                      │
│ Observações (opcional):                             │
│ ┌─────────────────────────────────────────────┐    │
│ │                                             │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ [Cancelar]              [Finalizar] ✓              │
└─────────────────────────────────────────────────────┘
```

### Modal: Substituir Endereço

```
┌─────────────────────────────────────────────────────┐
│ Substituir Endereço                            [X]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Endereço Atual:                                     │
│ 📍 Rua Exemplo, 123 - Comunidade X                  │
│                                                      │
│ Motivo da Substituição:                             │
│ ┌─────────────────────────────────────────────┐    │
│ │ Ex: Proprietário recusou                    │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ Novo Endereço:                                      │
│ ○ Selecionar do inventário                          │
│   [Dropdown com endereços disponíveis]              │
│                                                      │
│ ○ Cadastrar novo endereço                           │
│   [Abrir formulário de cadastro]                    │
│                                                      │
│ [Cancelar]              [Substituir] ✓             │
└─────────────────────────────────────────────────────┘
```

## 🔔 Sistema de Notificações

### Notificações Automáticas:

1. **7 dias antes da retirada**
   - Para: Operações
   - Mensagem: "⚠️ Retirada próxima: Rua X em 7 dias"

2. **No dia da retirada**
   - Para: Operações
   - Mensagem: "🔴 Retirada hoje: Rua X"

3. **3 dias após data de retirada (atrasado)**
   - Para: Operações + Admin
   - Mensagem: "⚠️ ATRASADO: Retirada de Rua X estava prevista para DD/MM"

## 📸 Upload de Fotos

### Requisitos Técnicos:

**Storage**: Supabase Storage
**Bucket**: `instalacoes-fotos`
**Estrutura de pastas**:
```
instalacoes-fotos/
├── {campanha_id}/
│   ├── {instalacao_id}/
│   │   ├── instalacao/
│   │   │   ├── comprovante.jpg
│   │   │   ├── placa_1.jpg
│   │   │   └── placa_2.jpg
│   │   └── retirada/
│   │       ├── retirada_1.jpg
│   │       └── retirada_2.jpg
```

**Validações**:
- Formato: JPG, PNG, HEIC
- Tamanho máximo: 5MB por foto
- Compressão automática para otimizar storage

**Segurança**:
- RLS habilitado
- Apenas admin e operações podem fazer upload
- URLs assinadas com expiração de 1 hora para visualização

## 🔍 Relatórios e Métricas

### Dashboard da Campanha:

```
┌─────────────────────────────────────────────────────┐
│ Campanha: Cliente X - Fev/2026                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│ │ Total    │ │ Pendente │ │ Ativo    │ │Finalizado││
│ │   50     │ │    15    │ │    30    │ │    5     ││
│ └──────────┘ └──────────┘ └──────────┘ └─────────┘│
│                                                      │
│ ⚠️ Avisos de Retirada: 8 endereços                  │
│ 🔴 Atrasados: 2 endereços                           │
│                                                      │
│ [Ver Mapa] [Exportar Relatório] [Filtros]          │
└─────────────────────────────────────────────────────┘
```

## 🗺️ Integração com Inventário

### Ao Adicionar Endereço na Campanha:

```sql
-- 1. Criar instalação
INSERT INTO instalacoes (campanha_id, endereco_id, status)
VALUES (campanha_id, endereco_id, 'pendente');

-- 2. Atualizar status do endereço no inventário
UPDATE enderecos SET status = 'ocupado' WHERE id = endereco_id;

-- 3. Se endereço não existia, criar no inventário
INSERT INTO enderecos (endereco, cidade, uf, comunidade, lat, long)
VALUES (...) RETURNING id;
```

### Ao Finalizar/Substituir:

```sql
-- Liberar endereço no inventário
UPDATE enderecos SET status = 'disponivel' WHERE id = endereco_id;
```

## 📋 Checklist de Implementação

### Fase 1: Banco de Dados (1 dia)
- [ ] Migration para adicionar colunas em `instalacoes`
- [ ] Criar tabela `historico_instalacoes`
- [ ] Configurar Supabase Storage bucket
- [ ] Criar RLS policies para storage
- [ ] Criar função para calcular avisos de retirada

### Fase 2: Backend/Hooks (1 dia)
- [ ] Hook para atualizar status de instalação
- [ ] Hook para upload de fotos
- [ ] Hook para substituir endereço
- [ ] Hook para buscar instalações com aviso
- [ ] Hook para histórico de instalação

### Fase 3: Componentes UI (2 dias)
- [ ] Modal "Ativar Instalação"
- [ ] Modal "Finalizar Instalação"
- [ ] Modal "Substituir Endereço"
- [ ] Componente de upload de fotos
- [ ] Galeria de fotos (visualização)
- [ ] Cards de endereço com status visual

### Fase 4: Página de Campanha (1 dia)
- [ ] Atualizar CampaignDetail com novos cards
- [ ] Adicionar filtros por status
- [ ] Adicionar badges de aviso
- [ ] Integrar modais

### Fase 5: Notificações (1 dia)
- [ ] Sistema de notificações automáticas
- [ ] Cron job para verificar datas
- [ ] Emails de aviso (opcional)

### Fase 6: Testes (1 dia)
- [ ] Testar fluxo completo
- [ ] Testar upload de fotos
- [ ] Testar substituição
- [ ] Testar notificações

## 🎯 Prioridades

### MVP (Essencial):
1. ✅ Ativar instalação (com fotos e datas)
2. ✅ Finalizar instalação (com fotos)
3. ✅ Substituir endereço
4. ✅ Avisos visuais de retirada

### V2 (Importante):
5. Notificações automáticas
6. Histórico completo
7. Exportar relatórios

### V3 (Nice to have):
8. Emails automáticos
9. Integração com WhatsApp
10. App mobile para coordenador

## 📝 Notas Importantes

1. **Fotos são obrigatórias** - Sem fotos, não pode ativar/finalizar
2. **Datas são obrigatórias** - Sistema precisa saber quando retirar
3. **Histórico completo** - Tudo é registrado para auditoria
4. **Inventário sincronizado** - Status sempre atualizado
5. **Avisos automáticos** - Sistema avisa antes de atrasar

## 🚀 Próximo Passo

Começar pela Fase 1 (Banco de Dados) e criar a migration completa.

Quer que eu comece a implementar?
