import { QuestionIntent, QueryResult, FormattedResponse } from "@/types/iaConsultiva";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatNumber = (num: number): string => num.toLocaleString("pt-BR");

const formatPeriodo = (periodo?: { inicio: Date; fim: Date }): string => {
  if (!periodo) return "";
  
  const hoje = new Date();
  const umDiaAtras = new Date(hoje);
  umDiaAtras.setDate(hoje.getDate() - 1);
  
  const umaSemanaAtras = new Date(hoje);
  umaSemanaAtras.setDate(hoje.getDate() - 7);
  
  const umMesAtras = new Date(hoje);
  umMesAtras.setMonth(hoje.getMonth() - 1);
  
  if (periodo.inicio.toDateString() === hoje.toDateString()) {
    return " hoje";
  } else if (Math.abs(periodo.inicio.getTime() - umaSemanaAtras.getTime()) < 86400000) {
    return " na última semana";
  } else if (Math.abs(periodo.inicio.getTime() - umMesAtras.getTime()) < 86400000) {
    return " no último mês";
  }
  
  return ` entre ${format(periodo.inicio, "dd/MM/yyyy", { locale: ptBR })} e ${format(periodo.fim, "dd/MM/yyyy", { locale: ptBR })}`;
};

export function formatResponse(intent: QuestionIntent, result: QueryResult): FormattedResponse {
  if (!result.success) {
    return {
      text: "Desculpe, ocorreu um erro ao buscar os dados. Por favor, tente novamente.",
      suggestions: [
        "Quantos relatórios foram gerados?",
        "Quantas campanhas ativas existem?",
        "Quantos endereços estão disponíveis?",
      ],
    };
  }

  const { type, filters } = intent;
  const { data } = result;

  // Relatórios
  if (type === "relatorios") {
    const periodo = formatPeriodo(filters.periodo);
    return {
      text: `Foram gerados ${formatNumber(data.count)} relatórios${periodo}.`,
      suggestions: [
        "Quantos relatórios foram gerados esta semana?",
        "Qual campanha gerou mais relatórios?",
      ],
    };
  }

  // Campanhas
  if (type === "campanhas") {
    if (intent.action === "ranking") {
      if (!data.campanhas || data.campanhas.length === 0) {
        return {
          text: "Não há campanhas cadastradas no sistema.",
          suggestions: ["Quantas campanhas ativas existem?"],
        };
      }
      
      const top = data.campanhas[0];
      return {
        text: `A campanha com mais instalações é "${top.nome}" com ${formatNumber(top.instalacoes?.length || 0)} instalações.`,
        suggestions: [
          "Quantas campanhas ativas existem?",
          "Quantas instalações estão pendentes?",
        ],
      };
    }

    const statusText = data.status === "ativa" ? " ativas" : data.status === "finalizada" ? " finalizadas" : "";
    return {
      text: `Existem ${formatNumber(data.count)} campanhas${statusText} no sistema.`,
      suggestions: [
        "Quantas campanhas foram finalizadas?",
        "Qual campanha tem mais instalações?",
      ],
    };
  }

  // Endereços
  if (type === "enderecos") {
    const statusText = data.status === "disponivel" ? " disponíveis" : data.status === "ocupado" ? " ocupados" : "";
    const localText = filters.estado ? ` em ${filters.estado}` : filters.cidade ? ` em ${filters.cidade}` : "";
    
    return {
      text: `Há ${formatNumber(data.count)} endereços${statusText}${localText} cadastrados.`,
      suggestions: [
        "Quantos endereços estão ocupados?",
        "Quantos endereços existem em SP?",
      ],
    };
  }

  // Instalações
  if (type === "instalacoes") {
    const statusText = data.status === "ativa" ? " ativas" : data.status === "pendente" ? " pendentes" : data.status === "finalizada" ? " finalizadas" : "";
    const periodo = formatPeriodo(filters.periodo);
    
    return {
      text: `Existem ${formatNumber(data.count)} instalações${statusText}${periodo}.`,
      suggestions: [
        "Quantas instalações foram finalizadas?",
        "Quantas instalações ativas existem?",
      ],
    };
  }

  // Estatísticas gerais
  if (type === "estatisticas") {
    return {
      text: `📊 Estatísticas do Sistema:\n\n` +
        `• Relatórios: ${formatNumber(data.relatorios)}\n` +
        `• Campanhas: ${formatNumber(data.campanhas)}\n` +
        `• Endereços: ${formatNumber(data.enderecos)}\n` +
        `• Instalações: ${formatNumber(data.instalacoes)}`,
      suggestions: [
        "Quantas campanhas ativas existem?",
        "Quantos endereços estão disponíveis?",
      ],
    };
  }

  return {
    text: "Desculpe, não entendi sua pergunta. Tente reformular ou escolha uma das sugestões abaixo.",
    suggestions: [
      "Quantos relatórios foram gerados?",
      "Quantas campanhas ativas existem?",
      "Quantos endereços estão disponíveis?",
      "Mostre estatísticas gerais do sistema",
    ],
  };
}
