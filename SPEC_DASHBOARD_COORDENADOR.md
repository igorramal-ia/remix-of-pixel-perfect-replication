# Especificação: Dashboard e Fluxo do Coordenador

## Visão Geral

O coordenador é o usuário que trabalha em campo, instalando e gerenciando pontos de mídia OOH. Ele precisa de:
1. Dashboard próprio com suas métricas
2. Visualização de campanhas atribuídas
3. Ferramentas para atualizar instalações
4. Capacidade de mapear novos endereços

---

## 1. Dashboard do Coordenador

### Métricas Principais

```
┌─────────────────────────────────────────────────┐
│ Dashboard - Bem-vindo, [Nome]                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Minhas Estatísticas                         │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │    3     │ │    45    │ │   38     │       │
│  │Campanhas │ │Endereços │ │Instalados│       │
│  │  Ativas  │ │  Total   │ │  (84%)   │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│  ┌──────────┐                                  │
│  │    7     │                                  │
│  │Pendentes │                                  │
│  │          │                                  │
│  └──────────┘                                  │
│                                                 │
│  📋 Minhas Campanhas Ativas                    │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ Campanha Verão 2026 - Coca-Cola        │  │
│  │ 📅 01/01/2026 — 31/03/2026              │  │
│  │ 📍 Brasilândia, São Paulo/SP            │  │
│  │ ████████░░ 80% (8 de 10 pontos)         │  │
│  │ [Ver Detalhes] [Trabalhar]              │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ Campanha Natal 2025 - Ambev            │  │
│  │ 📅 01/12/2025 — 31/12/2025              │  │
│  │ 📍 Cantinho Do Céu, São Paulo/SP        │  │
│  │ ██████████ 100% (15 de 15 pontos)       │  │
│  │ [Ver Detalhes]                          │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  🗺️ Meus Territórios                           │
│                                                 │
│  • São Paulo/SP                                │
│    - Brasilândia (25 endereços)               │
│    - Cantinho Do Céu (20 endereços)           │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Dados Exibidos

**Cards de Estatísticas:**
1. Campanhas Ativas (count)
2. Endereços Totais sob responsabilidade
3. Instalações Ativas (count + %)
4. Instalações Pendentes (count)

**Lista de Campanhas:**
- Nome + Cliente
- Período
- Região
- Progresso (barra + %)
- Botões: "Ver Detalhes" e "Trabalhar" (se pendentes)

**Territórios:**
- UF → Cidade → Comunidades
- Quantidade de endereços por comunidade

---

## 2. Detalhes da Campanha (Visão Coordenador)

### Desktop (Visualização)

```
┌─────────────────────────────────────────────────┐
│ Campanha Verão 2026 - Coca-Cola                │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Meu Progresso                               │
│  ████████░░ 80% (8 de 10 pontos instalados)    │
│                                                 │
│  🗺️ Mapa dos Pontos                            │
│  ┌─────────────────────────────────────────┐  │
│  │                                         │  │
│  │    🟢 🟢 🟢                             │  │
│  │       🟢 🟢                             │  │
│  │    🟡 🟡                                │  │
│  │       🟢                                │  │
│  │                                         │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  📍 Meus Pontos                                 │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ 🟢 R. Acará-Açu, 549 - Brasilândia     │  │
│  │    Instalado em 15/01/2026              │  │
│  │    [Ver Detalhes]                       │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ 🟡 R. Acióli, 401 - Brasilândia        │  │
│  │    Pendente                             │  │
│  │    [Atualizar Status] (mobile)          │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ⚠️ Faltam 2 pontos para completar             │
│  [Mapear Novos Endereços] (mobile)             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Funcionalidades Desktop:**
- ✅ Ver mapa com pontos
- ✅ Ver lista de endereços
- ✅ Ver status de cada ponto
- ❌ NÃO tem botão "Adicionar Pontos" (do banco)
- ⚠️ Botões de ação redirecionam para mobile

---

### Mobile (Operação em Campo)

```
┌─────────────────────────┐
│ Campanha Verão 2026     │
│ Coca-Cola               │
├─────────────────────────┤
│                         │
│ 📊 8 de 10 pontos       │
│ ████████░░ 80%          │
│                         │
│ 📍 Meus Pontos          │
│                         │
│ ┌─────────────────────┐ │
│ │ 🟢 R. Acará-Açu    │ │
│ │ Instalado          │ │
│ │ [Ver] [Foto]       │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 🟡 R. Acióli       │ │
│ │ Pendente           │ │
│ │ [Instalar Agora]   │ │
│ └─────────────────────┘ │
│                         │
│ ⚠️ Faltam 2 pontos      │
│                         │
│ [+ Mapear Novo Ponto]   │
│                         │
└─────────────────────────┘
```

**Fluxo: Instalar Ponto Existente**

```
1. Clicar em "Instalar Agora"
   ↓
2. Tela de Instalação
   ┌─────────────────────────┐
   │ Instalar Ponto          │
   ├─────────────────────────┤
   │ 📍 R. Acióli, 401       │
   │    Brasilândia          │
   │                         │
   │ 📸 Tirar Foto           │
   │ [Câmera]                │
   │                         │
   │ 📅 Data de Instalação   │
   │ [25/02/2026]            │
   │                         │
   │ 📅 Data de Expiração    │
   │ [25/03/2026] (30 dias)  │
   │                         │
   │ 📝 Observações          │
   │ [Opcional]              │
   │                         │
   │ [Confirmar Instalação]  │
   └─────────────────────────┘
   ↓
3. Status atualizado: pendente → ativa
4. Foto salva no storage
5. Volta para lista
```

**Fluxo: Mapear Novo Ponto**

```
1. Clicar em "+ Mapear Novo Ponto"
   ↓
2. Tela de Novo Endereço
   ┌─────────────────────────┐
   │ Mapear Novo Ponto       │
   ├─────────────────────────┤
   │ 📍 Endereço Completo    │
   │ [Digite o endereço]     │
   │                         │
   │ 🗺️ Comunidade           │
   │ [Brasilândia ▼]         │
   │                         │
   │ 📍 Usar Localização GPS │
   │ [Capturar Coordenadas]  │
   │                         │
   │ 📸 Foto do Local        │
   │ [Câmera]                │
   │                         │
   │ 📝 Observações          │
   │ [Opcional]              │
   │                         │
   │ [Salvar e Instalar]     │
   └─────────────────────────┘
   ↓
3. Novo endereço criado no banco
4. Instalação criada automaticamente
5. Status: ativa (já instalado)
6. Volta para lista
```

---

## 3. Estrutura de Dados

### Hook: useCoordenadorDashboard

```typescript
interface CoordenadorStats {
  campanhas_ativas: number;
  total_enderecos: number;
  instalacoes_ativas: number;
  instalacoes_pendentes: number;
  progresso_geral: number;
}

interface CampanhaCoordenador {
  id: string;
  nome: string;
  cliente: string;
  data_inicio: string;
  data_fim: string;
  regiao: string;
  total_pontos: number;
  pontos_instalados: number;
  pontos_pendentes: number;
  progresso: number;
}

interface Territorio {
  uf: string;
  cidade: string;
  comunidades: Array<{
    nome: string;
    total_enderecos: number;
  }>;
}
```

### Hook: useCampanhaCoordenador

```typescript
interface PontoCampanha {
  id: string; // instalacao_id
  endereco_id: string;
  endereco: string;
  comunidade: string;
  lat: number | null;
  long: number | null;
  status: "pendente" | "ativa" | "finalizada";
  data_instalacao: string | null;
  data_expiracao: string | null;
  foto_url: string | null;
}
```

---

## 4. Componentes Necessários

### Desktop

1. **DashboardCoordenador.tsx** (novo)
   - Cards de estatísticas
   - Lista de campanhas ativas
   - Lista de territórios

2. **CampanhaDetailCoordenador.tsx** (novo)
   - Mapa com pontos
   - Lista de instalações
   - Botões desabilitados/redirecionam para mobile

### Mobile

3. **CampanhaMobile.tsx** (novo)
   - Lista de pontos
   - Botão "Instalar Agora"
   - Botão "Mapear Novo Ponto"

4. **InstalarPontoModal.tsx** (novo)
   - Upload de foto
   - Datas de instalação/expiração
   - Observações
   - Confirmar instalação

5. **MapearPontoModal.tsx** (novo)
   - Input de endereço
   - Seletor de comunidade
   - Captura de GPS
   - Upload de foto
   - Salvar e instalar

---

## 5. Rotas

```typescript
// Desktop
/dashboard → DashboardCoordenador (se coordenador)
/campanhas/:id → CampanhaDetailCoordenador (se coordenador)

// Mobile
/mobile/campanha/:id → CampanhaMobile
/mobile/campanha/:id/instalar/:instalacao_id → InstalarPontoModal
/mobile/campanha/:id/mapear → MapearPontoModal
```

---

## 6. Permissões e Lógica

### Dashboard

```typescript
// src/pages/Dashboard.tsx

const Dashboard = () => {
  const { user, hasRole } = useAuth();

  if (hasRole("coordenador")) {
    return <DashboardCoordenador />;
  }

  // Dashboard admin/operações (atual)
  return <DashboardAdmin />;
};
```

### Detalhes da Campanha

```typescript
// src/pages/CampaignDetail.tsx

const CampaignDetail = () => {
  const { hasRole } = useAuth();

  if (hasRole("coordenador")) {
    return <CampanhaDetailCoordenador />;
  }

  // Detalhes admin/operações (atual)
  return <CampanhaDetailAdmin />;
};
```

---

## 7. Fluxo de Instalação

### Atualizar Status (Ponto Existente)

```typescript
async function instalarPonto(instalacaoId: string, dados: {
  foto: File;
  data_instalacao: string;
  data_expiracao: string;
  observacoes?: string;
}) {
  // 1. Upload da foto
  const { data: fotoData } = await supabase.storage
    .from("instalacoes")
    .upload(`${instalacaoId}/${Date.now()}.jpg`, dados.foto);

  // 2. Atualizar instalação
  await supabase
    .from("instalacoes")
    .update({
      status: "ativa",
      data_instalacao: dados.data_instalacao,
      data_expiracao: dados.data_expiracao,
      foto_url: fotoData.path,
      observacoes: dados.observacoes,
    })
    .eq("id", instalacaoId);

  // 3. Atualizar status do endereço
  await supabase
    .from("enderecos")
    .update({ status: "ocupado" })
    .eq("id", endereco_id);
}
```

### Mapear Novo Ponto

```typescript
async function mapearNovoPonto(campanhaId: string, dados: {
  endereco: string;
  comunidade: string;
  cidade: string;
  uf: string;
  lat: number;
  long: number;
  foto: File;
  observacoes?: string;
}) {
  // 1. Criar endereço
  const { data: endereco } = await supabase
    .from("enderecos")
    .insert({
      endereco: dados.endereco,
      comunidade: dados.comunidade,
      cidade: dados.cidade,
      uf: dados.uf,
      lat: dados.lat,
      long: dados.long,
      status: "ocupado", // Já ocupado
    })
    .select()
    .single();

  // 2. Criar instalação
  const { data: instalacao } = await supabase
    .from("instalacoes")
    .insert({
      campanha_id: campanhaId,
      endereco_id: endereco.id,
      representante_id: user.id,
      status: "ativa", // Já instalado
      data_instalacao: new Date().toISOString(),
      data_expiracao: calcularExpiracao(30), // 30 dias
      observacoes: dados.observacoes,
    })
    .select()
    .single();

  // 3. Upload da foto
  await supabase.storage
    .from("instalacoes")
    .upload(`${instalacao.id}/${Date.now()}.jpg`, dados.foto);
}
```

---

## 8. Prioridade de Implementação

### Fase 1: Dashboard Coordenador (Desktop)
- [ ] Hook `useCoordenadorDashboard`
- [ ] Componente `DashboardCoordenador`
- [ ] Lógica de roteamento no Dashboard

### Fase 2: Visualização de Campanha (Desktop)
- [ ] Hook `useCampanhaCoordenador`
- [ ] Componente `CampanhaDetailCoordenador`
- [ ] Lógica de roteamento em CampaignDetail

### Fase 3: Operação Mobile (Futuro)
- [ ] Componente `CampanhaMobile`
- [ ] Modal `InstalarPontoModal`
- [ ] Modal `MapearPontoModal`
- [ ] Integração com câmera
- [ ] Integração com GPS

---

## Próximos Passos

1. Implementar Dashboard do Coordenador (Fase 1)
2. Implementar Visualização de Campanha (Fase 2)
3. Testar com usuário coordenador real
4. Planejar versão mobile (Fase 3)

---

## Perguntas para Validar

1. ✅ Dashboard mostra apenas campanhas do coordenador?
2. ✅ Coordenador não vê botão "Adicionar Pontos" do banco?
3. ✅ Coordenador pode mapear novos endereços em campo?
4. ✅ Foto é obrigatória na instalação?
5. ❓ Coordenador pode editar endereços existentes?
6. ❓ Coordenador pode remover instalações?
7. ❓ Prazo padrão de expiração é 30 dias?
