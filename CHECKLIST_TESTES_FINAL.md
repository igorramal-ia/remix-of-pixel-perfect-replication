# ✅ Checklist de Testes Final

## 🧪 Testes para Executar Após Todas as Implementações

### 1. Cache e Atualização Automática ✅ IMPLEMENTADO

- [ ] **Criar Campanha**
  - Criar nova campanha
  - Verificar se aparece na lista SEM dar F5
  - Status: ⏳ Pendente

- [ ] **Ativar Instalação**
  - Abrir detalhes da campanha
  - Ativar uma instalação
  - Verificar se status muda instantaneamente
  - Status: ⏳ Pendente

- [ ] **Finalizar Instalação**
  - Finalizar uma instalação ativa
  - Verificar se status muda para finalizada
  - Verificar se endereço fica disponível
  - Status: ⏳ Pendente

- [ ] **Adicionar Pontos**
  - Adicionar novos pontos à campanha
  - Verificar se aparecem na lista SEM dar F5
  - Status: ⏳ Pendente

### 2. Geocoding Automático ✅ IMPLEMENTADO

- [ ] **Criar Endereço com Geocoding**
  - Criar novo endereço: "Avenida Paulista, 1578, São Paulo, SP"
  - Verificar no console: "🗺️ Buscando coordenadas..."
  - Aguardar 2-3 segundos
  - Verificar no console: "✅ Coordenadas encontradas"
  - Recarregar página (F5)
  - Verificar se latitude e longitude estão preenchidas
  - Status: ⏳ Pendente

- [ ] **Verificar no Banco**
  ```sql
  SELECT endereco, cidade, uf, latitude, longitude
  FROM enderecos
  WHERE latitude IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 5;
  ```
  - Status: ⏳ Pendente

### 3. Sugestão Inteligente de Endereços ✅ IMPLEMENTADO

- [ ] **Criar Campanha com Sugestão**
  - Criar nova campanha
  - Abrir modal "Adicionar Pontos"
  - Verificar se apenas endereços disponíveis são listados
  - Verificar se endereços ocupados NÃO aparecem
  - Status: ⏳ Pendente

- [ ] **Verificar Regra de 2 Dias**
  - Finalizar uma instalação
  - Criar nova campanha no mesmo dia
  - Verificar se endereço NÃO é sugerido (< 2 dias)
  - Aguardar 2 dias (ou simular no banco)
  - Verificar se endereço volta a ser sugerido
  - Status: ⏳ Pendente

### 4. Adicionar Pontos na Campanha ✅ IMPLEMENTADO

- [ ] **Botão Habilitado**
  - Abrir detalhes da campanha
  - Verificar se botão "Adicionar Pontos" está habilitado
  - Status: ⏳ Pendente

- [ ] **Adicionar Endereços Existentes**
  - Clicar em "Adicionar Pontos"
  - Aba "Endereços Existentes"
  - Selecionar endereços disponíveis
  - Salvar
  - Verificar se instalações são criadas (status: pendente)
  - Verificar se aparecem SEM dar F5
  - Status: ⏳ Pendente

- [ ] **Criar Novo Endereço**
  - Clicar em "Adicionar Pontos"
  - Aba "Criar Novo"
  - Preencher dados:
    - UF: SP
    - Cidade: São Paulo
    - Comunidade: Paraisópolis
    - Endereço: Rua Teste, 123
  - Clicar "Criar e Adicionar"
  - Verificar se endereço é criado
  - Verificar se instalação é criada
  - Verificar se coordenadas são buscadas automaticamente
  - Verificar se aparece na campanha SEM dar F5
  - Status: ⏳ Pendente

### 5. Excluir Endereço ✅ IMPLEMENTADO

- [ ] **Aplicar Migration Primeiro**
  ```sql
  -- Executar no SQL Editor do Supabase:
  -- Copiar conteúdo de aplicar-prioridade-alta.sql
  ```
  - Status: ⏳ Pendente

- [ ] **Excluir Endereço Disponível**
  - Ir para inventário
  - Selecionar endereço sem instalações ativas
  - Clicar no menu (⋮)
  - Clicar "Excluir Endereço"
  - Confirmar
  - Verificar se endereço some da lista SEM dar F5
  - Status: ⏳ Pendente

- [ ] **Tentar Excluir Endereço Ocupado**
  - Selecionar endereço com instalação ativa
  - Clicar no menu (⋮)
  - Clicar "Excluir Endereço"
  - Verificar mensagem de erro: "Não é possível excluir endereço com instalações ativas"
  - Verificar que endereço NÃO foi excluído
  - Status: ⏳ Pendente

- [ ] **Verificar Soft Delete no Banco**
  ```sql
  SELECT endereco, ativo
  FROM enderecos
  WHERE ativo = false
  ORDER BY updated_at DESC
  LIMIT 5;
  ```
  - Verificar se endereços excluídos têm `ativo = false`
  - Status: ⏳ Pendente

### 6. Relatórios ✅ JÁ IMPLEMENTADO

- [ ] **Gerar Relatório**
  - Gerar novo relatório
  - Verificar se fotos aparecem (signed URLs)
  - Verificar se coordenadas aparecem
  - Verificar se design está limpo
  - Status: ⏳ Pendente

- [ ] **Verificar Estrutura**
  - Slide 1: Capa com informações
  - Slides 2+: Fotos por endereço
  - Verificar se coordenadas aparecem: "📍 Coordenadas: -23.550520, -46.633309"
  - Status: ⏳ Pendente

### 7. Status no Mapa (Futuro - NÃO IMPLEMENTADO)

- [ ] **Cores por Status**
  - Abrir mapa geral
  - Verificar cores:
    - 🔴 Vermelho: Ocupado (instalação ativa)
    - 🟢 Verde: Disponível
    - 🟡 Amarelo: Em transição (< 2 dias)
  - Status: ⏳ Pendente (não implementado ainda)

---

## 📊 Resumo de Testes

### Prioridade Alta (Implementados Hoje)
- Total de testes: 12
- Concluídos: 0
- Pendentes: 12
- Falharam: 0

### Prioridade Máxima (Implementados Anteriormente)
- Total de testes: 4
- Concluídos: 0
- Pendentes: 4
- Falharam: 0

### Total Geral
- Total de testes: 16
- Concluídos: 0
- Pendentes: 16
- Falharam: 0

---

## 🐛 Bugs Encontrados

(Adicionar aqui qualquer bug encontrado durante os testes)

---

## ✅ Aprovação Final

- [ ] Todos os testes passaram
- [ ] Nenhum bug crítico encontrado
- [ ] Sistema pronto para produção

---

## 📝 Ordem de Execução dos Testes

### Passo 1: Aplicar Migration
```sql
-- Executar aplicar-prioridade-alta.sql no Supabase
```

### Passo 2: Testar Criação de Endereço
1. Criar novo endereço (teste geocoding)
2. Verificar coordenadas no banco

### Passo 3: Testar Adicionar Pontos
1. Adicionar endereços existentes
2. Criar novo endereço via modal

### Passo 4: Testar Sugestão Inteligente
1. Criar campanha
2. Verificar apenas disponíveis

### Passo 5: Testar Exclusão
1. Excluir endereço disponível
2. Tentar excluir ocupado (deve falhar)

### Passo 6: Testar Cache
1. Fazer várias operações
2. Verificar se atualiza sem F5

---

**Documento atualizado em**: 01/03/2026  
**Status**: 📋 Aguardando execução dos testes
