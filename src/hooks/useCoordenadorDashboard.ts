import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CoordenadorStats {
  campanhas_ativas: number;
  total_enderecos: number;
  instalacoes_ativas: number;
  instalacoes_pendentes: number;
  progresso_geral: number;
}

export interface CampanhaCoordenador {
  id: string;
  nome: string;
  cliente: string;
  data_inicio: string;
  data_fim: string;
  regiao: string;
  total_pontos: number;
  pontos_instalados: number;
  pontos_pendentes: number;
  progresso: number;
}

export interface Territorio {
  uf: string;
  cidades: Array<{
    nome: string;
    comunidades: Array<{
      nome: string;
      total_enderecos: number;
    }>;
  }>;
}

export function useCoordenadorStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["coordenador-stats", user?.id],
    queryFn: async () => {
      console.log("📊 [useCoordenadorStats] Iniciando...");
      console.log("  user?.id:", user?.id);
      
      if (!user?.id) {
        console.error("❌ [useCoordenadorStats] Usuário não autenticado");
        throw new Error("Usuário não autenticado");
      }

      try {
        // Buscar campanhas ativas do coordenador
        const hoje = new Date().toISOString().split("T")[0];
        
        console.log("  Buscando vínculos...");
        const { data: vinculos, error: vinculosError } = await supabase
          .from("campanha_coordenadores")
          .select("campanha_id")
          .eq("coordenador_id", user.id);

        if (vinculosError) {
          console.error("❌ [useCoordenadorStats] Erro ao buscar vínculos:", vinculosError);
          throw vinculosError;
        }

        console.log("  Vínculos encontrados:", vinculos);

        const campanhaIds = vinculos?.map((v) => v.campanha_id) || [];

        if (campanhaIds.length === 0) {
          console.log("  ⚠️ Nenhuma campanha vinculada");
          return {
            campanhas_ativas: 0,
            total_enderecos: 0,
            instalacoes_ativas: 0,
            instalacoes_pendentes: 0,
            progresso_geral: 0,
          };
        }

      // Buscar campanhas ativas
      const { data: campanhas, error: campanhasError } = await supabase
        .from("campanhas")
        .select("id")
        .in("id", campanhaIds)
        .gte("data_fim", hoje);

      if (campanhasError) throw campanhasError;

      const campanhasAtivasIds = campanhas?.map((c) => c.id) || [];

      // Buscar instalações do coordenador
      const { data: instalacoes, error: instalacoesError } = await supabase
        .from("instalacoes")
        .select("id, status, campanha_id")
        .eq("representante_id", user.id);

      if (instalacoesError) throw instalacoesError;

      // Filtrar apenas instalações de campanhas ativas
      const instalacoesAtivas = instalacoes?.filter((i) =>
        campanhasAtivasIds.includes(i.campanha_id)
      ) || [];

      const totalInstalacoes = instalacoesAtivas.length;
      const instalacoesAtivasCount = instalacoesAtivas.filter(
        (i) => i.status === "ativa"
      ).length;
      const instalacoesPendentesCount = instalacoesAtivas.filter(
        (i) => i.status === "pendente"
      ).length;

      // Buscar territórios do coordenador
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("territorios")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const territorios = profile?.territorios || { comunidades: [] };
      const totalEnderecos = territorios.comunidades?.length || 0;

      console.log("✅ [useCoordenadorStats] Concluído com sucesso");
      return {
        campanhas_ativas: campanhasAtivasIds.length,
        total_enderecos: totalEnderecos,
        instalacoes_ativas: instalacoesAtivasCount,
        instalacoes_pendentes: instalacoesPendentesCount,
        progresso_geral:
          totalInstalacoes > 0
            ? Math.round((instalacoesAtivasCount / totalInstalacoes) * 100)
            : 0,
      } as CoordenadorStats;
      } catch (error) {
        console.error("❌ [useCoordenadorStats] Erro:", error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });
}

export function useCampanhasCoordenador() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["campanhas-coordenador", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Buscar vínculos do coordenador
      const { data: vinculos, error: vinculosError } = await supabase
        .from("campanha_coordenadores")
        .select("campanha_id")
        .eq("coordenador_id", user.id);

      if (vinculosError) throw vinculosError;

      const campanhaIds = vinculos?.map((v) => v.campanha_id) || [];

      if (campanhaIds.length === 0) return [];

      // Buscar campanhas ativas
      const hoje = new Date().toISOString().split("T")[0];
      
      const { data: campanhas, error: campanhasError } = await supabase
        .from("campanhas")
        .select("*")
        .in("id", campanhaIds)
        .gte("data_fim", hoje)
        .order("data_inicio", { ascending: false });

      if (campanhasError) throw campanhasError;

      // Para cada campanha, buscar instalações do coordenador
      const campanhasComDados = await Promise.all(
        (campanhas || []).map(async (campanha) => {
          const { data: instalacoes, error: instalacoesError } = await supabase
            .from("instalacoes")
            .select("id, status")
            .eq("campanha_id", campanha.id)
            .eq("representante_id", user.id);

          if (instalacoesError) throw instalacoesError;

          const totalPontos = instalacoes?.length || 0;
          const pontosInstalados =
            instalacoes?.filter((i) => i.status === "ativa").length || 0;
          const pontosPendentes =
            instalacoes?.filter((i) => i.status === "pendente").length || 0;

          return {
            id: campanha.id,
            nome: campanha.nome,
            cliente: campanha.cliente,
            data_inicio: campanha.data_inicio,
            data_fim: campanha.data_fim,
            regiao: campanha.cidade || "",
            total_pontos: totalPontos,
            pontos_instalados: pontosInstalados,
            pontos_pendentes: pontosPendentes,
            progresso:
              totalPontos > 0
                ? Math.round((pontosInstalados / totalPontos) * 100)
                : 0,
          } as CampanhaCoordenador;
        })
      );

      return campanhasComDados;
    },
    enabled: !!user?.id,
  });
}

export function useTerritoriosCoordenador() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["territorios-coordenador", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Buscar territórios do coordenador
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("territorios")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const territorios = profile?.territorios || {
        ufs: [],
        cidades: [],
        comunidades: [],
      };

      // Buscar quantidade de endereços por comunidade
      const comunidadesComEnderecos = await Promise.all(
        (territorios.comunidades || []).map(async (comunidade: string) => {
          const { count, error } = await supabase
            .from("enderecos")
            .select("*", { count: "exact", head: true })
            .eq("comunidade", comunidade);

          if (error) throw error;

          return {
            nome: comunidade,
            total_enderecos: count || 0,
          };
        })
      );

      // Agrupar por UF e Cidade
      const territoriosAgrupados: Territorio[] = [];

      (territorios.ufs || []).forEach((uf: string) => {
        const cidadesDoUF = territorios.cidades?.filter((c: string) =>
          c.includes(uf)
        ) || [];

        territoriosAgrupados.push({
          uf,
          cidades: cidadesDoUF.map((cidade: string) => ({
            nome: cidade,
            comunidades: comunidadesComEnderecos.filter((com) =>
              // Filtrar comunidades que pertencem a esta cidade
              // (simplificado - pode precisar de lógica mais robusta)
              true
            ),
          })),
        });
      });

      return territoriosAgrupados;
    },
    enabled: !!user?.id,
  });
}
