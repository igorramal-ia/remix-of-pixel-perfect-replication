# Implementação: Dashboard do Coordenador

## ✅ Implementado

### 1. Hook: useCoordenadorDashboard.ts

**Arquivo**: `src/hooks/useCoordenadorDashboard.ts`

**Hooks criados:**

#### `useCoordenadorStats()`
Retorna estatísticas do coordenador:
- Campanhas ativas
- Total de comunidades
- Instalações ativas
- Instalações pendentes
- Progresso geral (%)

#### `useCampanhasCoordenador()`
Retorna campanhas ativas atribuídas ao coordenador:
- Nome, cliente, datas
- Região
- Total de pontos
- Pontos instalados/pendentes
- Progresso (%)

#### `useTerritoriosCoordenador()`
Retorna territórios do coordenador:
- UF → Cidades → Comunidades
- Quantidade de endereços por comunidade

---

### 2. Página: DashboardCoordenador.tsx

**Arquivo**: `src/pages/DashboardCoordenador.tsx`

**Seções:**

#### Header
```
Bem-vindo, [Nome do Coordenador]
Suas campanhas e estatísticas de instalação
```

#### Cards de Estatísticas (4 cards)
1. **Campanhas Ativas** - Quantidade atribuídas
2. **Comunidades** - Sob responsabilidade
3. **Instalados** - Quantidade + % concluído
4. **Pendentes** - Aguardando instalação

#### Minhas Campanhas Ativas
Lista de campanhas com:
- Nome + Cliente
- Período (datas)
- Região
- Barra de progresso
- Botões: "Ver Detalhes" e "Trabalhar" (se pendentes)

#### Meus Territórios
Árvore de territórios:
- UF
  - Cidade
    - Comunidade (X endereços)

---

### 3. Roteamento Inteligente

**Arquivo**: `src/pages/Dashboard.tsx`

```typescript
const Dashboard = () => {
  const { hasRole } = useAuth();

  // Se for coordenador, mostrar dashboard específico
  if (hasRole("coordenador")) {
    return <DashboardCoordenador />;
  }

  // Dashboard para admin/operações
  return <DashboardAdmin />;
};
```

**Resultado:**
- Coordenador vê `DashboardCoordenador`
- Admin/Operações veem `DashboardAdmin` (dashboard atual)

---

## Como Testar

### 1. Fazer Login como Coordenador

Usar um dos coordenadores existentes:
- Arlindo
- Ou criar novo coordenador de teste

### 2. Acessar Dashboard

Ao fazer login, coordenador verá automaticamente:
- Suas estatísticas
- Suas campanhas ativas
- Seus territórios

### 3. Verificar Dados

**Estatísticas:**
- ✅ Campanhas ativas conta apenas campanhas atribuídas
- ✅ Comunidades mostra territórios do coordenador
- ✅ Instalados/Pendentes conta apenas instalações dele

**Campanhas:**
- ✅ Lista apenas campanhas ativas (data_fim >= hoje)
- ✅ Mostra progresso correto
- ✅ Botão "Trabalhar" aparece se há pendentes

**Territórios:**
- ✅ Mostra UF → Cidade → Comunidades
- ✅ Conta endereços por comunidade

---

## Próximos Passos

### Fase 2: Visualização de Campanha (Coordenador)

Criar página específica para coordenador ver detalhes da campanha:

**Arquivo**: `src/pages/CampanhaDetailCoordenador.tsx`

**Funcionalidades:**
- Mapa com pontos (verde = instalado, amarelo = pendente)
- Lista de instalações
- Status de cada ponto
- Botões para mobile (instalar, mapear)

**Roteamento**:
```typescript
// src/pages/CampaignDetail.tsx

const CampaignDetail = () => {
  const { hasRole } = useAuth();

  if (hasRole("coordenador")) {
    return <CampanhaDetailCoordenador />;
  }

  return <CampanhaDetailAdmin />;
};
```

### Fase 3: Versão Mobile (PWA)

**Recomendação: PWA (Progressive Web App)**

**Vantagens:**
- ✅ Funciona no navegador (sem app store)
- ✅ Pode ser "instalado" no celular
- ✅ Acesso à câmera e GPS
- ✅ Mesmo código (responsivo)
- ✅ Atualizações instantâneas

**Desvantagens:**
- ⚠️ Precisa de internet (mas pode ter cache)
- ⚠️ Menos integração com sistema

**Como implementar:**
1. Adicionar `manifest.json`
2. Adicionar Service Worker
3. Tornar interface responsiva
4. Adicionar botão "Instalar App"

**Offline:**
- Não é necessário para operação básica
- Pode cachear dados para visualização
- Upload de fotos pode ser enfileirado

---

## Estrutura de Arquivos

```
src/
├── hooks/
│   └── useCoordenadorDashboard.ts ✅ (novo)
├── pages/
│   ├── Dashboard.tsx ✅ (atualizado)
│   └── DashboardCoordenador.tsx ✅ (novo)
└── components/
    └── (componentes existentes)
```

---

## Queries SQL Executadas

### useCoordenadorStats()
```sql
-- Buscar vínculos
SELECT campanha_id FROM campanha_coordenadores 
WHERE coordenador_id = ?

-- Buscar campanhas ativas
SELECT id FROM campanhas 
WHERE id IN (?) AND data_fim >= ?

-- Buscar instalações
SELECT id, status, campanha_id FROM instalacoes 
WHERE representante_id = ?

-- Buscar territórios
SELECT territorios FROM profiles 
WHERE id = ?
```

### useCampanhasCoordenador()
```sql
-- Buscar vínculos
SELECT campanha_id FROM campanha_coordenadores 
WHERE coordenador_id = ?

-- Buscar campanhas
SELECT * FROM campanhas 
WHERE id IN (?) AND data_fim >= ?

-- Para cada campanha, buscar instalações
SELECT id, status FROM instalacoes 
WHERE campanha_id = ? AND representante_id = ?
```

### useTerritoriosCoordenador()
```sql
-- Buscar territórios
SELECT territorios FROM profiles 
WHERE id = ?

-- Para cada comunidade, contar endereços
SELECT COUNT(*) FROM enderecos 
WHERE comunidade = ?
```

---

## Decisões Técnicas

### 1. Foto Obrigatória
- 2 fotos por instalação
- Registro da placa instalada
- Upload para Supabase Storage

### 2. Prazo de Expiração
- Definido pelo coordenador no momento da instalação
- Não é fixo (30 dias)
- Campo: `data_expiracao` na tabela `instalacoes`

### 3. Adicionar Endereços
- Coordenador pode mapear novos endereços
- Novos endereços vão para o inventário
- Instalação criada automaticamente

### 4. PWA vs App Nativo
- **Escolhido: PWA**
- Funciona no navegador
- Acesso a câmera e GPS
- Sem necessidade de app store

---

## Arquivos Criados/Modificados

- ✅ `src/hooks/useCoordenadorDashboard.ts` (novo)
- ✅ `src/pages/DashboardCoordenador.tsx` (novo)
- ✅ `src/pages/Dashboard.tsx` (atualizado)

---

## Status

✅ **FASE 1 CONCLUÍDA** - Dashboard do Coordenador implementado e funcional

🔄 **PRÓXIMO**: Fase 2 - Visualização de Campanha (Coordenador)
