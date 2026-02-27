# Mudança: Coordenador Vinculado por Estado

## Contexto
Feedback do time de operações sobre o modelo de vinculação de coordenadores.

## Mudanças Necessárias

### 1. Modelo de Dados
**ANTES**: Coordenador vinculado a comunidades específicas
**DEPOIS**: Coordenador vinculado a estados (UF)

#### Impactos no Banco de Dados:
- Tabela `territorios`: Atualmente tem `comunidade_id`
- Precisa mudar para armazenar apenas `uf` (estado)
- Remover dependência de `comunidade_id`

### 2. Cadastro de Coordenador
**Mudança**: Ao cadastrar coordenador, selecionar apenas o ESTADO (UF) que ele cobre
- Remover seleção de cidade/comunidade
- Adicionar apenas dropdown de UF

### 3. Filtro na Criação de Campanha
**ANTES**: Filtrava coordenadores por comunidade selecionada
**DEPOIS**: Filtrar coordenadores pelo UF selecionado na campanha

#### Lógica:
```
Se campanha é para UF = "SP"
  → Mostrar apenas coordenadores que cobrem "SP"
```

### 4. Trocar Coordenador na Campanha
**Nova funcionalidade**: Permitir trocar o coordenador de um grupo dentro da campanha

#### Requisitos:
- Botão "Trocar Coordenador" em cada grupo da campanha
- Modal para selecionar novo coordenador (filtrado pelo UF do grupo)
- Ao trocar, atualizar `grupos_campanha.coordenador_id`
- Manter histórico da troca (opcional, mas recomendado)

### 5. Dashboard do Coordenador
**Impacto**: Coordenador vê todas as campanhas do seu estado, não apenas de comunidades específicas

## Arquivos que Precisam Ser Alterados

### Backend (Supabase)
1. **Migration**: Alterar tabela `territorios`
   - Remover `comunidade_id` (ou tornar nullable)
   - Adicionar coluna `uf` (VARCHAR(2))
   - Migrar dados existentes

2. **RLS Policies**: Ajustar policies que filtram por comunidade

### Frontend
1. **src/pages/Users.tsx**
   - Formulário de cadastro de coordenador
   - Remover seleção de comunidade
   - Adicionar apenas dropdown de UF

2. **src/components/NovaCampanhaModalV2.tsx**
   - Alterar filtro de coordenadores
   - Filtrar por UF em vez de comunidade

3. **src/components/TerritoriosEditor.tsx**
   - Simplificar para trabalhar apenas com UF

4. **src/pages/CampaignDetail.tsx** (NOVO)
   - Adicionar botão "Trocar Coordenador" em cada grupo
   - Modal para trocar coordenador

5. **src/hooks/useCoordenadorDashboard.ts**
   - Ajustar queries para buscar por UF

## Prioridade de Implementação

### Fase 1: Modelo de Dados (CRÍTICO)
- [ ] Criar migration para alterar `territorios`
- [ ] Migrar dados existentes
- [ ] Testar integridade dos dados

### Fase 2: Cadastro de Coordenador
- [ ] Alterar formulário em `Users.tsx`
- [ ] Remover seleção de comunidade
- [ ] Adicionar dropdown de UF

### Fase 3: Filtro na Campanha
- [ ] Alterar `NovaCampanhaModalV2.tsx`
- [ ] Filtrar coordenadores por UF
- [ ] Testar criação de campanha

### Fase 4: Trocar Coordenador
- [ ] Adicionar botão em `CampaignDetail.tsx`
- [ ] Criar modal de troca
- [ ] Implementar lógica de atualização

### Fase 5: Dashboard Coordenador
- [ ] Ajustar queries em `useCoordenadorDashboard.ts`
- [ ] Testar visualização

## Riscos e Considerações

1. **Dados Existentes**: Coordenadores já cadastrados com comunidades precisam ser migrados
2. **Campanhas Ativas**: Campanhas em andamento podem ter coordenadores vinculados a comunidades
3. **Histórico**: Considerar manter histórico de trocas de coordenador
4. **Permissões**: Garantir que apenas admin/operações podem trocar coordenador

## Próximos Passos

1. Validar com o time se entendi corretamente
2. Criar migration para alterar modelo de dados
3. Implementar mudanças no frontend
4. Testar fluxo completo
