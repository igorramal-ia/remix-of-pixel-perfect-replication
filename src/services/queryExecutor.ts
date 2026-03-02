import { supabase } from "@/integrations/supabase/client";
import { QuestionIntent, QueryResult } from "@/types/iaConsultiva";

export async function executeQuery(intent: QuestionIntent): Promise<QueryResult> {
  try {
    const { type, action, filters } = intent;
    const supabaseClient: any = supabase;

    // Relatórios
    if (type === "relatorios" && action === "count") {
      let query = supabaseClient
        .from("relatorios_gerados")
        .select("*", { count: "exact", head: true });

      if (filters.periodo) {
        query = query
          .gte("created_at", filters.periodo.inicio.toISOString())
          .lte("created_at", filters.periodo.fim.toISOString());
      }

      const { count, error } = await query;
      if (error) throw error;

      return { success: true, data: { count: count || 0 } };
    }

    // Campanhas - Count
    if (type === "campanhas" && action === "count") {
      let query = supabaseClient
        .from("campanhas")
        .select("*", { count: "exact", head: true });

      if (filters.status === "ativa") {
        const now = new Date().toISOString().split("T")[0];
        query = query.lte("data_inicio", now).gte("data_fim", now);
      } else if (filters.status === "finalizada") {
        const now = new Date().toISOString().split("T")[0];
        query = query.lt("data_fim", now);
      }

      const { count, error } = await query;
      if (error) throw error;

      return { success: true, data: { count: count || 0, status: filters.status } };
    }

    // Campanhas - Ranking
    if (type === "campanhas" && action === "ranking") {
      // Buscar todas as campanhas
      const { data: campanhas, error: campanhasError } = await supabaseClient
        .from("campanhas")
        .select("id, nome");
      
      if (campanhasError) throw campanhasError;
      if (!campanhas) return { success: true, data: { campanhas: [] } };
      
      // Contar instalações para cada campanha
      const campanhasComContagem: any = await Promise.all(
        campanhas.map(async (campanha: any) => {
          const result: any = await supabaseClient
            .from("instalacoes")
            .select("*", { count: "exact", head: true })
            .eq("campanha_id", campanha.id);
          
          return {
            ...campanha,
            instalacoes_count: result.count || 0,
          };
        })
      );
      
      // Ordenar por contagem e pegar top 5
      const top5 = campanhasComContagem
        .sort((a, b) => b.instalacoes_count - a.instalacoes_count)
        .slice(0, 5);

      return { success: true, data: { campanhas: top5 } };
    }

    // Endereços
    if (type === "enderecos" && action === "count") {
      let query = supabaseClient
        .from("enderecos")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true);

      if (filters.estado) {
        query = query.eq("uf", filters.estado);
      }

      if (filters.cidade) {
        query = query.ilike("cidade", `%${filters.cidade}%`);
      }

      // Para endereços disponíveis/ocupados, precisamos verificar instalações
      if (filters.status === "disponivel" || filters.status === "ocupado") {
        // Buscar todos os endereços ativos
        const { data: todosEnderecos, error: enderecosError } = await supabaseClient
          .from("enderecos")
          .select("id")
          .eq("ativo", true);

        if (enderecosError) throw enderecosError;
        if (!todosEnderecos) return { success: true, data: { count: 0, status: filters.status } };

        // Buscar endereços com instalações ativas ou pendentes
        const { data: instalacoes, error: instalacoesError } = await supabaseClient
          .from("instalacoes")
          .select("endereco_id")
          .in("status", ["ativa", "pendente"]);

        if (instalacoesError) throw instalacoesError;

        const enderecosOcupados = new Set(instalacoes?.map((i: any) => i.endereco_id) || []);
        
        let count = 0;
        if (filters.status === "ocupado") {
          count = enderecosOcupados.size;
        } else {
          // disponivel
          count = todosEnderecos.length - enderecosOcupados.size;
        }

        return { success: true, data: { count, status: filters.status } };
      }

      const { count, error } = await query;
      if (error) throw error;
      
      return { success: true, data: { count: count || 0 } };
    }

    // Instalações
    if (type === "instalacoes" && action === "count") {
      // Se tem filtro de estado, precisamos fazer JOIN com enderecos
      if (filters.estado) {
        // Buscar endereços do estado
        const { data: enderecosEstado, error: enderecosError } = await supabaseClient
          .from("enderecos")
          .select("id")
          .eq("ativo", true)
          .eq("uf", filters.estado);
        
        if (enderecosError) throw enderecosError;
        
        const enderecosIds = enderecosEstado?.map((e: any) => e.id) || [];
        
        if (enderecosIds.length === 0) {
          return { success: true, data: { count: 0, status: filters.status } };
        }
        
        // Buscar instalações desses endereços
        let query = supabaseClient
          .from("instalacoes")
          .select("*", { count: "exact", head: true })
          .in("endereco_id", enderecosIds);
        
        if (filters.status) {
          query = query.eq("status", filters.status);
        }
        
        if (filters.periodo) {
          query = query
            .gte("data_instalacao", filters.periodo.inicio.toISOString())
            .lte("data_instalacao", filters.periodo.fim.toISOString());
        }
        
        const { count, error } = await query;
        if (error) throw error;
        
        return { success: true, data: { count: count || 0, status: filters.status } };
      }
      
      // Query normal sem filtro de estado
      let query = supabaseClient
        .from("instalacoes")
        .select("*", { count: "exact", head: true });

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.periodo) {
        query = query
          .gte("data_instalacao", filters.periodo.inicio.toISOString())
          .lte("data_instalacao", filters.periodo.fim.toISOString());
      }

      const { count, error } = await query;
      if (error) throw error;

      return { success: true, data: { count: count || 0, status: filters.status } };
    }

    // Estatísticas gerais
    if (type === "estatisticas") {
      const [relatorios, campanhas, enderecos, instalacoes] = await Promise.all([
        supabaseClient.from("relatorios_gerados").select("*", { count: "exact", head: true }),
        supabaseClient.from("campanhas").select("*", { count: "exact", head: true }),
        supabaseClient.from("enderecos").select("*", { count: "exact", head: true }).eq("ativo", true),
        supabaseClient.from("instalacoes").select("*", { count: "exact", head: true }),
      ]);

      return {
        success: true,
        data: {
          relatorios: relatorios.count || 0,
          campanhas: campanhas.count || 0,
          enderecos: enderecos.count || 0,
          instalacoes: instalacoes.count || 0,
        },
      };
    }

    return {
      success: false,
      data: null,
      error: "Tipo de consulta não suportado",
    };
  } catch (error: any) {
    console.error("Erro ao executar query:", error);
    return {
      success: false,
      data: null,
      error: error.message || "Erro ao buscar dados",
    };
  }
}
