# Implementação Completa: Gestão de Instalações

## ✅ O Que Foi Implementado

### 1. Migrations do Banco de Dados

**Arquivo**: `supabase/migrations/20260226020000_add_gestao_instalacoes.sql`
- Novas colunas em `instalacoes`:
  - `data_retirada_prevista` - Data prevista para retirada
  - `data_retirada_real` - Data real da retirada
  - `fotos_instalacao` - Array de URLs das fotos
  - `fotos_retirada` - Array de URLs das fotos
  - `observacoes_retirada` - Observações sobre a retirada
  - `motivo_substituicao` - Motivo da substituição
  - `substituido_por` - ID da instalação substituta
  - `atualizado_por` - Quem fez a última atualização
  - `atualizado_em` - Quando foi atualizado

- Tabela `historico_instalacoes`:
  - Registra todas as mudanças de status
  - Trigger automático ao atualizar instalação
  - Guarda dados da alteração em JSONB

- Funções RPC:
  - `buscar_instalacoes_aviso_retirada()` - Busca instalações próximas da retirada
  - `buscar_instalacoes_atrasadas()` - Busca instalações atrasadas

- View `view_instalacoes_completa`:
  - Todos os dados em uma query
  - Calcula dias restantes automaticamente
  - Flags de aviso e atrasado

**Arquivo**: `supabase/migrations/20260226020001_setup_storage_instalacoes.sql`
- Bucket `instalacoes-fotos` configurado
- RLS policies para upload/download
- Limite de 5MB por foto
- Formatos: JPG, PNG, HEIC, WEBP

### 2. Hooks React

**Arquivo**: `src/hooks/useInstalacoes.ts`

Hooks criados:
- `useAtivarInstalacao()` - Ativa instalação com fotos e datas
- `useFinalizarInstalacao()` - Finaliza e libera endereço
- `useSubstituirEndereco()` - Troca endereço e cria novo
- `useInstalacoesAviso()` - Busca avisos de retirada
- `useInstalacoesAtrasadas()` - Busca atrasados
- `useHistoricoInstalacao()` - Histórico completo
- `useUploadFotoInstalacao()` - Upload com validação
- `useDeletarFotoInstalacao()` - Remove foto do storage

### 3. Componentes UI

**Arquivo**: `src/components/UploadFotos.tsx`
- Drag & drop de fotos
- Preview em grid
- Validação de tamanho (5MB) e tipo
- Remover fotos individualmente
- Loading states
- Contador de fotos

**Arquivo**: `src/components/AtivarInstalacaoModal.tsx`
- Formulário para ativar instalação
- 2 campos de data (instalação e retirada)
- Upload de 3 fotos mínimo
- Validações completas

**Arquivo**: `src/components/FinalizarInstalacaoModal.tsx`
- Formulário para finalizar
- Data de retirada real
- Upload de 2 fotos mínimo
- Campo de observações opcional

**Arquivo**: `src/components/SubstituirEnderecoModal.tsx`
- Motivo da substituição
- Seleção de novo endereço do inventário
- Filtro por região (mesma UF)
- Placeholder para cadastro de novo endereço

### 4. Página Atualizada

**Arquivo**: `src/pages/CampaignDetail.tsx`

Mudanças:
- Importação dos 3 novos modais
- Estados para controlar modais
- Funções para abrir cada modal
- Função `calcularDiasRestantes()`
- Coluna "Ações" na tabela
- Badges de aviso (7 dias) e atrasado
- Botões contextuais por status:
  - **Pendente**: "Ativar" + "Substituir"
  - **Ativa**: "Finalizar"
  - **Finalizado/Substituído**: "-"

## 🎨 Fluxo Visual

### Status: Pendente
```
┌─────────────────────────────────────────┐
│ 📍 Rua Exemplo, 123                     │
│ Status: [🟡 Pendente]                   │
│ Instalação: -                           │
│ [Ativar] [Substituir]                   │
└─────────────────────────────────────────┘
```

### Status: Ativa (Normal)
```
┌─────────────────────────────────────────┐
│ 📍 Rua Exemplo, 123                     │
│ Status: [🟢 Ativa]                      │
│ Instalação: 15/02/2026                  │
│ Retirada: 15/03/2026                    │
│ [Finalizar]                             │
└─────────────────────────────────────────┘
```

### Status: Ativa (Aviso - 7 dias)
```
┌─────────────────────────────────────────┐
│ 📍 Rua Exemplo, 123                     │
│ Status: [🟢 Ativa]                      │
│         [🟠 Retirar em 5d]              │
│ Instalação: 15/02/2026                  │
│ Retirada: 15/03/2026                    │
│ [Finalizar]                             │
└─────────────────────────────────────────┘
```

### Status: Ativa (Atrasado)
```
┌─────────────────────────────────────────┐
│ 📍 Rua Exemplo, 123                     │
│ Status: [🟢 Ativa]                      │
│         [🔴 Atrasado 3d]                │
│ Instalação: 15/02/2026                  │
│ Retirada: 15/03/2026                    │
│ [Finalizar]                             │
└─────────────────────────────────────────┘
```

### Status: Finalizado
```
┌─────────────────────────────────────────┐
│ 📍 Rua Exemplo, 123                     │
│ Status: [⚫ Finalizado]                 │
│ Instalação: 15/02/2026                  │
│ Retirada: 15/03/2026                    │
│ -                                       │
└─────────────────────────────────────────┘
```

## 📋 Checklist de Aplicação

### Passo 1: Aplicar Migrations
```bash
cd supabase
supabase db push
```

Ou via SQL Editor:
1. Copiar conteúdo de `20260226020000_add_gestao_instalacoes.sql`
2. Executar no SQL Editor
3. Copiar conteúdo de `20260226020001_setup_storage_instalacoes.sql`
4. Executar no SQL Editor

### Passo 2: Verificar Storage
1. Ir em Storage no Supabase Dashboard
2. Verificar se bucket `instalacoes-fotos` foi criado
3. Verificar policies (devem aparecer 4)

### Passo 3: Testar no Frontend
1. Abrir uma campanha
2. Verificar se botões aparecem
3. Testar ativar instalação
4. Testar upload de fotos
5. Testar finalizar
6. Testar substituir

## 🔍 Queries Úteis para Testes

### Ver instalações com aviso
```sql
SELECT * FROM buscar_instalacoes_aviso_retirada(7);
```

### Ver instalações atrasadas
```sql
SELECT * FROM buscar_instalacoes_atrasadas();
```

### Ver histórico de uma instalação
```sql
SELECT * FROM historico_instalacoes 
WHERE instalacao_id = 'UUID_AQUI'
ORDER BY alterado_em DESC;
```

### Ver view completa
```sql
SELECT * FROM view_instalacoes_completa
WHERE campanha_id = 'UUID_CAMPANHA'
ORDER BY 
  CASE status
    WHEN 'pendente' THEN 1
    WHEN 'ativa' THEN 2
    WHEN 'finalizado' THEN 3
    ELSE 4
  END;
```

### Simular dados para teste
```sql
-- Criar instalação ativa com aviso (5 dias para retirada)
UPDATE instalacoes 
SET 
  status = 'ativa',
  data_instalacao = CURRENT_DATE - 25,
  data_retirada_prevista = CURRENT_DATE + 5,
  fotos_instalacao = ARRAY['url1', 'url2', 'url3']
WHERE id = 'UUID_INSTALACAO';

-- Criar instalação atrasada
UPDATE instalacoes 
SET 
  status = 'ativa',
  data_instalacao = CURRENT_DATE - 35,
  data_retirada_prevista = CURRENT_DATE - 3,
  fotos_instalacao = ARRAY['url1', 'url2', 'url3']
WHERE id = 'UUID_INSTALACAO';
```

## 🎯 Funcionalidades Implementadas

✅ Ativar instalação com fotos e datas
✅ Finalizar instalação com fotos
✅ Substituir endereço
✅ Upload de fotos com drag & drop
✅ Validação de fotos (tamanho, tipo, quantidade)
✅ Badges de status visual
✅ Avisos automáticos (7 dias antes)
✅ Indicador de atraso
✅ Histórico automático de mudanças
✅ Liberação automática de endereço
✅ Filtro de endereços por região

## 🚀 Próximas Funcionalidades (Futuro)

⏳ Notificações automáticas por email
⏳ Cadastro de novo endereço no modal de substituir
⏳ Galeria de fotos (visualização ampliada)
⏳ Exportar relatório com fotos
⏳ Dashboard com métricas de instalações
⏳ App mobile para coordenador

## 📝 Notas Importantes

1. **Fotos são obrigatórias** - Sistema não permite ativar/finalizar sem fotos
2. **Datas são validadas** - Retirada deve ser posterior à instalação
3. **Histórico automático** - Toda mudança é registrada
4. **Endereço liberado** - Ao finalizar, endereço volta para "disponível"
5. **Storage seguro** - RLS habilitado, apenas admin/operações fazem upload

## 🐛 Troubleshooting

### Erro ao fazer upload
- Verificar se bucket existe
- Verificar policies do storage
- Verificar tamanho do arquivo (máx 5MB)

### Botões não aparecem
- Verificar se migration foi aplicada
- Verificar se colunas existem na tabela
- Verificar console do navegador

### Fotos não carregam
- Verificar URL no banco
- Verificar policies de SELECT no storage
- Verificar se arquivo existe no bucket

## ✅ Resumo

Sistema completo de gestão de instalações implementado com:
- 2 migrations
- 8 hooks
- 4 componentes novos
- 1 página atualizada
- Histórico automático
- Upload de fotos
- Validações completas
- UX intuitiva

Pronto para uso em produção após aplicar as migrations!
