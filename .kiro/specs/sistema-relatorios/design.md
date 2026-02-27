# Design Técnico: Sistema de Geração de Relatórios

## Overview

Sistema para gerar relatórios profissionais de campanhas em formato PowerPoint (PPT), organizados hierarquicamente por Estado → Cidade → Comunidade. O sistema utiliza PptxGenJS para geração de slides, Supabase Storage para armazenamento de arquivos, e React Query para gerenciamento de estado assíncrono.

### Objetivos Principais

- Gerar relatórios em formato PPT editável
- Organizar dados hierarquicamente (Estado → Cidade → Comunidade → Endereço)
- Suportar dois tipos de relatório: Parcial (apenas instalações ativas) e Final (ativas + finalizadas)
- Armazenar histórico de relatórios gerados
- Permitir download posterior dos relatórios

### Tecnologias Utilizadas

- **PptxGenJS**: Biblioteca JavaScript para geração de apresentações PowerPoint
- **Supabase Storage**: Armazenamento de arquivos PPT gerados
- **React Query**: Gerenciamento de estado e cache de dados
- **TypeScript**: Tipagem estática e segurança de tipos
- **date-fns**: Manipulação e formatação de datas

## Architecture

### Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    CampaignDetail.tsx                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Botão "Gerar Relatório"                             │  │
│  └────────────────────┬─────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              GerarRelatorioModal.tsx                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - Seleção de tipo (Parcial/Final)                   │  │
│  │  - Input de número PI                                │  │
│  │  - Validação e submit                                │  │
│  └────────────────────┬─────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              useGerarRelatorio.ts                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Buscar dados da campanha                         │  │
│  │  2. Buscar instalações (filtradas por tipo)          │  │
│  │  3. Agrupar hierarquicamente                         │  │
│  │  4. Gerar PPT                                        │  │
│  │  5. Upload para Storage                              │  │
│  │  6. Salvar registro no histórico                     │  │
│  └────────────────────┬─────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PptxGenJS    │ │   Supabase   │ │   Supabase   │
│ (geração)    │ │   Storage    │ │   Database   │
└──────────────┘ └──────────────┘ └──────────────┘
```


### Fluxo de Dados

1. **Iniciação**: Usuário clica em "Gerar Relatório" na página de detalhes da campanha
2. **Configuração**: Modal solicita tipo de relatório e número PI
3. **Validação**: Sistema valida número PI (obrigatório)
4. **Busca de Dados**: Sistema busca dados da campanha e instalações
5. **Agrupamento**: Dados são agrupados hierarquicamente (Estado → Cidade → Comunidade)
6. **Geração**: PptxGenJS cria slides do PowerPoint
7. **Upload**: Arquivo é enviado para Supabase Storage
8. **Registro**: Metadados são salvos na tabela `relatorios_gerados`
9. **Download**: Arquivo é baixado automaticamente para o usuário

### Camadas da Aplicação

**Camada de Apresentação (UI)**
- `GerarRelatorioModal.tsx`: Modal de configuração
- `RelatoriosPage.tsx`: Página de histórico de relatórios
- `CampaignDetail.tsx`: Botão de geração

**Camada de Lógica de Negócio**
- `useGerarRelatorio.ts`: Hook principal de geração
- `useRelatorios.ts`: Hook para histórico
- `relatorioService.ts`: Serviço de geração de PPT
- `agrupamentoService.ts`: Serviço de agrupamento hierárquico

**Camada de Dados**
- Supabase Database: Armazenamento de metadados
- Supabase Storage: Armazenamento de arquivos PPT
- React Query: Cache e sincronização

## Components and Interfaces

### Componentes React

#### GerarRelatorioModal

Modal para configuração e geração de relatórios.

```typescript
interface GerarRelatorioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campanhaId: string;
  campanhaNome: string;
}

export function GerarRelatorioModal({
  open,
  onOpenChange,
  campanhaId,
  campanhaNome,
}: GerarRelatorioModalProps) {
  const [tipo, setTipo] = useState<'parcial' | 'final'>('parcial');
  const [numeroPI, setNumeroPI] = useState('');
  const gerarRelatorio = useGerarRelatorio();

  const handleGerar = async () => {
    if (!numeroPI.trim()) {
      toast.error('Número PI é obrigatório');
      return;
    }

    await gerarRelatorio.mutateAsync({
      campanhaId,
      tipo,
      numeroPI: numeroPI.trim(),
    });

    onOpenChange(false);
  };

  // ... render
}
```

**Responsabilidades**:
- Coletar tipo de relatório (Parcial/Final)
- Coletar número PI
- Validar entrada
- Disparar geração
- Mostrar loading durante processamento


#### RelatoriosPage

Página para visualizar histórico de relatórios gerados.

```typescript
export function RelatoriosPage() {
  const [filtros, setFiltros] = useState({
    campanhaId: '',
    tipo: '',
    dataInicio: '',
    dataFim: '',
  });

  const { data: relatorios, isLoading } = useRelatorios(filtros);
  const deletarRelatorio = useDeletarRelatorio();

  // ... render com tabela de relatórios
}
```

**Responsabilidades**:
- Listar relatórios gerados
- Filtrar por campanha, tipo, data
- Permitir download
- Permitir exclusão (apenas admins/operações)

### Hooks Customizados

#### useGerarRelatorio

Hook principal para geração de relatórios.

```typescript
interface GerarRelatorioParams {
  campanhaId: string;
  tipo: 'parcial' | 'final';
  numeroPI: string;
}

interface RelatorioGerado {
  id: string;
  campanha_id: string;
  tipo: 'parcial' | 'final';
  numero_pi: string;
  formato: 'ppt';
  url_arquivo: string;
  gerado_por: string;
  gerado_em: string;
  tamanho_bytes: number;
  nome_arquivo: string;
}

export function useGerarRelatorio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: GerarRelatorioParams) => {
      // 1. Buscar dados da campanha
      const campanha = await buscarDadosCampanha(params.campanhaId);

      // 2. Buscar instalações (filtradas por tipo)
      const instalacoes = await buscarInstalacoes(
        params.campanhaId,
        params.tipo
      );

      // 3. Agrupar hierarquicamente
      const dadosAgrupados = agruparHierarquicamente(instalacoes);

      // 4. Gerar PPT
      const pptBlob = await gerarPPT({
        campanha,
        dadosAgrupados,
        tipo: params.tipo,
        numeroPI: params.numeroPI,
      });

      // 5. Upload para Storage
      const nomeArquivo = gerarNomeArquivo(campanha, params.tipo);
      const urlArquivo = await uploadParaStorage(
        pptBlob,
        nomeArquivo,
        params.campanhaId
      );

      // 6. Salvar registro no histórico
      const relatorio = await salvarHistorico({
        campanha_id: params.campanhaId,
        tipo: params.tipo,
        numero_pi: params.numeroPI,
        url_arquivo: urlArquivo,
        nome_arquivo: nomeArquivo,
        tamanho_bytes: pptBlob.size,
        gerado_por: user!.id,
      });

      // 7. Download automático
      downloadBlob(pptBlob, nomeArquivo);

      return relatorio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relatorios'] });
      toast.success('Relatório gerado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório. Tente novamente.');
    },
  });
}
```


#### useRelatorios

Hook para buscar histórico de relatórios.

```typescript
interface FiltrosRelatorios {
  campanhaId?: string;
  tipo?: 'parcial' | 'final' | '';
  dataInicio?: string;
  dataFim?: string;
}

export function useRelatorios(filtros: FiltrosRelatorios) {
  return useQuery({
    queryKey: ['relatorios', filtros],
    queryFn: async () => {
      let query = supabase
        .from('relatorios_gerados')
        .select(`
          *,
          campanha:campanhas(nome, cliente),
          gerado_por_profile:profiles!relatorios_gerados_gerado_por_fkey(nome)
        `)
        .order('gerado_em', { ascending: false });

      if (filtros.campanhaId) {
        query = query.eq('campanha_id', filtros.campanhaId);
      }

      if (filtros.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }

      if (filtros.dataInicio) {
        query = query.gte('gerado_em', filtros.dataInicio);
      }

      if (filtros.dataFim) {
        query = query.lte('gerado_em', filtros.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as RelatorioGerado[];
    },
  });
}
```

#### useDeletarRelatorio

Hook para deletar relatório (apenas admins/operações).

```typescript
export function useDeletarRelatorio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (relatorioId: string) => {
      // 1. Buscar dados do relatório
      const { data: relatorio } = await supabase
        .from('relatorios_gerados')
        .select('url_arquivo, campanha_id')
        .eq('id', relatorioId)
        .single();

      if (!relatorio) throw new Error('Relatório não encontrado');

      // 2. Extrair path do arquivo
      const path = extrairPathDoStorage(relatorio.url_arquivo);

      // 3. Deletar arquivo do Storage
      await supabase.storage.from('relatorios').remove([path]);

      // 4. Deletar registro do banco
      await supabase
        .from('relatorios_gerados')
        .delete()
        .eq('id', relatorioId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relatorios'] });
      toast.success('Relatório deletado com sucesso');
    },
  });
}
```

### Serviços

#### relatorioService.ts

Serviço responsável pela geração do arquivo PPT.

```typescript
import PptxGenJS from 'pptxgenjs';

interface DadosRelatorio {
  campanha: CampaignDetail;
  dadosAgrupados: DadosAgrupados;
  tipo: 'parcial' | 'final';
  numeroPI: string;
}

export async function gerarPPT(dados: DadosRelatorio): Promise<Blob> {
  const pptx = new PptxGenJS();

  // Configurações globais
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Digital Favela';
  pptx.company = 'Digital Favela';
  pptx.title = `Relatório ${dados.tipo === 'parcial' ? 'Parcial' : 'Final'} - ${dados.campanha.nome}`;

  // 1. Slide de Capa
  adicionarSlideCapa(pptx, dados);

  // 2. Slide de Resumo Executivo
  adicionarSlideResumo(pptx, dados);

  // 3. Slides por Estado
  for (const estado of dados.dadosAgrupados.estados) {
    // Slide de cabeçalho do estado
    adicionarSlideEstado(pptx, estado);

    // Slides por cidade
    for (const cidade of estado.cidades) {
      // Slide de cabeçalho da cidade
      adicionarSlideCidade(pptx, cidade, estado.uf);

      // Slides por comunidade
      for (const comunidade of cidade.comunidades) {
        // Slide de cabeçalho da comunidade
        adicionarSlideComunidade(pptx, comunidade, cidade.nome);

        // Slides de endereços (1 endereço = 1 slide)
        for (const endereco of comunidade.enderecos) {
          await adicionarSlideEndereco(pptx, endereco, dados.tipo);
        }
      }
    }
  }

  // 4. Slide de Encerramento
  adicionarSlideEncerramento(pptx);

  // Gerar blob
  const blob = await pptx.write({ outputType: 'blob' });
  return blob as Blob;
}
```


#### agrupamentoService.ts

Serviço responsável pelo agrupamento hierárquico dos dados.

```typescript
interface Instalacao {
  id: string;
  endereco_id: string;
  endereco: string;
  comunidade: string;
  cidade: string;
  uf: string;
  status: string;
  data_instalacao: string;
  data_retirada_real?: string;
  fotos_placa: string[];
  fotos_retirada?: string[];
}

interface EnderecoAgrupado extends Instalacao {}

interface ComunidadeAgrupada {
  nome: string;
  enderecos: EnderecoAgrupado[];
  totalPontos: number;
}

interface CidadeAgrupada {
  nome: string;
  comunidades: ComunidadeAgrupada[];
  totalPontos: number;
  totalComunidades: number;
}

interface EstadoAgrupado {
  uf: string;
  nome: string;
  cidades: CidadeAgrupada[];
  totalPontos: number;
  totalCidades: number;
  totalComunidades: number;
}

interface DadosAgrupados {
  estados: EstadoAgrupado[];
  totalPontos: number;
  totalEstados: number;
  totalCidades: number;
  totalComunidades: number;
}

export function agruparHierarquicamente(
  instalacoes: Instalacao[]
): DadosAgrupados {
  // Ordenar instalações
  const instalacoesOrdenadas = [...instalacoes].sort((a, b) => {
    // 1. Por UF
    if (a.uf !== b.uf) return a.uf.localeCompare(b.uf);
    // 2. Por cidade
    if (a.cidade !== b.cidade) return a.cidade.localeCompare(b.cidade);
    // 3. Por comunidade
    if (a.comunidade !== b.comunidade) return a.comunidade.localeCompare(b.comunidade);
    // 4. Por endereço
    return a.endereco.localeCompare(b.endereco);
  });

  // Agrupar por estado
  const estadosMap = new Map<string, EstadoAgrupado>();

  for (const instalacao of instalacoesOrdenadas) {
    // Obter ou criar estado
    if (!estadosMap.has(instalacao.uf)) {
      estadosMap.set(instalacao.uf, {
        uf: instalacao.uf,
        nome: obterNomeEstado(instalacao.uf),
        cidades: [],
        totalPontos: 0,
        totalCidades: 0,
        totalComunidades: 0,
      });
    }
    const estado = estadosMap.get(instalacao.uf)!;

    // Obter ou criar cidade
    let cidade = estado.cidades.find((c) => c.nome === instalacao.cidade);
    if (!cidade) {
      cidade = {
        nome: instalacao.cidade,
        comunidades: [],
        totalPontos: 0,
        totalComunidades: 0,
      };
      estado.cidades.push(cidade);
    }

    // Obter ou criar comunidade
    let comunidade = cidade.comunidades.find(
      (c) => c.nome === instalacao.comunidade
    );
    if (!comunidade) {
      comunidade = {
        nome: instalacao.comunidade,
        enderecos: [],
        totalPontos: 0,
      };
      cidade.comunidades.push(comunidade);
    }

    // Adicionar endereço
    comunidade.enderecos.push(instalacao);
    comunidade.totalPontos++;
    cidade.totalPontos++;
    estado.totalPontos++;
  }

  // Calcular totais
  const estados = Array.from(estadosMap.values());
  for (const estado of estados) {
    estado.totalCidades = estado.cidades.length;
    estado.totalComunidades = estado.cidades.reduce(
      (sum, c) => sum + c.comunidades.length,
      0
    );
    for (const cidade of estado.cidades) {
      cidade.totalComunidades = cidade.comunidades.length;
    }
  }

  return {
    estados,
    totalPontos: instalacoes.length,
    totalEstados: estados.length,
    totalCidades: estados.reduce((sum, e) => sum + e.totalCidades, 0),
    totalComunidades: estados.reduce((sum, e) => sum + e.totalComunidades, 0),
  };
}

function obterNomeEstado(uf: string): string {
  const estados: Record<string, string> = {
    AC: 'Acre',
    AL: 'Alagoas',
    AP: 'Amapá',
    AM: 'Amazonas',
    BA: 'Bahia',
    CE: 'Ceará',
    DF: 'Distrito Federal',
    ES: 'Espírito Santo',
    GO: 'Goiás',
    MA: 'Maranhão',
    MT: 'Mato Grosso',
    MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais',
    PA: 'Pará',
    PB: 'Paraíba',
    PR: 'Paraná',
    PE: 'Pernambuco',
    PI: 'Piauí',
    RJ: 'Rio de Janeiro',
    RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul',
    RO: 'Rondônia',
    RR: 'Roraima',
    SC: 'Santa Catarina',
    SP: 'São Paulo',
    SE: 'Sergipe',
    TO: 'Tocantins',
  };
  return estados[uf] || uf;
}
```


## Data Models

### Tabela: relatorios_gerados

Armazena metadados dos relatórios gerados.

```sql
CREATE TABLE relatorios_gerados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('parcial', 'final')),
  numero_pi TEXT NOT NULL,
  formato TEXT NOT NULL DEFAULT 'ppt' CHECK (formato IN ('ppt')),
  url_arquivo TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tamanho_bytes BIGINT NOT NULL,
  gerado_por UUID NOT NULL REFERENCES auth.users(id),
  gerado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT relatorios_gerados_numero_pi_check CHECK (LENGTH(TRIM(numero_pi)) > 0)
);

-- Índices para performance
CREATE INDEX idx_relatorios_campanha ON relatorios_gerados(campanha_id);
CREATE INDEX idx_relatorios_tipo ON relatorios_gerados(tipo);
CREATE INDEX idx_relatorios_gerado_em ON relatorios_gerados(gerado_em DESC);
CREATE INDEX idx_relatorios_gerado_por ON relatorios_gerados(gerado_por);

-- RLS Policies
ALTER TABLE relatorios_gerados ENABLE ROW LEVEL SECURITY;

-- Administradores e operações podem ver todos
CREATE POLICY "Admins e operações podem ver todos os relatórios"
  ON relatorios_gerados FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'operacoes')
    )
  );

-- Coordenadores podem ver relatórios das suas campanhas
CREATE POLICY "Coordenadores podem ver relatórios das suas campanhas"
  ON relatorios_gerados FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campanha_coordenadores
      WHERE campanha_id = relatorios_gerados.campanha_id
      AND coordenador_id = auth.uid()
    )
  );

-- Todos podem inserir (será validado pela aplicação)
CREATE POLICY "Usuários autenticados podem gerar relatórios"
  ON relatorios_gerados FOR INSERT
  WITH CHECK (auth.uid() = gerado_por);

-- Apenas admins e operações podem deletar
CREATE POLICY "Admins e operações podem deletar relatórios"
  ON relatorios_gerados FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'operacoes')
    )
  );
```

### Supabase Storage: Bucket relatorios

Estrutura de armazenamento dos arquivos PPT.

```
relatorios/
├── {campanha_id}/
│   ├── parcial_PI{numero}_2026-02-26_143022.pptx
│   ├── parcial_PI{numero}_2026-02-27_091545.pptx
│   ├── final_PI{numero}_2026-03-15_160033.pptx
│   └── ...
└── ...
```

**Configuração do Bucket**:

```sql
-- Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('relatorios', 'relatorios', false);

-- Políticas de acesso
CREATE POLICY "Usuários autenticados podem fazer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'relatorios'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Usuários autenticados podem ler"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'relatorios'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admins e operações podem deletar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'relatorios'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'operacoes')
    )
  );
```

### Tipos TypeScript

```typescript
// Tipo de relatório
type TipoRelatorio = 'parcial' | 'final';

// Status de instalação
type StatusInstalacao = 'ativa' | 'finalizada';

// Metadados do relatório
interface RelatorioGerado {
  id: string;
  campanha_id: string;
  tipo: TipoRelatorio;
  numero_pi: string;
  formato: 'ppt';
  url_arquivo: string;
  nome_arquivo: string;
  tamanho_bytes: number;
  gerado_por: string;
  gerado_em: string;
  campanha?: {
    nome: string;
    cliente: string;
  };
  gerado_por_profile?: {
    nome: string;
  };
}

// Parâmetros de geração
interface GerarRelatorioParams {
  campanhaId: string;
  tipo: TipoRelatorio;
  numeroPI: string;
}

// Dados para geração do PPT
interface DadosRelatorio {
  campanha: CampaignDetail;
  dadosAgrupados: DadosAgrupados;
  tipo: TipoRelatorio;
  numeroPI: string;
}
```


## Estrutura Detalhada dos Slides

### Slide 1: Capa

```typescript
function adicionarSlideCapa(pptx: PptxGenJS, dados: DadosRelatorio) {
  const slide = pptx.addSlide();

  // Background
  slide.background = { color: '1E293B' }; // slate-800

  // Logo (se disponível)
  // slide.addImage({ path: 'logo.png', x: 0.5, y: 0.5, w: 2, h: 1 });

  // Título
  slide.addText('Relatório de Campanha', {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });

  // Tipo de relatório
  slide.addText(
    dados.tipo === 'parcial' ? 'Relatório Parcial' : 'Relatório Final',
    {
      x: 0.5,
      y: 3,
      w: 9,
      h: 0.5,
      fontSize: 24,
      color: 'CBD5E1', // slate-300
      align: 'center',
    }
  );

  // Nome da campanha
  slide.addText(dados.campanha.nome, {
    x: 0.5,
    y: 4,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });

  // Cliente
  slide.addText(`Cliente: ${dados.campanha.cliente}`, {
    x: 0.5,
    y: 4.7,
    w: 9,
    h: 0.4,
    fontSize: 18,
    color: 'CBD5E1',
    align: 'center',
  });

  // Número PI
  slide.addText(`PI: ${dados.numeroPI}`, {
    x: 0.5,
    y: 5.2,
    w: 9,
    h: 0.4,
    fontSize: 18,
    color: 'CBD5E1',
    align: 'center',
  });

  // Período
  const dataInicio = dados.campanha.data_inicio
    ? format(new Date(dados.campanha.data_inicio), 'dd/MM/yyyy')
    : '-';
  const dataFim = dados.campanha.data_fim
    ? format(new Date(dados.campanha.data_fim), 'dd/MM/yyyy')
    : '-';

  slide.addText(`Período: ${dataInicio} até ${dataFim}`, {
    x: 0.5,
    y: 5.7,
    w: 9,
    h: 0.4,
    fontSize: 16,
    color: '94A3B8', // slate-400
    align: 'center',
  });

  // Data de geração
  slide.addText(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, {
    x: 0.5,
    y: 6.2,
    w: 9,
    h: 0.3,
    fontSize: 14,
    color: '64748B', // slate-500
    align: 'center',
  });
}
```

### Slide 2: Resumo Executivo

```typescript
function adicionarSlideResumo(pptx: PptxGenJS, dados: DadosRelatorio) {
  const slide = pptx.addSlide();

  // Título
  slide.addText('Resumo Executivo', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: '1E293B',
  });

  // Estatísticas principais
  const stats = [
    {
      label: 'Total de Pontos',
      value: dados.dadosAgrupados.totalPontos.toString(),
    },
    {
      label: 'Estados',
      value: dados.dadosAgrupados.totalEstados.toString(),
    },
    {
      label: 'Cidades',
      value: dados.dadosAgrupados.totalCidades.toString(),
    },
    {
      label: 'Comunidades',
      value: dados.dadosAgrupados.totalComunidades.toString(),
    },
  ];

  // Grid de estatísticas (2x2)
  const startX = 0.5;
  const startY = 1.5;
  const boxW = 4.25;
  const boxH = 1.5;
  const gap = 0.5;

  stats.forEach((stat, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = startX + col * (boxW + gap);
    const y = startY + row * (boxH + gap);

    // Box
    slide.addShape('rect', {
      x,
      y,
      w: boxW,
      h: boxH,
      fill: { color: 'F1F5F9' }, // slate-100
      line: { color: 'CBD5E1', width: 1 },
    });

    // Valor
    slide.addText(stat.value, {
      x,
      y: y + 0.3,
      w: boxW,
      h: 0.6,
      fontSize: 36,
      bold: true,
      color: '0F172A', // slate-900
      align: 'center',
    });

    // Label
    slide.addText(stat.label, {
      x,
      y: y + 0.9,
      w: boxW,
      h: 0.4,
      fontSize: 16,
      color: '475569', // slate-600
      align: 'center',
    });
  });

  // Distribuição por estado (tabela)
  slide.addText('Distribuição por Estado', {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: '1E293B',
  });

  const tableData = [
    [
      { text: 'Estado', options: { bold: true, fill: 'E2E8F0' } },
      { text: 'Cidades', options: { bold: true, fill: 'E2E8F0' } },
      { text: 'Comunidades', options: { bold: true, fill: 'E2E8F0' } },
      { text: 'Pontos', options: { bold: true, fill: 'E2E8F0' } },
    ],
  ];

  dados.dadosAgrupados.estados.forEach((estado) => {
    tableData.push([
      `${estado.nome} (${estado.uf})`,
      estado.totalCidades.toString(),
      estado.totalComunidades.toString(),
      estado.totalPontos.toString(),
    ]);
  });

  slide.addTable(tableData, {
    x: 0.5,
    y: 5.1,
    w: 9,
    h: 1.5,
    fontSize: 14,
    border: { pt: 1, color: 'CBD5E1' },
    align: 'center',
  });
}
```


### Slides de Hierarquia

#### Slide de Estado

```typescript
function adicionarSlideEstado(pptx: PptxGenJS, estado: EstadoAgrupado) {
  const slide = pptx.addSlide();

  // Background com cor de destaque
  slide.background = { color: 'F8FAFC' }; // slate-50

  // Título do estado
  slide.addText(`${estado.nome} (${estado.uf})`, {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1,
    fontSize: 40,
    bold: true,
    color: '0F172A',
    align: 'center',
  });

  // Estatísticas do estado
  slide.addText(
    `${estado.totalPontos} pontos • ${estado.totalCidades} cidades • ${estado.totalComunidades} comunidades`,
    {
      x: 0.5,
      y: 3.2,
      w: 9,
      h: 0.5,
      fontSize: 18,
      color: '475569',
      align: 'center',
    }
  );
}
```

#### Slide de Cidade

```typescript
function adicionarSlideCidade(
  pptx: PptxGenJS,
  cidade: CidadeAgrupada,
  uf: string
) {
  const slide = pptx.addSlide();

  // Breadcrumb
  slide.addText(`${uf}`, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.3,
    fontSize: 14,
    color: '64748B',
  });

  // Título da cidade
  slide.addText(cidade.nome, {
    x: 0.5,
    y: 2,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: '1E293B',
    align: 'center',
  });

  // Estatísticas
  slide.addText(
    `${cidade.totalPontos} pontos • ${cidade.totalComunidades} comunidades`,
    {
      x: 0.5,
      y: 3,
      w: 9,
      h: 0.4,
      fontSize: 16,
      color: '475569',
      align: 'center',
    }
  );
}
```

#### Slide de Comunidade

```typescript
function adicionarSlideComunidade(
  pptx: PptxGenJS,
  comunidade: ComunidadeAgrupada,
  cidade: string
) {
  const slide = pptx.addSlide();

  // Breadcrumb
  slide.addText(cidade, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.3,
    fontSize: 14,
    color: '64748B',
  });

  // Título da comunidade
  slide.addText(comunidade.nome, {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 0.7,
    fontSize: 32,
    bold: true,
    color: '1E293B',
    align: 'center',
  });

  // Total de pontos
  slide.addText(`${comunidade.totalPontos} pontos`, {
    x: 0.5,
    y: 3.3,
    w: 9,
    h: 0.4,
    fontSize: 16,
    color: '475569',
    align: 'center',
  });
}
```

### Slide de Endereço (CRÍTICO: 1 endereço = 1 slide)

```typescript
async function adicionarSlideEndereco(
  pptx: PptxGenJS,
  endereco: EnderecoAgrupado,
  tipo: TipoRelatorio
) {
  const slide = pptx.addSlide();

  // ===== TOPO: ENDEREÇO EM DESTAQUE =====
  slide.addText(endereco.endereco, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: '0F172A',
    align: 'left',
  });

  slide.addText(`${endereco.comunidade} • ${endereco.cidade} - ${endereco.uf}`, {
    x: 0.5,
    y: 0.85,
    w: 9,
    h: 0.3,
    fontSize: 14,
    color: '64748B',
    align: 'left',
  });

  // Linha separadora
  slide.addShape('line', {
    x: 0.5,
    y: 1.3,
    w: 9,
    h: 0,
    line: { color: 'CBD5E1', width: 2 },
  });

  // ===== INFORMAÇÕES =====
  let currentY = 1.5;

  // Status
  const statusColor = endereco.status === 'ativa' ? '22C55E' : '9CA3AF';
  const statusLabel = endereco.status === 'ativa' ? 'Ativa' : 'Finalizada';

  slide.addText(`Status: ${statusLabel}`, {
    x: 0.5,
    y: currentY,
    w: 4,
    h: 0.3,
    fontSize: 14,
    color: statusColor,
    bold: true,
  });

  currentY += 0.4;

  // Data de instalação
  const dataInstalacao = format(
    new Date(endereco.data_instalacao),
    'dd/MM/yyyy'
  );
  slide.addText(`Data de Instalação: ${dataInstalacao}`, {
    x: 0.5,
    y: currentY,
    w: 4,
    h: 0.3,
    fontSize: 12,
    color: '475569',
  });

  currentY += 0.4;

  // Data de retirada (se finalizada)
  if (tipo === 'final' && endereco.data_retirada_real) {
    const dataRetirada = format(
      new Date(endereco.data_retirada_real),
      'dd/MM/yyyy'
    );
    slide.addText(`Data de Retirada: ${dataRetirada}`, {
      x: 0.5,
      y: currentY,
      w: 4,
      h: 0.3,
      fontSize: 12,
      color: '475569',
    });
    currentY += 0.4;
  }

  currentY += 0.3;

  // ===== FOTOS DA PLACA =====
  slide.addText('Fotos da Instalação:', {
    x: 0.5,
    y: currentY,
    w: 9,
    h: 0.3,
    fontSize: 14,
    bold: true,
    color: '1E293B',
  });

  currentY += 0.4;

  // Adicionar até 4 fotos da placa
  const fotosPlaca = endereco.fotos_placa.slice(0, 4);
  await adicionarGridFotos(slide, fotosPlaca, 0.5, currentY, 9, 2.5);

  currentY += 2.8;

  // ===== FOTOS DA RETIRADA (apenas relatório final) =====
  if (tipo === 'final' && endereco.fotos_retirada && endereco.fotos_retirada.length > 0) {
    slide.addText('Fotos da Retirada:', {
      x: 0.5,
      y: currentY,
      w: 9,
      h: 0.3,
      fontSize: 14,
      bold: true,
      color: '1E293B',
    });

    currentY += 0.4;

    const fotosRetirada = endereco.fotos_retirada.slice(0, 4);
    await adicionarGridFotos(slide, fotosRetirada, 0.5, currentY, 9, 2);
  }
}

// Helper para adicionar grid de fotos
async function adicionarGridFotos(
  slide: any,
  urls: string[],
  x: number,
  y: number,
  totalWidth: number,
  totalHeight: number
) {
  const numFotos = urls.length;
  if (numFotos === 0) return;

  // Calcular layout (2 colunas)
  const cols = 2;
  const rows = Math.ceil(numFotos / cols);
  const gap = 0.2;
  const fotoW = (totalWidth - gap * (cols - 1)) / cols;
  const fotoH = (totalHeight - gap * (rows - 1)) / rows;

  for (let i = 0; i < numFotos; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const fotoX = x + col * (fotoW + gap);
    const fotoY = y + row * (fotoH + gap);

    try {
      // Baixar imagem e adicionar ao slide
      const imageData = await fetch(urls[i]).then((r) => r.blob());
      const imageUrl = URL.createObjectURL(imageData);

      slide.addImage({
        data: imageUrl,
        x: fotoX,
        y: fotoY,
        w: fotoW,
        h: fotoH,
        sizing: { type: 'cover', w: fotoW, h: fotoH },
      });
    } catch (error) {
      console.error(`Erro ao adicionar foto ${urls[i]}:`, error);
      // Adicionar placeholder em caso de erro
      slide.addShape('rect', {
        x: fotoX,
        y: fotoY,
        w: fotoW,
        h: fotoH,
        fill: { color: 'E2E8F0' },
        line: { color: 'CBD5E1', width: 1 },
      });
      slide.addText('Erro ao carregar imagem', {
        x: fotoX,
        y: fotoY + fotoH / 2 - 0.15,
        w: fotoW,
        h: 0.3,
        fontSize: 10,
        color: '64748B',
        align: 'center',
      });
    }
  }
}
```


### Slide de Encerramento

```typescript
function adicionarSlideEncerramento(pptx: PptxGenJS) {
  const slide = pptx.addSlide();

  // Background
  slide.background = { color: '1E293B' };

  // Agradecimento
  slide.addText('Obrigado!', {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 0.8,
    fontSize: 40,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });

  // Contato
  slide.addText('Digital Favela', {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.4,
    fontSize: 20,
    color: 'CBD5E1',
    align: 'center',
  });

  slide.addText('contato@digitalfavela.com.br', {
    x: 0.5,
    y: 4,
    w: 9,
    h: 0.3,
    fontSize: 16,
    color: '94A3B8',
    align: 'center',
  });
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Validação de Número PI

*For any* tentativa de gerar relatório sem número PI ou com número PI vazio (apenas espaços), o sistema deve rejeitar a operação e retornar erro de validação.

**Validates: Requirements 2**

### Property 2: Filtro de Instalações por Tipo - Parcial

*For any* campanha com instalações de múltiplos status, quando um relatório parcial é gerado, o conjunto de instalações incluídas deve conter apenas instalações com status "ativa".

**Validates: Requirements 3**

### Property 3: Filtro de Instalações por Tipo - Final

*For any* campanha com instalações de múltiplos status, quando um relatório final é gerado, o conjunto de instalações incluídas deve conter apenas instalações com status "ativa" ou "finalizada" (excluindo pendentes e canceladas).

**Validates: Requirements 4**

### Property 4: Agrupamento Hierárquico Correto

*For any* conjunto de instalações, após o agrupamento hierárquico, todos os endereços devem estar organizados corretamente por Estado → Cidade → Comunidade, e a soma dos pontos em cada nível deve corresponder ao total de instalações.

**Validates: Requirements 5**

### Property 5: Um Endereço Por Slide

*For any* relatório gerado, o número de slides de endereços deve ser igual ao número de endereços incluídos no relatório (1 endereço = 1 slide).

**Validates: Requirements 6**

### Property 6: Endereço no Topo do Slide

*For any* slide de endereço gerado, o endereço completo da placa deve aparecer na primeira seção do slide (topo), antes de qualquer outra informação.

**Validates: Requirements 7**

### Property 7: Fotos da Placa Presentes

*For any* instalação incluída no relatório, se a instalação possui fotos_placa, então o slide correspondente deve conter essas fotos (até 4 fotos).

**Validates: Requirements 8**

### Property 8: Fotos de Retirada Apenas em Relatório Final

*For any* relatório parcial gerado, nenhum slide deve conter fotos de retirada. Para qualquer relatório final, instalações finalizadas devem ter fotos de retirada no slide correspondente.

**Validates: Requirements 9**

### Property 9: Data de Instalação Sempre Presente

*For any* slide de endereço, a data de instalação deve estar presente e formatada corretamente (dd/MM/yyyy).

**Validates: Requirements 10**

### Property 10: Data de Retirada Quando Finalizada

*For any* instalação finalizada em um relatório final, o slide correspondente deve conter a data de retirada real formatada corretamente.

**Validates: Requirements 11**

### Property 11: Registro no Histórico

*For any* relatório gerado com sucesso, deve existir um registro correspondente na tabela relatorios_gerados com todos os campos obrigatórios preenchidos (campanha_id, tipo, numero_pi, url_arquivo, nome_arquivo, tamanho_bytes, gerado_por, gerado_em).

**Validates: Requirements 13**

### Property 12: Filtros de Histórico

*For any* conjunto de relatórios e qualquer combinação de filtros (campanha, tipo, data), os resultados retornados devem corresponder exatamente aos critérios especificados nos filtros.

**Validates: Requirements 15**


## Error Handling

### Validações de Entrada

**Número PI**:
```typescript
function validarNumeroPI(numeroPI: string): void {
  if (!numeroPI || numeroPI.trim().length === 0) {
    throw new Error('Número PI é obrigatório');
  }
}
```

**Campanha Válida**:
```typescript
async function validarCampanha(campanhaId: string): Promise<void> {
  const { data: campanha } = await supabase
    .from('campanhas')
    .select('id')
    .eq('id', campanhaId)
    .single();

  if (!campanha) {
    throw new Error('Campanha não encontrada');
  }
}
```

**Instalações Disponíveis**:
```typescript
async function validarInstalacoes(
  campanhaId: string,
  tipo: TipoRelatorio
): Promise<void> {
  const statusPermitidos = tipo === 'parcial' 
    ? ['ativa'] 
    : ['ativa', 'finalizada'];

  const { count } = await supabase
    .from('instalacoes')
    .select('*', { count: 'exact', head: true })
    .eq('campanha_id', campanhaId)
    .in('status', statusPermitidos);

  if (!count || count === 0) {
    throw new Error(
      `Nenhuma instalação ${tipo === 'parcial' ? 'ativa' : 'ativa ou finalizada'} encontrada para esta campanha`
    );
  }
}
```

### Tratamento de Erros na Geração

```typescript
export function useGerarRelatorio() {
  return useMutation({
    mutationFn: async (params: GerarRelatorioParams) => {
      try {
        // Validações
        validarNumeroPI(params.numeroPI);
        await validarCampanha(params.campanhaId);
        await validarInstalacoes(params.campanhaId, params.tipo);

        // Geração
        // ... código de geração

      } catch (error) {
        // Log detalhado
        console.error('Erro ao gerar relatório:', {
          error,
          params,
          timestamp: new Date().toISOString(),
        });

        // Re-throw com mensagem amigável
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Erro desconhecido ao gerar relatório');
      }
    },
    onError: (error) => {
      // Mensagens específicas por tipo de erro
      if (error.message.includes('PI')) {
        toast.error('Número PI é obrigatório');
      } else if (error.message.includes('Campanha')) {
        toast.error('Campanha não encontrada');
      } else if (error.message.includes('instalação')) {
        toast.error(error.message);
      } else if (error.message.includes('Storage')) {
        toast.error('Erro ao salvar arquivo. Tente novamente.');
      } else {
        toast.error('Erro ao gerar relatório. Tente novamente.');
      }
    },
  });
}
```

### Tratamento de Erros no Upload

```typescript
async function uploadParaStorage(
  blob: Blob,
  nomeArquivo: string,
  campanhaId: string
): Promise<string> {
  const path = `${campanhaId}/${nomeArquivo}`;

  try {
    const { data, error } = await supabase.storage
      .from('relatorios')
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Erro no upload:', error);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('relatorios')
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload para storage:', error);
    throw new Error('Erro ao salvar arquivo no servidor');
  }
}
```

### Tratamento de Erros ao Carregar Imagens

```typescript
async function adicionarImagemComFallback(
  slide: any,
  url: string,
  x: number,
  y: number,
  w: number,
  h: number
): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    slide.addImage({
      data: imageUrl,
      x,
      y,
      w,
      h,
      sizing: { type: 'cover', w, h },
    });
  } catch (error) {
    console.error(`Erro ao carregar imagem ${url}:`, error);

    // Adicionar placeholder
    slide.addShape('rect', {
      x,
      y,
      w,
      h,
      fill: { color: 'E2E8F0' },
      line: { color: 'CBD5E1', width: 1 },
    });

    slide.addText('Imagem não disponível', {
      x,
      y: y + h / 2 - 0.15,
      w,
      h: 0.3,
      fontSize: 10,
      color: '64748B',
      align: 'center',
    });
  }
}
```

### Rollback em Caso de Erro

```typescript
async function gerarRelatorioComRollback(
  params: GerarRelatorioParams
): Promise<RelatorioGerado> {
  let uploadPath: string | null = null;
  let registroId: string | null = null;

  try {
    // Gerar PPT
    const blob = await gerarPPT(/* ... */);

    // Upload
    const nomeArquivo = gerarNomeArquivo(/* ... */);
    uploadPath = `${params.campanhaId}/${nomeArquivo}`;
    const url = await uploadParaStorage(blob, nomeArquivo, params.campanhaId);

    // Salvar registro
    const { data: registro, error } = await supabase
      .from('relatorios_gerados')
      .insert({
        campanha_id: params.campanhaId,
        tipo: params.tipo,
        numero_pi: params.numeroPI,
        url_arquivo: url,
        nome_arquivo: nomeArquivo,
        tamanho_bytes: blob.size,
        gerado_por: user!.id,
      })
      .select()
      .single();

    if (error) throw error;
    registroId = registro.id;

    return registro;
  } catch (error) {
    // Rollback: deletar arquivo se foi feito upload
    if (uploadPath) {
      try {
        await supabase.storage.from('relatorios').remove([uploadPath]);
      } catch (rollbackError) {
        console.error('Erro no rollback do storage:', rollbackError);
      }
    }

    // Rollback: deletar registro se foi criado
    if (registroId) {
      try {
        await supabase
          .from('relatorios_gerados')
          .delete()
          .eq('id', registroId);
      } catch (rollbackError) {
        console.error('Erro no rollback do registro:', rollbackError);
      }
    }

    throw error;
  }
}
```


## Testing Strategy

### Abordagem Dual de Testes

O sistema de relatórios requer uma combinação de testes unitários e testes baseados em propriedades para garantir correção completa:

**Testes Unitários**: Validam exemplos específicos, casos extremos e condições de erro
**Testes de Propriedades**: Verificam propriedades universais através de múltiplas entradas geradas

### Biblioteca de Property-Based Testing

**JavaScript/TypeScript**: fast-check

```bash
npm install --save-dev fast-check @types/fast-check
```

### Configuração de Testes de Propriedades

Cada teste de propriedade deve:
- Executar no mínimo 100 iterações
- Incluir tag de referência ao design
- Formato da tag: `Feature: sistema-relatorios, Property {número}: {texto}`

### Testes Unitários

#### Validações

```typescript
describe('Validações de Entrada', () => {
  it('deve rejeitar número PI vazio', () => {
    expect(() => validarNumeroPI('')).toThrow('Número PI é obrigatório');
  });

  it('deve rejeitar número PI apenas com espaços', () => {
    expect(() => validarNumeroPI('   ')).toThrow('Número PI é obrigatório');
  });

  it('deve aceitar número PI válido', () => {
    expect(() => validarNumeroPI('PI-12345')).not.toThrow();
  });
});
```

#### Agrupamento Hierárquico

```typescript
describe('Agrupamento Hierárquico', () => {
  it('deve agrupar instalações por estado', () => {
    const instalacoes = [
      { uf: 'SP', cidade: 'São Paulo', comunidade: 'Brasilândia', /* ... */ },
      { uf: 'RJ', cidade: 'Rio de Janeiro', comunidade: 'Rocinha', /* ... */ },
      { uf: 'SP', cidade: 'Campinas', comunidade: 'Jardim', /* ... */ },
    ];

    const resultado = agruparHierarquicamente(instalacoes);

    expect(resultado.estados).toHaveLength(2);
    expect(resultado.estados[0].uf).toBe('RJ');
    expect(resultado.estados[1].uf).toBe('SP');
  });

  it('deve ordenar estados alfabeticamente', () => {
    const instalacoes = [
      { uf: 'SP', /* ... */ },
      { uf: 'BA', /* ... */ },
      { uf: 'RJ', /* ... */ },
    ];

    const resultado = agruparHierarquicamente(instalacoes);

    expect(resultado.estados.map(e => e.uf)).toEqual(['BA', 'RJ', 'SP']);
  });
});
```

#### Geração de Nome de Arquivo

```typescript
describe('Geração de Nome de Arquivo', () => {
  it('deve gerar nome correto para relatório parcial', () => {
    const campanha = { nome: 'Campanha Teste' };
    const tipo = 'parcial';
    const numeroPI = 'PI-12345';

    const nome = gerarNomeArquivo(campanha, tipo, numeroPI);

    expect(nome).toMatch(/^parcial_PI-12345_\d{4}-\d{2}-\d{2}_\d{6}\.pptx$/);
  });

  it('deve gerar nome correto para relatório final', () => {
    const campanha = { nome: 'Campanha Teste' };
    const tipo = 'final';
    const numeroPI = 'PI-67890';

    const nome = gerarNomeArquivo(campanha, tipo, numeroPI);

    expect(nome).toMatch(/^final_PI-67890_\d{4}-\d{2}-\d{2}_\d{6}\.pptx$/);
  });
});
```

### Testes de Propriedades

#### Property 1: Validação de Número PI

```typescript
import fc from 'fast-check';

describe('Property Tests - Validação', () => {
  it('Feature: sistema-relatorios, Property 1: For any tentativa de gerar relatório sem número PI ou com número PI vazio, o sistema deve rejeitar', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length === 0),
        (numeroPI) => {
          expect(() => validarNumeroPI(numeroPI)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property 2: Filtro de Instalações - Parcial

```typescript
describe('Property Tests - Filtros', () => {
  it('Feature: sistema-relatorios, Property 2: For any campanha, relatório parcial deve conter apenas instalações ativas', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            status: fc.constantFrom('ativa', 'pendente', 'finalizada', 'cancelada'),
            endereco: fc.string(),
            // ... outros campos
          })
        ),
        (instalacoes) => {
          const filtradas = filtrarInstalacoesPorTipo(instalacoes, 'parcial');
          
          expect(filtradas.every(i => i.status === 'ativa')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property 3: Filtro de Instalações - Final

```typescript
it('Feature: sistema-relatorios, Property 3: For any campanha, relatório final deve conter apenas instalações ativas ou finalizadas', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          id: fc.uuid(),
          status: fc.constantFrom('ativa', 'pendente', 'finalizada', 'cancelada'),
          endereco: fc.string(),
          // ... outros campos
        })
      ),
      (instalacoes) => {
        const filtradas = filtrarInstalacoesPorTipo(instalacoes, 'final');
        
        expect(
          filtradas.every(i => i.status === 'ativa' || i.status === 'finalizada')
        ).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 4: Agrupamento Hierárquico

```typescript
it('Feature: sistema-relatorios, Property 4: For any conjunto de instalações, agrupamento deve preservar total de pontos', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          id: fc.uuid(),
          uf: fc.constantFrom('SP', 'RJ', 'MG', 'BA'),
          cidade: fc.string({ minLength: 3, maxLength: 20 }),
          comunidade: fc.string({ minLength: 3, maxLength: 20 }),
          endereco: fc.string({ minLength: 10, maxLength: 50 }),
          status: fc.constant('ativa'),
        }),
        { minLength: 1, maxLength: 50 }
      ),
      (instalacoes) => {
        const agrupado = agruparHierarquicamente(instalacoes);
        
        // Total de pontos deve ser preservado
        expect(agrupado.totalPontos).toBe(instalacoes.length);
        
        // Soma dos pontos por estado deve ser igual ao total
        const somaEstados = agrupado.estados.reduce(
          (sum, e) => sum + e.totalPontos,
          0
        );
        expect(somaEstados).toBe(instalacoes.length);
        
        // Cada instalação deve estar em exatamente um lugar
        const todosEnderecos = agrupado.estados.flatMap(e =>
          e.cidades.flatMap(c =>
            c.comunidades.flatMap(com => com.enderecos)
          )
        );
        expect(todosEnderecos).toHaveLength(instalacoes.length);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 5: Um Endereço Por Slide

```typescript
it('Feature: sistema-relatorios, Property 5: For any relatório, número de slides de endereços deve ser igual ao número de endereços', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          id: fc.uuid(),
          endereco: fc.string(),
          fotos_placa: fc.array(fc.webUrl(), { minLength: 2, maxLength: 5 }),
          // ... outros campos
        }),
        { minLength: 1, maxLength: 20 }
      ),
      async (enderecos) => {
        const slides = await gerarSlidesEnderecos(enderecos, 'parcial');
        
        expect(slides.length).toBe(enderecos.length);
      }
    ),
    { numRuns: 100 }
  );
});
```


#### Property 6: Endereço no Topo do Slide

```typescript
it('Feature: sistema-relatorios, Property 6: For any slide de endereço, endereço deve aparecer no topo', () => {
  fc.assert(
    fc.property(
      fc.record({
        endereco: fc.string({ minLength: 10 }),
        comunidade: fc.string(),
        cidade: fc.string(),
        uf: fc.constantFrom('SP', 'RJ', 'MG'),
        // ... outros campos
      }),
      async (endereco) => {
        const slide = await gerarSlideEndereco(endereco, 'parcial');
        
        // Verificar que o primeiro elemento de texto contém o endereço
        const primeiroTexto = slide.elementos[0];
        expect(primeiroTexto.tipo).toBe('texto');
        expect(primeiroTexto.conteudo).toContain(endereco.endereco);
        expect(primeiroTexto.y).toBeLessThan(1); // Topo do slide
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 7: Fotos da Placa Presentes

```typescript
it('Feature: sistema-relatorios, Property 7: For any instalação com fotos_placa, slide deve conter essas fotos', () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.uuid(),
        endereco: fc.string(),
        fotos_placa: fc.array(fc.webUrl(), { minLength: 2, maxLength: 5 }),
        status: fc.constant('ativa'),
        data_instalacao: fc.date().map(d => d.toISOString()),
      }),
      async (instalacao) => {
        const slide = await gerarSlideEndereco(instalacao, 'parcial');
        
        // Contar imagens no slide
        const imagens = slide.elementos.filter(e => e.tipo === 'imagem');
        const numFotosEsperadas = Math.min(instalacao.fotos_placa.length, 4);
        
        expect(imagens.length).toBeGreaterThanOrEqual(numFotosEsperadas);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 8: Fotos de Retirada Apenas em Relatório Final

```typescript
it('Feature: sistema-relatorios, Property 8: For any relatório parcial, não deve conter fotos de retirada', () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.uuid(),
        endereco: fc.string(),
        fotos_placa: fc.array(fc.webUrl(), { minLength: 2 }),
        fotos_retirada: fc.array(fc.webUrl(), { minLength: 2 }),
        status: fc.constant('ativa'),
        data_instalacao: fc.date().map(d => d.toISOString()),
      }),
      async (instalacao) => {
        const slide = await gerarSlideEndereco(instalacao, 'parcial');
        
        // Verificar que não há menção a "retirada"
        const textos = slide.elementos
          .filter(e => e.tipo === 'texto')
          .map(e => e.conteudo.toLowerCase());
        
        expect(textos.some(t => t.includes('retirada'))).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});

it('Feature: sistema-relatorios, Property 8: For any relatório final com instalação finalizada, deve conter fotos de retirada', () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.uuid(),
        endereco: fc.string(),
        fotos_placa: fc.array(fc.webUrl(), { minLength: 2 }),
        fotos_retirada: fc.array(fc.webUrl(), { minLength: 2, maxLength: 5 }),
        status: fc.constant('finalizada'),
        data_instalacao: fc.date().map(d => d.toISOString()),
        data_retirada_real: fc.date().map(d => d.toISOString()),
      }),
      async (instalacao) => {
        const slide = await gerarSlideEndereco(instalacao, 'final');
        
        // Verificar que há seção de fotos de retirada
        const textos = slide.elementos
          .filter(e => e.tipo === 'texto')
          .map(e => e.conteudo.toLowerCase());
        
        expect(textos.some(t => t.includes('retirada'))).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 9: Data de Instalação Sempre Presente

```typescript
it('Feature: sistema-relatorios, Property 9: For any slide de endereço, data de instalação deve estar presente', () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.uuid(),
        endereco: fc.string(),
        data_instalacao: fc.date({ min: new Date('2020-01-01') }).map(d => d.toISOString()),
        fotos_placa: fc.array(fc.webUrl(), { minLength: 2 }),
        status: fc.constant('ativa'),
      }),
      async (instalacao) => {
        const slide = await gerarSlideEndereco(instalacao, 'parcial');
        
        // Verificar que há texto com data de instalação
        const textos = slide.elementos
          .filter(e => e.tipo === 'texto')
          .map(e => e.conteudo);
        
        const temDataInstalacao = textos.some(t => 
          t.includes('Instalação') && /\d{2}\/\d{2}\/\d{4}/.test(t)
        );
        
        expect(temDataInstalacao).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 10: Data de Retirada Quando Finalizada

```typescript
it('Feature: sistema-relatorios, Property 10: For any instalação finalizada em relatório final, data de retirada deve estar presente', () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.uuid(),
        endereco: fc.string(),
        data_instalacao: fc.date().map(d => d.toISOString()),
        data_retirada_real: fc.date().map(d => d.toISOString()),
        fotos_placa: fc.array(fc.webUrl(), { minLength: 2 }),
        fotos_retirada: fc.array(fc.webUrl(), { minLength: 2 }),
        status: fc.constant('finalizada'),
      }),
      async (instalacao) => {
        const slide = await gerarSlideEndereco(instalacao, 'final');
        
        // Verificar que há texto com data de retirada
        const textos = slide.elementos
          .filter(e => e.tipo === 'texto')
          .map(e => e.conteudo);
        
        const temDataRetirada = textos.some(t => 
          t.includes('Retirada') && /\d{2}\/\d{2}\/\d{4}/.test(t)
        );
        
        expect(temDataRetirada).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Testes de Integração

```typescript
describe('Integração - Geração Completa', () => {
  it('deve gerar relatório parcial completo', async () => {
    const campanhaId = 'test-campaign-id';
    const numeroPI = 'PI-TEST-001';

    const resultado = await gerarRelatorio({
      campanhaId,
      tipo: 'parcial',
      numeroPI,
    });

    expect(resultado).toBeDefined();
    expect(resultado.tipo).toBe('parcial');
    expect(resultado.numero_pi).toBe(numeroPI);
    expect(resultado.url_arquivo).toMatch(/^https:\/\//);
  });

  it('deve gerar relatório final completo', async () => {
    const campanhaId = 'test-campaign-id';
    const numeroPI = 'PI-TEST-002';

    const resultado = await gerarRelatorio({
      campanhaId,
      tipo: 'final',
      numeroPI,
    });

    expect(resultado).toBeDefined();
    expect(resultado.tipo).toBe('final');
    expect(resultado.numero_pi).toBe(numeroPI);
  });
});
```

### Testes de Performance

```typescript
describe('Performance', () => {
  it('deve gerar relatório com 100 endereços em menos de 30 segundos', async () => {
    const inicio = Date.now();

    await gerarRelatorio({
      campanhaId: 'large-campaign-id',
      tipo: 'parcial',
      numeroPI: 'PI-PERF-001',
    });

    const duracao = Date.now() - inicio;
    expect(duracao).toBeLessThan(30000);
  }, 35000);

  it('arquivo gerado deve ter menos de 50MB', async () => {
    const resultado = await gerarRelatorio({
      campanhaId: 'test-campaign-id',
      tipo: 'final',
      numeroPI: 'PI-SIZE-001',
    });

    const tamanhoMB = resultado.tamanho_bytes / (1024 * 1024);
    expect(tamanhoMB).toBeLessThan(50);
  });
});
```


## Considerações de Performance

### Otimizações de Geração

#### 1. Processamento em Lote de Imagens

```typescript
async function carregarImagensEmLote(urls: string[]): Promise<Blob[]> {
  // Limitar concorrência para evitar sobrecarga
  const BATCH_SIZE = 5;
  const resultados: Blob[] = [];

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const blobsPromises = batch.map(url =>
      fetch(url)
        .then(r => r.blob())
        .catch(error => {
          console.error(`Erro ao carregar ${url}:`, error);
          return null;
        })
    );

    const blobs = await Promise.all(blobsPromises);
    resultados.push(...blobs.filter(b => b !== null) as Blob[]);
  }

  return resultados;
}
```

#### 2. Compressão de Imagens

```typescript
async function comprimirImagem(blob: Blob, maxWidth: number = 1920): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Calcular dimensões mantendo aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Converter para blob com qualidade reduzida
      canvas.toBlob(
        (compressedBlob) => {
          URL.revokeObjectURL(url);
          resolve(compressedBlob!);
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erro ao carregar imagem'));
    };

    img.src = url;
  });
}
```

#### 3. Cache de Dados da Campanha

```typescript
// React Query já faz cache, mas podemos otimizar queries
export function useDadosCampanhaParaRelatorio(campanhaId: string) {
  return useQuery({
    queryKey: ['campanha-relatorio', campanhaId],
    queryFn: async () => {
      // Buscar tudo em uma única query otimizada
      const { data, error } = await supabase
        .from('campanhas')
        .select(`
          *,
          instalacoes!inner(
            id,
            status,
            data_instalacao,
            data_retirada_real,
            fotos_placa,
            fotos_retirada,
            endereco:enderecos(
              endereco,
              comunidade,
              cidade,
              uf
            )
          )
        `)
        .eq('id', campanhaId)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
}
```

#### 4. Geração Assíncrona com Feedback

```typescript
export function useGerarRelatorio() {
  const [progresso, setProgresso] = useState(0);

  return useMutation({
    mutationFn: async (params: GerarRelatorioParams) => {
      setProgresso(0);

      // 1. Buscar dados (20%)
      const campanha = await buscarDadosCampanha(params.campanhaId);
      setProgresso(10);

      const instalacoes = await buscarInstalacoes(params.campanhaId, params.tipo);
      setProgresso(20);

      // 2. Agrupar (10%)
      const dadosAgrupados = agruparHierarquicamente(instalacoes);
      setProgresso(30);

      // 3. Gerar PPT (50%)
      const pptBlob = await gerarPPTComProgresso(
        { campanha, dadosAgrupados, tipo: params.tipo, numeroPI: params.numeroPI },
        (p) => setProgresso(30 + p * 0.5)
      );
      setProgresso(80);

      // 4. Upload (10%)
      const nomeArquivo = gerarNomeArquivo(campanha, params.tipo, params.numeroPI);
      const urlArquivo = await uploadParaStorage(pptBlob, nomeArquivo, params.campanhaId);
      setProgresso(90);

      // 5. Salvar registro (10%)
      const relatorio = await salvarHistorico({
        campanha_id: params.campanhaId,
        tipo: params.tipo,
        numero_pi: params.numeroPI,
        url_arquivo: urlArquivo,
        nome_arquivo: nomeArquivo,
        tamanho_bytes: pptBlob.size,
        gerado_por: user!.id,
      });
      setProgresso(100);

      return relatorio;
    },
  });
}
```

### Limites e Restrições

**Tamanho Máximo do Arquivo**: 50MB
- Comprimir imagens se necessário
- Limitar número de fotos por slide (máximo 4)

**Timeout de Geração**: 60 segundos
- Mostrar loading durante processamento
- Cancelar operação se exceder timeout

**Número Máximo de Endereços**: 500 por relatório
- Validar antes de iniciar geração
- Sugerir filtros se exceder limite

```typescript
async function validarLimites(
  campanhaId: string,
  tipo: TipoRelatorio
): Promise<void> {
  const { count } = await supabase
    .from('instalacoes')
    .select('*', { count: 'exact', head: true })
    .eq('campanha_id', campanhaId)
    .in('status', tipo === 'parcial' ? ['ativa'] : ['ativa', 'finalizada']);

  if (count && count > 500) {
    throw new Error(
      `Esta campanha possui ${count} instalações. O limite é 500 por relatório. ` +
      `Considere gerar relatórios separados por estado ou cidade.`
    );
  }
}
```

### Monitoramento de Performance

```typescript
async function gerarRelatorioComMetricas(
  params: GerarRelatorioParams
): Promise<RelatorioGerado> {
  const metricas = {
    inicio: Date.now(),
    etapas: {} as Record<string, number>,
  };

  try {
    // Buscar dados
    const t1 = Date.now();
    const campanha = await buscarDadosCampanha(params.campanhaId);
    metricas.etapas.buscarCampanha = Date.now() - t1;

    const t2 = Date.now();
    const instalacoes = await buscarInstalacoes(params.campanhaId, params.tipo);
    metricas.etapas.buscarInstalacoes = Date.now() - t2;

    // Agrupar
    const t3 = Date.now();
    const dadosAgrupados = agruparHierarquicamente(instalacoes);
    metricas.etapas.agrupar = Date.now() - t3;

    // Gerar PPT
    const t4 = Date.now();
    const pptBlob = await gerarPPT({
      campanha,
      dadosAgrupados,
      tipo: params.tipo,
      numeroPI: params.numeroPI,
    });
    metricas.etapas.gerarPPT = Date.now() - t4;

    // Upload
    const t5 = Date.now();
    const nomeArquivo = gerarNomeArquivo(campanha, params.tipo, params.numeroPI);
    const urlArquivo = await uploadParaStorage(pptBlob, nomeArquivo, params.campanhaId);
    metricas.etapas.upload = Date.now() - t5;

    // Salvar registro
    const t6 = Date.now();
    const relatorio = await salvarHistorico({
      campanha_id: params.campanhaId,
      tipo: params.tipo,
      numero_pi: params.numeroPI,
      url_arquivo: urlArquivo,
      nome_arquivo: nomeArquivo,
      tamanho_bytes: pptBlob.size,
      gerado_por: user!.id,
    });
    metricas.etapas.salvarRegistro = Date.now() - t6;

    metricas.etapas.total = Date.now() - metricas.inicio;

    // Log de métricas
    console.log('📊 Métricas de geração de relatório:', {
      campanhaId: params.campanhaId,
      tipo: params.tipo,
      numeroInstalacoes: instalacoes.length,
      tamanhoMB: (pptBlob.size / (1024 * 1024)).toFixed(2),
      metricas,
    });

    return relatorio;
  } catch (error) {
    console.error('❌ Erro na geração (métricas):', {
      params,
      metricas,
      error,
    });
    throw error;
  }
}
```

### Otimizações de Storage

**Política de Limpeza Automática**:
```sql
-- Função para deletar relatórios antigos (> 90 dias)
CREATE OR REPLACE FUNCTION limpar_relatorios_antigos()
RETURNS void AS $$
DECLARE
  relatorio RECORD;
BEGIN
  FOR relatorio IN
    SELECT id, url_arquivo
    FROM relatorios_gerados
    WHERE gerado_em < NOW() - INTERVAL '90 days'
  LOOP
    -- Deletar arquivo do storage
    -- (implementar via função edge ou cron job)
    
    -- Deletar registro
    DELETE FROM relatorios_gerados WHERE id = relatorio.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

**Compressão no Storage**:
- Configurar bucket para comprimir automaticamente
- Usar formato JPEG para fotos (menor que PNG)
- Qualidade 85% para balance entre tamanho e qualidade


## Estrutura de Arquivos do Projeto

```
src/
├── components/
│   ├── GerarRelatorioModal.tsx          # Modal de configuração
│   └── RelatoriosPage.tsx                # Página de histórico
│
├── hooks/
│   ├── useGerarRelatorio.ts              # Hook principal de geração
│   ├── useRelatorios.ts                  # Hook para histórico
│   └── useDeletarRelatorio.ts            # Hook para deletar
│
├── services/
│   ├── relatorioService.ts               # Geração de PPT
│   ├── agrupamentoService.ts             # Agrupamento hierárquico
│   └── storageService.ts                 # Upload/download
│
├── types/
│   └── relatorios.ts                     # Tipos TypeScript
│
└── utils/
    ├── nomeArquivo.ts                    # Geração de nomes
    └── validacoes.ts                     # Validações

supabase/
└── migrations/
    └── 20260226030000_create_relatorios.sql  # Migration
```

## Fluxo de Implementação Recomendado

### Fase 1: Infraestrutura (1-2 dias)
1. Criar migration da tabela `relatorios_gerados`
2. Configurar bucket `relatorios` no Supabase Storage
3. Instalar dependências (PptxGenJS, fast-check)
4. Criar tipos TypeScript

### Fase 2: Serviços Core (2-3 dias)
1. Implementar `agrupamentoService.ts`
2. Implementar funções básicas de `relatorioService.ts`
3. Implementar `storageService.ts`
4. Criar testes unitários dos serviços

### Fase 3: Geração de Slides (3-4 dias)
1. Implementar slide de capa
2. Implementar slide de resumo
3. Implementar slides de hierarquia (estado, cidade, comunidade)
4. Implementar slide de endereço (CRÍTICO)
5. Implementar slide de encerramento
6. Testar geração completa

### Fase 4: Hooks e UI (2-3 dias)
1. Implementar `useGerarRelatorio`
2. Implementar `useRelatorios`
3. Implementar `useDeletarRelatorio`
4. Criar `GerarRelatorioModal`
5. Criar `RelatoriosPage`
6. Integrar com `CampaignDetail`

### Fase 5: Testes (2-3 dias)
1. Escrever testes de propriedades
2. Escrever testes de integração
3. Testar com dados reais
4. Validar performance

### Fase 6: Refinamento (1-2 dias)
1. Ajustar layout dos slides
2. Otimizar performance
3. Melhorar tratamento de erros
4. Documentação final

**Total Estimado**: 11-17 dias

## Dependências Externas

### NPM Packages

```json
{
  "dependencies": {
    "pptxgenjs": "^3.12.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "fast-check": "^3.15.0",
    "@types/pptxgenjs": "^3.12.0"
  }
}
```

### Instalação

```bash
npm install pptxgenjs date-fns
npm install --save-dev fast-check @types/pptxgenjs
```

## Segurança

### Validação de Permissões

```typescript
async function validarPermissaoGerar(
  userId: string,
  campanhaId: string
): Promise<void> {
  // Verificar se usuário tem permissão
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  const userRoles = roles?.map(r => r.role) || [];

  // Admins e operações podem gerar qualquer relatório
  if (userRoles.includes('administrador') || userRoles.includes('operacoes')) {
    return;
  }

  // Coordenadores podem gerar apenas das suas campanhas
  if (userRoles.includes('coordenador')) {
    const { data: vinculo } = await supabase
      .from('campanha_coordenadores')
      .select('id')
      .eq('campanha_id', campanhaId)
      .eq('coordenador_id', userId)
      .single();

    if (vinculo) {
      return;
    }
  }

  throw new Error('Você não tem permissão para gerar relatórios desta campanha');
}
```

### Sanitização de Dados

```typescript
function sanitizarTexto(texto: string): string {
  // Remover caracteres especiais que podem quebrar o PPT
  return texto
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Caracteres de controle
    .replace(/[<>]/g, '') // Tags HTML
    .trim();
}

function sanitizarNumeroPI(numeroPI: string): string {
  return numeroPI
    .trim()
    .replace(/[^\w\-]/g, '') // Apenas alfanuméricos e hífen
    .toUpperCase();
}
```

### Rate Limiting

```typescript
// Limitar geração de relatórios por usuário
const RATE_LIMIT = 10; // 10 relatórios por hora
const RATE_WINDOW = 60 * 60 * 1000; // 1 hora

async function verificarRateLimit(userId: string): Promise<void> {
  const { count } = await supabase
    .from('relatorios_gerados')
    .select('*', { count: 'exact', head: true })
    .eq('gerado_por', userId)
    .gte('gerado_em', new Date(Date.now() - RATE_WINDOW).toISOString());

  if (count && count >= RATE_LIMIT) {
    throw new Error(
      `Limite de ${RATE_LIMIT} relatórios por hora atingido. Tente novamente mais tarde.`
    );
  }
}
```

## Melhorias Futuras

### Curto Prazo (1-2 meses)
- [ ] Adicionar gráficos ao slide de resumo (pizza, barras)
- [ ] Permitir customização de logo e cores
- [ ] Adicionar mapa no slide de resumo
- [ ] Exportar para PDF (não editável)

### Médio Prazo (3-6 meses)
- [ ] Templates customizáveis por cliente
- [ ] Agendamento de relatórios automáticos
- [ ] Envio por email após geração
- [ ] Relatórios comparativos (múltiplas campanhas)
- [ ] Dashboard de métricas de relatórios

### Longo Prazo (6+ meses)
- [ ] Geração de relatórios em outros formatos (Word, Excel)
- [ ] IA para análise automática de dados
- [ ] Integração com ferramentas de BI
- [ ] API pública para geração de relatórios
- [ ] Versionamento de relatórios

## Referências

- [PptxGenJS Documentation](https://gitbrent.github.io/PptxGenJS/)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [fast-check Documentation](https://fast-check.dev/)
- [React Query Documentation](https://tanstack.com/query/latest)

