import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HistoricoMudanca {
  id: string;
  data_mudanca: string;
  motivo: string;
  observacoes: string | null;
  campanha: {
    id: string;
    nome: string;
    cliente: string;
  };
  endereco_antigo: {
    id: string;
    endereco: string;
    comunidade: string;
    cidade: string;
    uf: string;
  };
  endereco_novo: {
    id: string;
    endereco: string;
    comunidade: string;
    cidade: string;
    uf: string;
  };
  realizado_por_profile: {
    nome: string;
  };
}

export function useHistoricoMudancas(campanhaId?: string) {
  return useQuery({
    queryKey: ["historico-mudancas", campanhaId],
    queryFn: async () => {
      let query = supabase
        .from("historico_mudancas_endereco")
        .select(`
          id,
          data_mudanca,
          motivo,
          observacoes,
          campanha:campanhas!campanha_id (
            id,
            nome,
            cliente
          ),
          endereco_antigo:enderecos!endereco_antigo_id (
            id,
            endereco,
            comunidade,
            cidade,
            uf
          ),
          endereco_novo:enderecos!endereco_novo_id (
            id,
            endereco,
            comunidade,
            cidade,
            uf
          ),
          realizado_por_profile:profiles!realizado_por (
            nome
          )
        `)
        .order("data_mudanca", { ascending: false });

      // Filtrar por campanha se fornecido
      if (campanhaId) {
        query = query.eq("campanha_id", campanhaId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Erro ao buscar histórico:", error);
        throw error;
      }

      console.log("📊 Histórico de mudanças:", data);

      // Transformar dados para formato esperado
      const historico: HistoricoMudanca[] = (data || []).map((item: any) => ({
        id: item.id,
        data_mudanca: item.data_mudanca,
        motivo: item.motivo,
        observacoes: item.observacoes,
        campanha: Array.isArray(item.campanha) ? item.campanha[0] : item.campanha,
        endereco_antigo: Array.isArray(item.endereco_antigo) 
          ? item.endereco_antigo[0] 
          : item.endereco_antigo,
        endereco_novo: Array.isArray(item.endereco_novo) 
          ? item.endereco_novo[0] 
          : item.endereco_novo,
        realizado_por_profile: Array.isArray(item.realizado_por_profile)
          ? item.realizado_por_profile[0]
          : item.realizado_por_profile,
      }));

      return historico;
    },
  });
}
