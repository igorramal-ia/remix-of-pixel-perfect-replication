// Tipos para o sistema de IA Consultiva

export type MessageType = 'user' | 'assistant';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  loading?: boolean;
}

export type IntentType = 
  | 'relatorios' 
  | 'campanhas' 
  | 'enderecos' 
  | 'instalacoes' 
  | 'estatisticas' 
  | 'unknown';

export type ActionType = 'count' | 'list' | 'ranking' | 'status';

export interface QuestionFilters {
  periodo?: {
    inicio: Date;
    fim: Date;
  };
  estado?: string;
  cidade?: string;
  status?: string;
}

export interface QuestionIntent {
  type: IntentType;
  action: ActionType;
  filters: QuestionFilters;
  confidence: number;
}

export interface QueryResult {
  success: boolean;
  data: any;
  error?: string;
}

export interface FormattedResponse {
  text: string;
  suggestions?: string[];
}
