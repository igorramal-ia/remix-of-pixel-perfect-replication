# 📋 TODO: Melhorias no Design do Relatório PowerPoint

## ✅ O que já funciona:

1. ✅ Sistema de geração de relatórios implementado
2. ✅ Migrations aplicadas (tabela + storage)
3. ✅ Modal de geração funcionando
4. ✅ Download automático do arquivo PPT
5. ✅ Histórico de relatórios
6. ✅ 2 tipos de relatório (Parcial e Final)
7. ✅ Organização hierárquica dos dados
8. ✅ 1 endereço = 1 slide (regra crítica)

## 🎨 Problemas Identificados no Design:

### 1. Formatação Geral
- ❌ Relatório está "feio e sem formatação"
- ❌ Layout não está profissional
- ❌ Cores e tipografia precisam melhorar

### 2. Fotos
- ❌ Fotos aparecem "crashadas" (quebradas)
- ❌ Muitas fotos não carregam (erro 400)
- ❌ Placeholders não estão elegantes

### 3. Slides Intermediários
- ❌ Muitos slides de introdução (Estado, Cidade, Comunidade)
- ✅ **Solução**: Resumir em 1 slide só ou remover

### 4. Slide de Endereço
- ❌ Formatação não está legal
- ❌ Layout precisa ser mais limpo e profissional

### 5. Página de Localização
- ❌ **MUITO IMPORTANTE**: Falta uma página com mapa/localização
- ❌ Precisa mostrar onde está o ponto geograficamente

## 🎯 Próximas Ações (Quando Voltar):

### Prioridade 1: Resolver Fotos
- [ ] Investigar por que fotos não carregam (erro 400)
- [ ] Verificar permissões do bucket `instalacoes-fotos`
- [ ] Considerar usar URLs assinadas (signed URLs)
- [ ] Melhorar placeholder para fotos quebradas

### Prioridade 2: Simplificar Estrutura
- [ ] Remover ou condensar slides de Estado/Cidade/Comunidade
- [ ] Criar 1 slide único de introdução hierárquica
- [ ] Manter foco nos slides de endereços

### Prioridade 3: Melhorar Design dos Slides
- [ ] Redesenhar capa com identidade visual
- [ ] Melhorar layout do slide de endereço
- [ ] Adicionar cores e espaçamento adequados
- [ ] Usar tipografia hierárquica

### Prioridade 4: Adicionar Página de Localização
- [ ] Criar slide com mapa da região
- [ ] Mostrar coordenadas geográficas
- [ ] Indicar localização do ponto
- [ ] Adicionar informações de acesso

## 📝 Referências de Design:

### Exemplo de Relatório Profissional:
- Capa com logo e informações principais
- Resumo executivo com gráficos
- Slides de conteúdo limpos e organizados
- Fotos em grid com bordas
- Rodapé com informações de contato

### Cores Sugeridas:
- **Primária**: Azul corporativo (#1E40AF)
- **Secundária**: Branco (#FFFFFF)
- **Destaque**: Verde (#22C55E) ou Laranja (#F59E0B)
- **Texto**: Cinza escuro (#1E293B)
- **Fundo**: Cinza claro (#F8FAFC)

### Tipografia:
- **Títulos**: 32-48px, bold
- **Subtítulos**: 20-28px, semibold
- **Texto**: 12-16px, regular
- **Labels**: 10-12px, regular

## 🔧 Arquivos a Modificar:

1. **`src/services/relatorioService.ts`**
   - Função `adicionarSlideCapa()`
   - Função `adicionarSlideResumo()`
   - Função `adicionarSlideEndereco()`
   - Função `adicionarGridFotosMelhorado()`
   - Adicionar função `adicionarSlideLocalizacao()`

2. **`src/hooks/useGerarRelatorio.ts`**
   - Verificar se precisa buscar coordenadas geográficas
   - Adicionar lógica para URLs assinadas das fotos

## 💡 Ideias para Implementar:

### Slide de Localização:
```
┌─────────────────────────────────────┐
│ LOCALIZAÇÃO DO PONTO                │
├─────────────────────────────────────┤
│                                     │
│ [MAPA DA REGIÃO]                    │
│                                     │
│ Endereço: R. Exemplo, 123           │
│ Comunidade: Brasilândia             │
│ Cidade: São Paulo - SP              │
│                                     │
│ Coordenadas:                        │
│ Latitude: -23.4567                  │
│ Longitude: -46.7890                 │
│                                     │
│ Como chegar:                        │
│ [Instruções de acesso]              │
└─────────────────────────────────────┘
```

### Grid de Fotos Melhorado:
- Bordas brancas (2-3px)
- Sombra suave
- Espaçamento de 0.3-0.5
- Máximo 4 fotos por slide
- Se mais de 4, criar slide adicional

### Placeholder Elegante:
```
┌─────────────────┐
│                 │
│      🖼️         │
│                 │
│ Imagem não      │
│ disponível      │
│                 │
└─────────────────┘
```

## 📊 Status Atual:

- **Sistema**: ✅ Funcionando
- **Design**: ⚠️ Precisa melhorar
- **Fotos**: ❌ Não carregam
- **Estrutura**: ⚠️ Muitos slides
- **Localização**: ❌ Não implementado

## 🎯 Meta Final:

Criar um relatório PowerPoint **profissional, limpo e editável** que:
- Tenha identidade visual consistente
- Mostre todas as informações importantes
- Tenha fotos carregando corretamente
- Seja fácil de navegar
- Impressione o cliente

---

**Quando voltar, começar por**: Resolver o problema das fotos (erro 400) e simplificar a estrutura de slides.
