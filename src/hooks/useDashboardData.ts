import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Hook para buscar total de pontos
export function useTotalPontos() {
  return useQuery({
    queryKey: ["total-pontos"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("enderecos")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    },
  });
}

// Hook para buscar distribuição por status
export function useDistribuicaoStatus() {
  return useQuery({
    queryKey: ["distribuicao-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enderecos")
        .select("status");

      if (error) throw error;

      // Contar manualmente por status
      const statusCount = {
        disponivel: 0,
        ocupado: 0,
        inativo: 0,
        manutencao: 0,
      };

      data?.forEach((item) => {
        if (item.status in statusCount) {
          statusCount[item.status as keyof typeof statusCount]++;
        }
      });

      const total = data?.length || 0;

      return {
        disponivel: {
          count: statusCount.disponivel,
          percentage: total > 0 ? (statusCount.disponivel / total) * 100 : 0,
        },
        ocupado: {
          count: statusCount.ocupado,
          percentage: total > 0 ? (statusCount.ocupado / total) * 100 : 0,
        },
        inativo: {
          count: statusCount.inativo,
          percentage: total > 0 ? (statusCount.inativo / total) * 100 : 0,
        },
        manutencao: {
          count: statusCount.manutencao,
          percentage: total > 0 ? (statusCount.manutencao / total) * 100 : 0,
        },
        total,
      };
    },
  });
}

// Hook para buscar campanhas ativas
export function useCampanhasAtivas() {
  return useQuery({
    queryKey: ["campanhas-ativas"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("campanhas")
        .select("*")
        .gte("data_fim", hoje)
        .order("data_inicio", { ascending: false });

      if (error) throw error;

      // Para cada campanha, buscar o número de instalações
      const campanhasComInstalacoes = await Promise.all(
        (data || []).map(async (campanha) => {
          const { count: totalInstalacoes } = await supabase
            .from("instalacoes")
            .select("*", { count: "exact", head: true })
            .eq("campanha_id", campanha.id);

          const { count: instalacoesAtivas } = await supabase
            .from("instalacoes")
            .select("*", { count: "exact", head: true })
            .eq("campanha_id", campanha.id)
            .eq("status", "ativa");

          return {
            ...campanha,
            total_instalacoes: totalInstalacoes || 0,
            instalacoes_ativas: instalacoesAtivas || 0,
            progresso:
              totalInstalacoes && totalInstalacoes > 0
                ? Math.round((instalacoesAtivas || 0) / totalInstalacoes * 100)
                : 0,
          };
        })
      );

      return campanhasComInstalacoes;
    },
  });
}

// Hook para buscar atividade recente
export function useAtividadeRecente() {
  return useQuery({
    queryKey: ["atividade-recente"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario_historico")
        .select(`
          id,
          status_novo,
          alterado_em,
          endereco_id,
          enderecos (
            endereco,
            comunidade,
            cidade
          ),
          alterado_por,
          profiles:alterado_por (
            nome
          )
        `)
        .order("alterado_em", { ascending: false })
        .limit(5);

      if (error) throw error;

      return data?.map((item: any) => ({
        id: item.id,
        endereco: item.enderecos?.endereco || "Endereço não disponível",
        comunidade: item.enderecos?.comunidade || "",
        cidade: item.enderecos?.cidade || "",
        status: item.status_novo,
        usuario: item.profiles?.nome || "Usuário desconhecido",
        data: item.alterado_em,
      })) || [];
    },
  });
}

// Hook para buscar estatísticas de instalações
export function useEstatisticasInstalacoes() {
  return useQuery({
    queryKey: ["estatisticas-instalacoes"],
    queryFn: async () => {
      // Total de instalações ativas
      const { count: ativas } = await supabase
        .from("instalacoes")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativa");

      // Total de instalações pendentes
      const { count: pendentes } = await supabase
        .from("instalacoes")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");

      // Instalações com prazo vencido (data_expiracao < hoje)
      const hoje = new Date().toISOString().split("T")[0];
      const { count: vencidas } = await supabase
        .from("instalacoes")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativa")
        .lt("data_expiracao", hoje);

      return {
        ativas: ativas || 0,
        pendentes: pendentes || 0,
        vencidas: vencidas || 0,
      };
    },
  });
}

// Hook para buscar número de comunidades únicas
export function useComunidades() {
  return useQuery({
    queryKey: ["comunidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enderecos")
        .select("comunidade");

      if (error) throw error;

      // Contar comunidades únicas
      const comunidadesUnicas = new Set(data?.map((item) => item.comunidade));
      return comunidadesUnicas.size;
    },
  });
}

// Hook para buscar número de clientes únicos
export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas")
        .select("cliente");

      if (error) throw error;

      // Contar clientes únicos
      const clientesUnicos = new Set(data?.map((item) => item.cliente));
      return clientesUnicos.size;
    },
  });
}
