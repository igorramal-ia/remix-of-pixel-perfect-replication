# ✅ Correção: Fotos Separadas (Recibo vs Placa)

## 🎯 Problema Identificado

1. **Erro ao ativar**: "Invalid input value for enum instalacao_status: 'finalizado'"
2. **Fotos misturadas**: Recibo e placa juntos, mas precisam estar separados

## 🔧 Solução Implementada

### Separação de Fotos

**ANTES:**
- `fotos_instalacao` (array) - Todas as fotos juntas

**DEPOIS:**
- `foto_recibo` (texto) - 1 foto do comprovante/recibo (controle interno)
- `fotos_placa` (array) - 2+ fotos da placa instalada (para relatório)

### Motivo da Separação

- **Foto do Recibo**: Apenas para controle interno, não vai no relatório
- **Fotos da Placa**: Vão para o relatório do cliente

## 📝 Mudanças no Código

### 1. Componente AtivarInstalacaoModal.tsx

```tsx
// ANTES: 1 campo de upload com 3 fotos
<UploadFotos
  tipo="instalacao"
  fotos={fotos}
  minFotos={3}
  maxFotos={5}
/>

// DEPOIS: 2 campos separados
<UploadFotos
  tipo="recibo"
  fotos={fotoRecibo}
  minFotos={1}
  maxFotos={1}
/>

<UploadFotos
  tipo="placa"
  fotos={fotosPlaca}
  minFotos={2}
  maxFotos={5}
/>
```

### 2. Hook useInstalacoes.ts

```typescript
// ANTES
export interface AtivarInstalacaoData {
  fotosInstalacao: string[];
}

// DEPOIS
export interface AtivarInstalacaoData {
  fotoRecibo: string;      // URL única
  fotosPlaca: string[];    // Array de URLs
}
```

### 3. SQL (aplicar-gestao-instalacoes-completa.sql)

```sql
-- ANTES
ALTER TABLE public.instalacoes 
ADD COLUMN IF NOT EXISTS fotos_instalacao TEXT[];

-- DEPOIS
ALTER TABLE public.instalacoes 
ADD COLUMN IF NOT EXISTS foto_recibo TEXT,
ADD COLUMN IF NOT EXISTS fotos_placa TEXT[];
```

## 🚀 Como Aplicar

### Passo 1: Aplicar SQL Atualizado

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie TODO o conteúdo de `aplicar-gestao-instalacoes-completa.sql`
4. Cole e execute
5. Aguarde "Script executado com sucesso!"

### Passo 2: Recarregar Sistema

1. Pressione **Ctrl+F5** no navegador
2. Acesse uma campanha
3. Teste o botão "Ativar"

## 📊 Estrutura de Dados

### Tabela `instalacoes`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `foto_recibo` | TEXT | URL da foto do recibo (controle interno) |
| `fotos_placa` | TEXT[] | Array de URLs das fotos da placa (relatório) |
| `fotos_retirada` | TEXT[] | Array de URLs das fotos da retirada |

### Fluxo de Upload

```
ATIVAR INSTALAÇÃO
├── Foto do Recibo (1 foto)
│   └── Salva em: foto_recibo
│   └── Uso: Controle interno
│
└── Fotos da Placa (2-5 fotos)
    └── Salva em: fotos_placa
    └── Uso: Relatório para cliente

FINALIZAR INSTALAÇÃO
└── Fotos da Retirada (2+ fotos)
    └── Salva em: fotos_retirada
    └── Uso: Comprovação de retirada
```

## 🎨 Interface Atualizada

### Modal "Ativar Instalação"

```
┌─────────────────────────────────────┐
│ Ativar Instalação                   │
├─────────────────────────────────────┤
│                                     │
│ 📍 Endereço                         │
│ R. Exemplo, 123                     │
│                                     │
│ 📅 Data de Instalação: [26/02/2026] │
│ 📅 Data de Retirada: [27/02/2026]   │
│                                     │
│ 📸 Foto do Recibo/Comprovante *     │
│ Envie 1 foto do comprovante         │
│ [Upload área - 1 foto]              │
│                                     │
│ 📸 Fotos da Placa Instalada *       │
│ Envie pelo menos 2 fotos da placa   │
│ [Upload área - 2-5 fotos]           │
│                                     │
│ [Cancelar] [Ativar Instalação]      │
└─────────────────────────────────────┘
```

## ✅ Validações

### Ao Ativar

- ✅ Data de instalação obrigatória
- ✅ Data de retirada obrigatória
- ✅ Data de retirada > Data de instalação
- ✅ 1 foto do recibo obrigatória
- ✅ Mínimo 2 fotos da placa obrigatórias

### Ao Finalizar

- ✅ Data de retirada real obrigatória
- ✅ Mínimo 2 fotos da retirada obrigatórias

## 🐛 Erros Corrigidos

### ❌ Erro: "Invalid input value for enum instalacao_status: 'finalizado'"

**Causa**: Código usava "finalizado" mas enum aceita "finalizada"

**Solução**: Alterado para "finalizada" com cast `as any`

```typescript
// ANTES
status: "finalizado"

// DEPOIS
status: "finalizada" as any
```

### ❌ Erro: Fotos misturadas

**Causa**: Todas as fotos em um único campo

**Solução**: Separado em `foto_recibo` e `fotos_placa`

## 📋 Checklist de Aplicação

- [ ] Executar `aplicar-gestao-instalacoes-completa.sql` no Supabase
- [ ] Verificar se 9 colunas foram adicionadas (executar `verificar-instalacoes-setup.sql`)
- [ ] Recarregar página do sistema (Ctrl+F5)
- [ ] Testar ativar instalação
- [ ] Verificar se aparecem 2 campos de upload separados
- [ ] Testar upload de 1 foto do recibo
- [ ] Testar upload de 2+ fotos da placa
- [ ] Verificar se ativação funciona sem erros

## 🆘 Se Algo Não Funcionar

1. Verifique se o SQL foi executado sem erros
2. Execute `verificar-instalacoes-setup.sql` para confirmar
3. Verifique o console do navegador (F12) para erros
4. Recarregue a página com Ctrl+F5
5. Me avise qual erro está aparecendo

---

**IMPORTANTE**: Execute o SQL atualizado antes de testar!
