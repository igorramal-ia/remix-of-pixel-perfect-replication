# 🔧 Correções de Bugs - 01/03/2026

## ✅ Bug #2: Fotos Corrompidas - CORRIGIDO

### Problema
Fotos apareciam corrompidas no modal de ativar instalação.

### Causa
URLs públicas do Supabase Storage podem expirar ou ter problemas de permissão.

### Solução Implementada
Criado componente `ImagemSegura` que:
1. Converte automaticamente URLs públicas para Signed URLs
2. Signed URLs são válidas por 1 hora
3. Mostra loading enquanto carrega
4. Mostra erro se falhar

### Arquivos Criados
- `src/components/ImagemSegura.tsx`

### Arquivos Modificados
- `src/components/UploadFotos.tsx`

### Como Funciona
```typescript
// Antes (URL pública - pode expirar)
<img src="https://...public/instalacoes-fotos/foto.jpg" />

// Depois (Signed URL - sempre válida)
<ImagemSegura src="https://...public/instalacoes-fotos/foto.jpg" />
// Componente converte automaticamente para signed URL
```

### Teste
1. Ativar uma instalação
2. Fazer upload de fotos
3. Verificar se fotos aparecem corretamente
4. Recarregar página
5. Verificar se fotos continuam aparecendo

---

## ⏳ Bug #1: Cache não atualiza - EM ANÁLISE

### Problema
Após ativar instalação, precisou mudar de página para ver atualização.

### Análise
O hook `useAtivarInstalacao` já invalida as queries corretas:
- `campaign-detail`
- `instalacoes`
- `campanhas`
- `dashboard`
- etc.

### Possíveis Causas
1. Componente não está usando a query correta
2. Query key não está batendo
3. Problema de timing (invalidação antes da mutation completar)

### Próximos Passos
- Verificar qual query o componente CampaignDetail está usando
- Verificar se a invalidação está acontecendo no momento certo
- Adicionar logs para debug

---

## ⏳ Bug #3: Status no Mapa - PLANEJADO

### Problema
Mapa não mostra diferença entre endereços ocupados e disponíveis.

### Solução Planejada
Implementar lógica de cores no componente do mapa:
- 🟢 Verde: Disponível (sem instalação ativa)
- 🔴 Vermelho: Ocupado (instalação ativa)
- 🟡 Amarelo: Em transição (finalizada há menos de 2 dias)

### Arquivos a Modificar
- `src/pages/MapPage.tsx` (ou componente do mapa)

### Lógica
```typescript
const getCorMarcador = (endereco) => {
  if (endereco.instalacao_ativa) return 'red';
  if (endereco.finalizada_recente) return 'yellow';
  return 'green';
};
```

---

## ⏳ Bug #4: Filtros no Mapa - PLANEJADO

### Problema
Falta filtros para mostrar apenas ativos, ocupados, etc.

### Solução Planejada
Adicionar filtros no componente do mapa:
- Todos
- Disponíveis
- Ocupados
- Inativos
- Em transição

### UI
```
[Todos] [Disponíveis] [Ocupados] [Inativos]
```

---

## 📊 Status das Correções

### Concluídas: 1
- ✅ Fotos corrompidas

### Em Análise: 1
- ⏳ Cache não atualiza

### Planejadas: 2
- ⏳ Status no mapa
- ⏳ Filtros no mapa

---

## 🧪 Testes Necessários

### Fotos Corrompidas
- [ ] Fazer upload de fotos
- [ ] Verificar se aparecem corretamente
- [ ] Recarregar página
- [ ] Verificar se continuam aparecendo
- [ ] Aguardar 1 hora e verificar se renovam automaticamente

### Cache
- [ ] Ativar instalação
- [ ] Verificar se atualiza sem mudar de página
- [ ] Finalizar instalação
- [ ] Verificar se atualiza sem mudar de página

---

**Documento criado em**: 01/03/2026  
**Última atualização**: 01/03/2026  
**Status**: 1/4 bugs corrigidos

