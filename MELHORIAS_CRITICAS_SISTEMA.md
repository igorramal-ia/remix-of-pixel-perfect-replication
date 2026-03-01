# 🚨 Melhorias Críticas do Sistema

## 📋 Problemas Identificados e Soluções

---

## 1. 🗺️ Geocoding Automático (Latitude/Longitude)

### Problema
Quando um novo endereço é cadastrado, latitude e longitude ficam vazias. Precisam ser preenchidas automaticamente para:
- Aparecer no mapa
- Aparecer no relatório
- Permitir análises geográficas

### Solução: Integração com Google Maps Geocoding API

#### 1.1. Configurar API Key

**No Google Cloud Console**:
1. Criar projeto (se não tiver)
2. Ativar APIs:
   - Geocoding API
   - Maps JavaScript API (para mapas)
3. Criar API Key
4. Restringir API Key (por domínio/IP)

**Adicionar ao `.env`**:
```env
VITE_GOOGLE_MAPS_API_KEY=sua-api-key-aqui
```

#### 1.2. Criar Serviço de Geocoding

**Arquivo**: `src/services/geocodingService.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
}

/**
 * Busca coordenadas de um endereço usando Google Geocoding API
 */
export async function geocodeEndereco(
  endereco: string,
  cidade: string,
  uf: string
): Promise<GeocodingResult | null> {
  try {
    // Montar endereço completo
    const enderecoCompleto = `${endereco}, ${cidade}, ${uf}, Brasil`;
    
    // Chamar API do Google
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(enderecoCompleto)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formatted_address: result.formatted_address,
      };
    }
    
    console.error('Geocoding falhou:', data.status);
    return null;
  } catch (error) {
    console.error('Erro ao fazer geocoding:', error);
    return null;
  }
}

/**
 * Atualiza latitude e longitude de um endereço no banco
 */
export async function atualizarCoordenadas(
  enderecoId: string,
  latitude: number,
  longitude: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('enderecos')
      .update({ latitude, longitude })
      .eq('id', enderecoId);
    
    if (error) {
      console.error('Erro ao atualizar coordenadas:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar coordenadas:', error);
    return false;
  }
}
```

#### 1.3. Atualizar Modal de Novo Endereço

**Arquivo**: `src/components/NovoEnderecoModal.tsx`

```typescript
import { geocodeEndereco, atualizarCoordenadas } from '@/services/geocodingService';

// Ao criar endereço
const handleSubmit = async (data) => {
  // 1. Criar endereço
  const { data: novoEndereco, error } = await supabase
    .from('enderecos')
    .insert({
      endereco: data.endereco,
      cidade: data.cidade,
      uf: data.uf,
      comunidade: data.comunidade,
      // latitude e longitude ficam null por enquanto
    })
    .select()
    .single();
  
  if (error) {
    toast.error('Erro ao criar endereço');
    return;
  }
  
  // 2. Buscar coordenadas (assíncrono, não bloqueia)
  geocodeEndereco(data.endereco, data.cidade, data.uf)
    .then((result) => {
      if (result) {
        atualizarCoordenadas(
          novoEndereco.id,
          result.latitude,
          result.longitude
        );
        toast.success('Coordenadas encontradas!');
      } else {
        toast.warning('Não foi possível encontrar coordenadas. Adicione manualmente.');
      }
    });
  
  toast.success('Endereço criado com sucesso!');
  onClose();
};
```

#### 1.4. Custo da API

**Google Geocoding API**:
- $5 por 1.000 requisições
- Primeiras 200 requisições/mês: GRÁTIS
- Depois: $0.005 por requisição

**Estimativa**:
- 100 endereços novos/mês = GRÁTIS
- 500 endereços novos/mês = $1.50
- 1000 endereços novos/mês = $4.00

---

## 2. 📍 Cadastrar Novo Endereço na Campanha

### Problema
Botão "Adicionar Pontos" está desabilitado na página de detalhes da campanha.

### Solução: Habilitar e Implementar

**Arquivo**: `src/pages/CampaignDetail.tsx`

```typescript
// Verificar se já existe o modal AdicionarPontosModal
import { AdicionarPontosModal } from '@/components/AdicionarPontosModal';

// No componente
const [isAdicionarPontosOpen, setIsAdicionarPontosOpen] = useState(false);

// No JSX
<Button onClick={() => setIsAdicionarPontosOpen(true)}>
  Adicionar Pontos
</Button>

<AdicionarPontosModal
  isOpen={isAdicionarPontosOpen}
  onClose={() => setIsAdicionarPontosOpen(false)}
  campanhaId={id}
/>
```

**Verificar se modal existe**:
- Se não existir, criar baseado em `NovoEnderecoModal`
- Permitir adicionar endereços existentes OU criar novos
- Criar instalação automaticamente (status: pendente)

---

## 3. 📄 Relatório de Mudança de Endereço

### Problema
Quando um endereço é substituído, não há relatório documentando a mudança.

### Solução: Gerar Relatório Automático

#### 3.1. Criar Tabela de Histórico

**Migration**: `supabase/migrations/20260226050000_create_historico_mudancas.sql`

```sql
CREATE TABLE historico_mudancas_endereco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instalacao_id UUID REFERENCES instalacoes(id) ON DELETE CASCADE,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  endereco_antigo_id UUID REFERENCES enderecos(id),
  endereco_novo_id UUID REFERENCES enderecos(id),
  motivo TEXT NOT NULL,
  data_mudanca TIMESTAMPTZ DEFAULT now(),
  realizado_por UUID REFERENCES auth.users(id),
  fotos_comprovacao TEXT[],
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE historico_mudancas_endereco ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e operações veem tudo"
ON historico_mudancas_endereco FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'operacoes')
  )
);

CREATE POLICY "Coordenadores veem seu território"
ON historico_mudancas_endereco FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN enderecos e ON e.id = historico_mudancas_endereco.endereco_novo_id
    WHERE p.id = auth.uid()
    AND p.role = 'coordenador'
    AND e.uf = ANY(p.territorios_uf)
  )
);
```

#### 3.2. Atualizar Modal de Substituição

**Arquivo**: `src/components/SubstituirEnderecoModal.tsx`

```typescript
// Adicionar campo de motivo
const [motivo, setMotivo] = useState('');

// Ao substituir
const handleSubstituir = async () => {
  // ... código existente ...
  
  // Registrar no histórico
  await supabase
    .from('historico_mudancas_endereco')
    .insert({
      instalacao_id: instalacaoId,
      campanha_id: campanhaId,
      endereco_antigo_id: enderecoAntigoId,
      endereco_novo_id: novoEnderecoId,
      motivo: motivo,
      realizado_por: user.id,
      fotos_comprovacao: fotosComprovacao, // se tiver
    });
  
  toast.success('Endereço substituído e registrado no histórico!');
};
```

#### 3.3. Página de Relatório de Mudanças

**Arquivo**: `src/pages/RelatorioMudancasPage.tsx`

```typescript
export function RelatorioMudancasPage() {
  const { data: mudancas } = useQuery({
    queryKey: ['historico-mudancas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('historico_mudancas_endereco')
        .select(`
          *,
          endereco_antigo:enderecos!endereco_antigo_id(*),
          endereco_novo:enderecos!endereco_novo_id(*),
          campanha:campanhas(*),
          realizado_por_profile:profiles!realizado_por(nome)
        `)
        .order('data_mudanca', { ascending: false });
      
      return data;
    },
  });
  
  return (
    <div>
      <h1>Relatório de Mudanças de Endereço</h1>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Campanha</TableHead>
            <TableHead>Endereço Antigo</TableHead>
            <TableHead>Endereço Novo</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Realizado Por</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mudancas?.map((mudanca) => (
            <TableRow key={mudanca.id}>
              <TableCell>{format(new Date(mudanca.data_mudanca), 'dd/MM/yyyy')}</TableCell>
              <TableCell>{mudanca.campanha.nome}</TableCell>
              <TableCell>{mudanca.endereco_antigo.endereco}</TableCell>
              <TableCell>{mudanca.endereco_novo.endereco}</TableCell>
              <TableCell>{mudanca.motivo}</TableCell>
              <TableCell>{mudanca.realizado_por_profile.nome}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## 4. 🗑️ Excluir Endereço

### Problema
Não há opção para excluir endereços.

### Solução: Adicionar Botão de Exclusão

**Considerações**:
- Só pode excluir se não tiver instalações ativas
- Soft delete (marcar como inativo) vs Hard delete (deletar do banco)
- Recomendação: Soft delete para manter histórico

#### 4.1. Adicionar Coluna `ativo`

**Migration**: `supabase/migrations/20260226050001_add_ativo_to_enderecos.sql`

```sql
-- Adicionar coluna ativo
ALTER TABLE enderecos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_enderecos_ativo ON enderecos(ativo);

-- Atualizar queries para filtrar apenas ativos
-- (fazer isso nos hooks do frontend)
```

#### 4.2. Hook de Exclusão

**Arquivo**: `src/hooks/useEnderecos.ts`

```typescript
export function useDeletarEndereco() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (enderecoId: string) => {
      // Verificar se tem instalações ativas
      const { data: instalacoes } = await supabase
        .from('instalacoes')
        .select('id')
        .eq('endereco_id', enderecoId)
        .eq('status', 'ativa');
      
      if (instalacoes && instalacoes.length > 0) {
        throw new Error('Não é possível excluir endereço com instalações ativas');
      }
      
      // Soft delete
      const { error } = await supabase
        .from('enderecos')
        .update({ ativo: false })
        .eq('id', enderecoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enderecos'] });
      toast.success('Endereço excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir endereço');
    },
  });
}
```

#### 4.3. Adicionar Botão na UI

**Arquivo**: `src/pages/Inventory.tsx` ou onde lista endereços

```typescript
const { mutate: deletar } = useDeletarEndereco();

<Button
  variant="destructive"
  size="sm"
  onClick={() => {
    if (confirm('Tem certeza que deseja excluir este endereço?')) {
      deletar(endereco.id);
    }
  }}
>
  Excluir
</Button>
```

---

## 5. 🔄 Atualização Automática (Cache/Reatividade)

### Problema
Após ações (atualizar status, criar, editar), precisa dar F5 para ver mudanças.

### Causa
React Query não está invalidando cache automaticamente.

### Solução: Invalidar Cache Corretamente

#### 5.1. Padrão Correto de Invalidação

**Em TODOS os hooks de mutação**:

```typescript
export function useAtualizarStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params) => {
      // ... fazer update ...
    },
    onSuccess: () => {
      // CRÍTICO: Invalidar TODAS as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['campanhas'] });
      queryClient.invalidateQueries({ queryKey: ['instalacoes'] });
      queryClient.invalidateQueries({ queryKey: ['enderecos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast.success('Atualizado com sucesso!');
    },
  });
}
```

#### 5.2. Verificar Hooks Existentes

**Arquivos para verificar**:
- `src/hooks/useInstalacoes.ts`
- `src/hooks/useCampaignsData.ts`
- `src/hooks/useDashboardData.ts`
- `src/hooks/useInventoryData.ts`

**Checklist**:
- [ ] `useAtivarInstalacao` invalida cache?
- [ ] `useFinalizarInstalacao` invalida cache?
- [ ] `useSubstituirEndereco` invalida cache?
- [ ] `useCreateCampanha` invalida cache?
- [ ] `useUpdateCampanha` invalida cache?

#### 5.3. Alternativa: Supabase Realtime

Para atualizações em tempo real (sem F5):

```typescript
// Exemplo: Escutar mudanças na tabela instalacoes
useEffect(() => {
  const channel = supabase
    .channel('instalacoes-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'instalacoes',
      },
      (payload) => {
        console.log('Mudança detectada:', payload);
        queryClient.invalidateQueries({ queryKey: ['instalacoes'] });
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## 6. 🗺️ Status no Mapa Geral

### Problema
Status do endereço (ocupado/disponível) não reflete no mapa geral do sistema.

### Solução: Atualizar Mapa com Status

#### 6.1. Lógica de Status

**Endereço está OCUPADO se**:
- Tem instalação ativa (status = 'ativa')

**Endereço está DISPONÍVEL se**:
- Não tem instalação ativa
- OU instalação finalizada há mais de 2 dias

#### 6.2. Query para Buscar Status

```typescript
// Buscar endereços com status de ocupação
const { data: enderecos } = await supabase
  .from('enderecos')
  .select(`
    *,
    instalacoes!inner (
      id,
      status,
      data_retirada_real,
      campanha:campanhas (nome)
    )
  `)
  .eq('ativo', true);

// Processar status
const enderecosComStatus = enderecos.map((endereco) => {
  const instalacaoAtiva = endereco.instalacoes.find(i => i.status === 'ativa');
  
  let status = 'disponivel';
  let cor = 'green';
  
  if (instalacaoAtiva) {
    status = 'ocupado';
    cor = 'red';
  } else {
    // Verificar se finalizada há menos de 2 dias
    const instalacaoRecente = endereco.instalacoes.find(i => {
      if (i.status === 'finalizada' && i.data_retirada_real) {
        const diasDesdeRetirada = differenceInDays(
          new Date(),
          new Date(i.data_retirada_real)
        );
        return diasDesdeRetirada < 2;
      }
      return false;
    });
    
    if (instalacaoRecente) {
      status = 'em_transicao';
      cor = 'yellow';
    }
  }
  
  return {
    ...endereco,
    status_ocupacao: status,
    cor_mapa: cor,
  };
});
```

#### 6.3. Atualizar Componente do Mapa

**Arquivo**: `src/components/MapaEnderecos.tsx` (ou similar)

```typescript
// Renderizar marcadores com cores
{enderecos.map((endereco) => (
  <Marker
    key={endereco.id}
    position={[endereco.latitude, endereco.longitude]}
    icon={getIconByCor(endereco.cor_mapa)}
  >
    <Popup>
      <div>
        <strong>{endereco.endereco}</strong>
        <p>Status: {endereco.status_ocupacao}</p>
        {endereco.instalacoes[0]?.campanha && (
          <p>Campanha: {endereco.instalacoes[0].campanha.nome}</p>
        )}
      </div>
    </Popup>
  </Marker>
))}
```

---

## 7. 🤖 Sugestão Inteligente de Endereços

### Problema
Ao criar campanha nova, sistema sugere endereços ocupados.

### Solução: Filtrar Apenas Disponíveis

#### 7.1. Lógica de Disponibilidade

**Endereço é SUGERÍVEL se**:
- Não tem instalação ativa
- OU instalação finalizada há mais de 2 dias
- E está no território do coordenador (se aplicável)

#### 7.2. Query de Sugestão

```typescript
export async function buscarEnderecosDisponiveis(
  uf?: string,
  cidade?: string,
  limite: number = 50
) {
  // Buscar endereços
  let query = supabase
    .from('enderecos')
    .select(`
      *,
      instalacoes (
        id,
        status,
        data_retirada_real
      )
    `)
    .eq('ativo', true);
  
  if (uf) query = query.eq('uf', uf);
  if (cidade) query = query.eq('cidade', cidade);
  
  const { data: enderecos } = await query;
  
  // Filtrar apenas disponíveis
  const disponiveis = enderecos?.filter((endereco) => {
    // Sem instalações = disponível
    if (!endereco.instalacoes || endereco.instalacoes.length === 0) {
      return true;
    }
    
    // Tem instalação ativa = NÃO disponível
    const temAtiva = endereco.instalacoes.some(i => i.status === 'ativa');
    if (temAtiva) return false;
    
    // Verificar se finalizada há mais de 2 dias
    const instalacaoRecente = endereco.instalacoes.find(i => {
      if (i.status === 'finalizada' && i.data_retirada_real) {
        const diasDesdeRetirada = differenceInDays(
          new Date(),
          new Date(i.data_retirada_real)
        );
        return diasDesdeRetirada < 2;
      }
      return false;
    });
    
    // Se tem instalação recente (< 2 dias), NÃO disponível
    return !instalacaoRecente;
  });
  
  return disponiveis?.slice(0, limite) || [];
}
```

#### 7.3. Usar na Criação de Campanha

**Arquivo**: `src/components/NovaCampanhaModal.tsx`

```typescript
// Ao buscar endereços para sugerir
const { data: enderecosDisponiveis } = useQuery({
  queryKey: ['enderecos-disponiveis', uf, cidade],
  queryFn: () => buscarEnderecosDisponiveis(uf, cidade),
  enabled: !!uf, // Só busca se tiver UF selecionada
});

// Mostrar apenas disponíveis
<Select>
  {enderecosDisponiveis?.map((endereco) => (
    <SelectItem key={endereco.id} value={endereco.id}>
      {endereco.endereco} - {endereco.comunidade}
      <Badge variant="success">Disponível</Badge>
    </SelectItem>
  ))}
</Select>
```

---

## 📋 Checklist de Implementação

### Prioridade ALTA (Fazer Agora)

- [ ] **Geocoding Automático**
  - [ ] Configurar Google Maps API Key
  - [ ] Criar `geocodingService.ts`
  - [ ] Atualizar `NovoEnderecoModal.tsx`
  - [ ] Testar com endereços reais

- [ ] **Atualização Automática (Cache)**
  - [ ] Revisar TODOS os hooks de mutação
  - [ ] Adicionar `queryClient.invalidateQueries()` em todos
  - [ ] Testar cada ação (criar, editar, deletar)
  - [ ] Verificar se atualiza sem F5

- [ ] **Status no Mapa**
  - [ ] Implementar lógica de status (ocupado/disponível)
  - [ ] Atualizar componente do mapa
  - [ ] Adicionar cores (vermelho/verde/amarelo)
  - [ ] Testar visualização

### Prioridade MÉDIA (Fazer Logo)

- [ ] **Sugestão Inteligente**
  - [ ] Criar função `buscarEnderecosDisponiveis()`
  - [ ] Atualizar modal de nova campanha
  - [ ] Filtrar apenas disponíveis
  - [ ] Mostrar badge de status

- [ ] **Habilitar Adicionar Pontos**
  - [ ] Verificar se modal existe
  - [ ] Habilitar botão
  - [ ] Testar adicionar endereços

- [ ] **Excluir Endereço**
  - [ ] Adicionar coluna `ativo`
  - [ ] Criar hook `useDeletarEndereco`
  - [ ] Adicionar botão na UI
  - [ ] Testar exclusão

### Prioridade BAIXA (Fazer Depois)

- [ ] **Relatório de Mudanças**
  - [ ] Criar tabela `historico_mudancas_endereco`
  - [ ] Atualizar modal de substituição
  - [ ] Criar página de relatório
  - [ ] Testar fluxo completo

---

## 💰 Custos Estimados

**Google Maps API**:
- Geocoding: $5/1000 requisições (200 grátis/mês)
- Maps JavaScript: $7/1000 carregamentos (28.000 grátis/mês)

**Estimativa mensal** (100 endereços novos + 1000 visualizações de mapa):
- Geocoding: GRÁTIS (dentro do limite)
- Maps: GRÁTIS (dentro do limite)
- **Total: $0/mês** 🎉

---

## 📁 Arquivos a Criar/Modificar

**Novos**:
- `src/services/geocodingService.ts`
- `src/pages/RelatorioMudancasPage.tsx`
- `supabase/migrations/20260226050000_create_historico_mudancas.sql`
- `supabase/migrations/20260226050001_add_ativo_to_enderecos.sql`

**Modificar**:
- `src/components/NovoEnderecoModal.tsx`
- `src/components/AdicionarPontosModal.tsx`
- `src/components/SubstituirEnderecoModal.tsx`
- `src/components/NovaCampanhaModal.tsx`
- `src/components/MapaEnderecos.tsx`
- `src/hooks/useInstalacoes.ts`
- `src/hooks/useEnderecos.ts`
- `src/hooks/useCampaignsData.ts`
- `.env` (adicionar VITE_GOOGLE_MAPS_API_KEY)

---

**Documento criado em**: 26/02/2026
**Status**: 📋 Planejamento completo - Pronto para implementar
