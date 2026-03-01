// Tipos para o Sistema de Geração de Relatórios

// Tipo de relatório
export type TipoRelatorio = 'parcial' | 'final';

// Status de instalação
export type StatusInstalacao = 'ativa' | 'finalizada' | 'pendente' | 'cancelada';

// Metadados do relatório gerado
export interface RelatorioGerado {
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

// Parâmetros para geração de relatório
export interface GerarRelatorioParams {
  campanhaId: string;
  tipo: TipoRelatorio;
  numeroPI: string;
}

// Instalação com dados do endereço
export interface Instalacao {
  id: string;
  endereco_id: string;
  endereco: string;
  comunidade: string;
  cidade: string;
  uf: string;
  latitude?: number;
  longitude?: number;
  status: StatusInstalacao;
  data_instalacao: string;
  data_retirada_real?: string;
  fotos_placa: string[];
  fotos_retirada?: string[];
}

// Endereço agrupado (mesmo que Instalacao)
export interface EnderecoAgrupado extends Instalacao {}

// Comunidade agrupada
export interface ComunidadeAgrupada {
  nome: string;
  enderecos: EnderecoAgrupado[];
  totalPontos: number;
}

// Cidade agrupada
export interface CidadeAgrupada {
  nome: string;
  comunidades: ComunidadeAgrupada[];
  totalPontos: number;
  totalComunidades: number;
}

// Estado agrupado
export interface EstadoAgrupado {
  uf: string;
  nome: string;
  cidades: CidadeAgrupada[];
  totalPontos: number;
  totalCidades: number;
  totalComunidades: number;
}

// Dados agrupados hierarquicamente
export interface DadosAgrupados {
  estados: EstadoAgrupado[];
  totalPontos: number;
  totalEstados: number;
  totalCidades: number;
  totalComunidades: number;
}

// Dados completos para geração do relatório
export interface DadosRelatorio {
  campanha: {
    id: string;
    nome: string;
    cliente: string;
    data_inicio: string | null;
    data_fim: string | null;
  };
  dadosAgrupados: DadosAgrupados;
  tipo: TipoRelatorio;
  numeroPI: string;
}

// Filtros para histórico de relatórios
export interface FiltrosRelatorios {
  campanhaId?: string;
  tipo?: TipoRelatorio | '';
  dataInicio?: string;
  dataFim?: string;
}
