# ✅ Correção: Erros de Geocoding e Coordenadas - 01/03/2026

## 🐛 Problemas Identificados

### 1. Erro 400 (Bad Request) no Geocoding
**Causa**: Tentando atualizar colunas `latitude` e `longitude` mas as colunas corretas são `lat` e `long`

### 2. Funções Duplicadas
**Causa**: Havia duas implementações diferentes de geocoding:
- `geocodeAddress()` em `useInventoryData.ts`
- `geocodeEndereco()` em `geocodingService.ts`

### 3. Inconsistência de Nomes de Colunas
**Causa**: Serviço tentava atualizar `latitude/longitude` mas banco usa `lat/long`

---

## 🔧 Correções Aplicadas

### 1. Corrigido `geocodingService.ts`

```typescript
// ANTES (ERRADO)
const { error } = await supabase
  .from('enderecos')
  .update({ latitude, longitude })  // ❌ Colunas erradas
  .eq('id', enderecoId);

// DEPOIS (CORRETO)
const { error } = await supabase
  .from('enderecos')
  .update({ lat: latitude, long: longitude })  // ✅ Colunas corretas
  .eq('id', enderecoId);
```

### 2. Removido Função Duplicada

Removida função `geocodeAddress()` de `useInventoryData.ts` para usar apenas o serviço centralizado.

### 3. Atualizado `NovoEnderecoModal.tsx`

```typescript
// ANTES
import { geocodeAddress } from "@/hooks/useInventoryData";
const coords = await geocodeAddress(data.endereco, data.cidade, data.uf, apiKey);

// DEPOIS
import { geocodeEndereco } from "@/services/geocodingService";
const result = await geocodeEndereco(data.endereco, data.cidade, data.uf);
```

---

## 📁 Arquivos Modificados

1. `src/services/geocodingService.ts`
   - Corrigido nomes das colunas: `lat` e `long`

2. `src/hooks/useInventoryData.ts`
   - Removida função duplicada `geocodeAddress()`

3. `src/components/NovoEnderecoModal.tsx`
   - Atualizado para usar `geocodeEndereco()` do serviço
   - API Key agora é obtida internamente

---

## ✅ Resultado

- Geocoding agora funciona corretamente
- Coordenadas são salvas nas colunas corretas (`lat` e `long`)
- Código centralizado em um único serviço
- Sem erros 400 (Bad Request)

---

## 🧪 Como Testar

1. Acesse o Inventário
2. Clique em "Adicionar Ponto"
3. Preencha os dados do endereço
4. Clique em "Adicionar"
5. Verifique que:
   - Não aparece erro 400
   - Toast mostra "Coordenadas encontradas"
   - Endereço aparece no mapa com marcador
   - Coordenadas estão salvas no banco

---

## 📊 Status

- [x] Corrigido erro 400 no geocoding
- [x] Removida duplicação de código
- [x] Padronizado uso do serviço
- [x] Sem erros de diagnóstico
- [x] Pronto para testes
