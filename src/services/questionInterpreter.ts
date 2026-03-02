import { QuestionIntent, QuestionFilters } from "@/types/iaConsultiva";
import { subDays, subWeeks, subMonths, startOfYear, endOfDay, startOfDay } from "date-fns";

// Padrões regex para identificar intenções
const patterns = {
  relatorios: {
    count: /quantos?\s+relat[oó]rios?/i,
    gerados: /(?:foram\s+)?gerados?/i,
  },
  campanhas: {
    count: /quantas?\s+campanhas?/i,
    ativas: /campanhas?\s+ativas?/i,
    finalizadas: /campanhas?\s+finalizadas?/i,
    ranking: /qual\s+campanha.*(?:mais|maior)/i,
  },
  enderecos: {
    count: /quantos?\s+endere[çc]os?/i,
    disponiveis: /endere[çc]os?\s+dispon[íi]veis?/i,
    ocupados: /endere[çc]os?\s+ocupados?/i,
    total: /total\s+de\s+endere[çc]os?/i,
  },
  instalacoes: {
    count: /quantas?\s+instala[çc][õo]es?/i,
    ativas: /instala[çc][õo]es?\s+ativas?/i,
    pendentes: /instala[çc][õo]es?\s+pendentes?/i,
    finalizadas: /instala[çc][õo]es?\s+finalizadas?/i,
  },
  estatisticas: {
    geral: /estat[íi]sticas?\s+gerais?/i,
    resumo: /resumo|vis[ãa]o\s+geral/i,
  },
  periodo: {
    ultimoMes: /(?:no|do)?\s*[úu]ltimo\s+m[êe]s/i,
    ultimaSemana: /(?:na|da)?\s*[úu]ltima\s+semana/i,
    hoje: /hoje|hoj/i,
    esteAno: /(?:neste|deste|este)\s+ano/i,
  },
  estado: /\b(?:em|no|do|de|estado)\s+([A-Z]{2})\b/i,
  cidade: /(?:em|na|de)\s+([A-Z][a-zà-ú]+(?:\s+[A-Z][a-zà-ú]+)*)/i,
};

/**
 * Extrai filtros de período da pergunta
 */
function extractPeriodoFilter(question: string): QuestionFilters["periodo"] | undefined {
  const now = new Date();
  
  if (patterns.periodo.hoje.test(question)) {
    return {
      inicio: startOfDay(now),
      fim: endOfDay(now),
    };
  }
  
  if (patterns.periodo.ultimaSemana.test(question)) {
    return {
      inicio: subWeeks(now, 1),
      fim: now,
    };
  }
  
  if (patterns.periodo.ultimoMes.test(question)) {
    return {
      inicio: subMonths(now, 1),
      fim: now,
    };
  }
  
  if (patterns.periodo.esteAno.test(question)) {
    return {
      inicio: startOfYear(now),
      fim: now,
    };
  }
  
  return undefined;
}

/**
 * Extrai filtro de estado (UF) da pergunta
 */
function extractEstadoFilter(question: string): string | undefined {
  const match = question.match(patterns.estado);
  return match ? match[1].toUpperCase() : undefined;
}

/**
 * Extrai filtro de cidade da pergunta
 */
function extractCidadeFilter(question: string): string | undefined {
  const match = question.match(patterns.cidade);
  const cidade = match ? match[1] : undefined;
  
  // Não considerar se termina com sigla de estado (ex: "em SP", "no RJ")
  if (cidade && /\s+[A-Z]{2}$/i.test(cidade)) {
    return undefined;
  }
  
  // Não considerar apenas sigla de estado (2 letras maiúsculas)
  if (cidade && /^[A-Z]{2}$/i.test(cidade)) {
    return undefined;
  }
  
  return cidade;
}

/**
 * Interpreta uma pergunta e retorna a intenção identificada
 */
export function interpretQuestion(question: string): QuestionIntent {
  const questionLower = question.toLowerCase();
  
  // Extrair filtros comuns
  const filters: QuestionFilters = {
    periodo: extractPeriodoFilter(question),
    estado: extractEstadoFilter(question),
    cidade: extractCidadeFilter(question),
  };
  
  let confidence = 0;
  let type: QuestionIntent["type"] = "unknown";
  let action: QuestionIntent["action"] = "count";
  
  // Identificar tipo: Relatórios
  if (patterns.relatorios.count.test(questionLower)) {
    type = "relatorios";
    action = "count";
    confidence = 0.9;
    
    if (patterns.relatorios.gerados.test(questionLower)) {
      confidence = 0.95;
    }
  }
  
  // Identificar tipo: Campanhas
  else if (patterns.campanhas.count.test(questionLower)) {
    type = "campanhas";
    action = "count";
    confidence = 0.9;
    
    if (patterns.campanhas.ativas.test(questionLower)) {
      filters.status = "ativa";
      confidence = 0.95;
    } else if (patterns.campanhas.finalizadas.test(questionLower)) {
      filters.status = "finalizada";
      confidence = 0.95;
    }
  }
  
  // Identificar tipo: Ranking de campanhas
  else if (patterns.campanhas.ranking.test(questionLower)) {
    type = "campanhas";
    action = "ranking";
    confidence = 0.85;
  }
  
  // Identificar tipo: Endereços
  else if (patterns.enderecos.count.test(questionLower) || patterns.enderecos.total.test(questionLower)) {
    type = "enderecos";
    action = "count";
    confidence = 0.9;
    
    if (patterns.enderecos.disponiveis.test(questionLower)) {
      filters.status = "disponivel";
      confidence = 0.95;
    } else if (patterns.enderecos.ocupados.test(questionLower)) {
      filters.status = "ocupado";
      confidence = 0.95;
    }
  }
  
  // Identificar tipo: Instalações
  else if (patterns.instalacoes.count.test(questionLower)) {
    type = "instalacoes";
    action = "count";
    confidence = 0.9;
    
    if (patterns.instalacoes.ativas.test(questionLower)) {
      filters.status = "ativa";
      confidence = 0.95;
    } else if (patterns.instalacoes.pendentes.test(questionLower)) {
      filters.status = "pendente";
      confidence = 0.95;
    } else if (patterns.instalacoes.finalizadas.test(questionLower)) {
      filters.status = "finalizada";
      confidence = 0.95;
    }
  }
  
  // Identificar tipo: Estatísticas gerais
  else if (patterns.estatisticas.geral.test(questionLower) || patterns.estatisticas.resumo.test(questionLower)) {
    type = "estatisticas";
    action = "status";
    confidence = 0.85;
  }
  
  // Ajustar confidence baseado em filtros
  if (filters.periodo) confidence += 0.05;
  if (filters.estado) confidence += 0.05;
  if (filters.cidade) confidence += 0.05;
  
  // Garantir que confidence não ultrapasse 1
  confidence = Math.min(confidence, 1);
  
  return {
    type,
    action,
    filters,
    confidence,
  };
}
