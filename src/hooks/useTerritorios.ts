import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Territorios {
  ufs: string[];
}

// Interface antiga (deprecated, manter para compatibilidade temporária)
export interface TerritoriosLegacy {
  cidades: string[];
  comunidades: string[];
}

// Hook para buscar cidades únicas
export function useCidades() {
  return useQuery({
    queryKey: ["cidades-unicas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enderecos")
        .select("cidade")
        .not("cidade", "is", null);

      if (error) throw error;

      // Extrair cidades únicas e ordenar
      const cidadesUnicas = Array.from(
        new Set(data?.map((item) => item.cidade).filter(Boolean))
      ).sort();

      return cidadesUnicas;
    },
  });
}

// Hook para buscar comunidades únicas (opcionalmente filtradas por cidade)
export function useComunidades(cidadeFiltro?: string) {
  return useQuery({
    queryKey: ["comunidades-unicas", cidadeFiltro],
    queryFn: async () => {
      let query = supabase
        .from("enderecos")
        .select("comunidade, cidade")
        .not("comunidade", "is", null);

      if (cidadeFiltro) {
        query = query.eq("cidade", cidadeFiltro);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Extrair comunidades únicas e ordenar
      const comunidadesUnicas = Array.from(
        new Set(data?.map((item) => item.comunidade).filter(Boolean))
      ).sort();

      return comunidadesUnicas;
    },
  });
}

// Hook para atualizar territórios de um usuário
export function useUpdateTerritorios() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      territorios,
    }: {
      userId: string;
      territorios: Territorios;
    }) => {
      console.log("🔵 [ANTES DO UPDATE]");
      console.log("  userId:", userId);
      console.log("  territorios:", territorios);
      console.log("  territorios stringified:", JSON.stringify(territorios));

      const { data, error } = await supabase
        .from("profiles")
        .update({ territorios: territorios as any })
        .eq("id", userId)
        .select("id, nome, territorios");

      console.log("🟢 [DEPOIS DO UPDATE]");
      console.log("  data:", data);
      console.log("  data stringified:", JSON.stringify(data));
      console.log("  error:", error);

      if (error) {
        console.error("❌ [ERRO NO UPDATE]:", error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log("✅ [UPDATE SUCESSO - DADOS RETORNADOS]");
        console.log("  territorios salvos:", data[0].territorios);
      } else {
        console.warn("⚠️ [UPDATE RETORNOU VAZIO]");
      }

      return { success: true, data };
    },
    onSuccess: () => {
      console.log("🔄 [INVALIDANDO QUERIES]");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}

// Hook para buscar territórios de um usuário
export function useUserTerritorios(userId?: string) {
  return useQuery({
    queryKey: ["user-territorios", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("territorios")
        .eq("id", userId)
        .single();

      if (error) throw error;

      return (data?.territorios as any as Territorios) || { ufs: [] };
    },
    enabled: !!userId,
  });
}
