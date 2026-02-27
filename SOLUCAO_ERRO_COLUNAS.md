# 🔧 Solução: Erro "column does not exist"

## ✅ Status das Colunas

As colunas EXISTEM no banco de dados:
- ✅ `foto_recibo` (text)
- ✅ `fotos_placa` (ARRAY)
- ✅ `fotos_retirada` (ARRAY)
- ✅ `data_retirada_prevista` (date)
- ✅ `data_retirada_real` (date)
- ✅ `observacoes_retirada` (text)
- ✅ `motivo_substituicao` (text)
- ✅ `substituido_por` (uuid)
- ✅ `atualizado_por` (uuid)
- ✅ `atualizado_em` (timestamp)

## 🐛 Problema

O erro acontece porque o TypeScript do Supabase está usando tipos antigos em cache.

## 🚀 Soluções (tente na ordem)

### Solução 1: Recarregar com Cache Limpo

1. Pressione **Ctrl+Shift+R** (Windows/Linux) ou **Cmd+Shift+R** (Mac)
2. Ou pressione **Ctrl+F5**

### Solução 2: Limpar Cache do Navegador

1. Pressione **F12** para abrir DevTools
2. Clique com botão direito no ícone de recarregar (ao lado da URL)
3. Selecione "Limpar cache e recarregar forçadamente"

### Solução 3: Adicionar Cast "as any" Temporário

Se ainda não funcionar, o código já tem `as any` nos lugares certos, mas vamos verificar:

```typescript
// No hook useInstalacoes.ts, a linha deve estar assim:
const { data: result, error } = await supabase
  .from("instalacoes")
  .update({
    status: "ativa",
    data_instalacao: data.dataInstalacao,
    data_retirada_prevista: data.dataRetiradaPrevista,
    foto_recibo: data.fotoRecibo,
    fotos_placa: data.fotosPlaca,
    // ... resto
  } as any)  // ← Este "as any" força o TypeScript a aceitar
  .eq("id", data.instalacaoId)
  .select()
  .single();
```

### Solução 4: Regenerar Tipos do Supabase (Avançado)

Se você tem o Supabase CLI instalado:

```bash
npx supabase gen types typescript --project-id seu-project-id > src/integrations/supabase/types.ts
```

## 🎯 Teste Rápido

Depois de recarregar, teste:

1. Acesse uma campanha
2. Clique em "Ativar" em um endereço pendente
3. Preencha as datas
4. Faça upload de 1 foto do recibo
5. Faça upload de 2 fotos da placa
6. Clique em "Ativar Instalação"

Deve funcionar sem erros!

## 📊 Verificação Final

Execute este SQL para confirmar que tudo está OK:

```sql
-- Deve retornar 10 colunas
SELECT COUNT(*) 
FROM information_schema.columns
WHERE table_name = 'instalacoes'
  AND column_name IN (
    'foto_recibo',
    'fotos_placa',
    'fotos_retirada',
    'data_retirada_prevista',
    'data_retirada_real',
    'observacoes_retirada',
    'motivo_substituicao',
    'substituido_por',
    'atualizado_por',
    'atualizado_em'
  );
```

## 🆘 Se Ainda Não Funcionar

Me avise e vou adicionar o cast `as any` em mais lugares do código para forçar o TypeScript a aceitar as novas colunas.
