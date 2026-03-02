import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Campaign {
  id: string;
  nome: string;
  cliente: string;
  data_inicio: string | null;
  data_fim: string | null;
  cidade: string | null;
  gestor_id: string | null;
  criado_por: string | null;
  criado_em: string;
  total_pontos: number;
  pontos_instalados: number;
  pontos_finalizados: number;
  progresso: number;
  gestor_nome: string | null;
  criado_por_nome: string | null;
  coordenadores: Array<{ id: string; nome: string }>;
}

export interface CampaignDetail extends Campaign {
  enderecos: Array<{
    id: string; // ID da instalação
    endereco_id: string; // ID do endereço
    endereco: string;
    comunidade: string;
    cidade: string;
    uf: string;
    status: string;
    lat: number | null;
    long: number | null;
    instalacao_status: string | null;
    data_instalacao: string | null;
    data_expiracao: string | null;
    data_retirada_prevista: string | null;
    grupo_id: string | null;
  }>;
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data: campanhas, error } = await supabase
        .from("campanhas")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) throw error;

      const campanhasComDados = await Promise.all(
        (campanhas || []).map(async (campanha: any) => {
          // Buscar nome do gestor se existir
          let gestorNome = null;
          if (campanha.gestor_id) {
            const { data: gestorData } = await supabase
              .from("profiles")
              .select("nome")
              .eq("id", campanha.gestor_id)
              .single();
            
            gestorNome = gestorData?.nome || null;
          }

          // Buscar total de instalações
          const { count: totalPontos } = await supabase
            .from("instalacoes")
            .select("*", { count: "exact", head: true })
            .eq("campanha_id", campanha.id);

          // Buscar instalações ativas
          const { count: pontosInstalados } = await supabase
            .from("instalacoes")
            .select("*", { count: "exact", head: true })
            .eq("campanha_id", campanha.id)
            .eq("status", "ativa");

          // Buscar instalações finalizadas
          const { count: pontosFinalizados } = await supabase
            .from("instalacoes")
            .select("*", { count: "exact", head: true })
            .eq("campanha_id", campanha.id)
            .eq("status", "finalizada");

          // Buscar coordenadores vinculados
          const { data: coordenadoresVinculo } = await supabase
            .from("campanha_coordenadores")
            .select("coordenador_id")
            .eq("campanha_id", campanha.id);

          console.log(`📊 [Campanha ${campanha.nome}] Vínculos:`, coordenadoresVinculo);

          let coordenadores = [];
          if (coordenadoresVinculo && coordenadoresVinculo.length > 0) {
            const coordenadorIds = coordenadoresVinculo.map((c) => c.coordenador_id);
            console.log(`  IDs dos coordenadores:`, coordenadorIds);
            
            const { data: coordenadoresData } = await supabase
              .from("profiles")
              .select("id, nome")
              .in("id", coordenadorIds);

            console.log(`  Dados dos coordenadores:`, coordenadoresData);
            coordenadores = coordenadoresData || [];
          } else {
            console.log(`  ⚠️ Nenhum vínculo encontrado`);
          }

          const pontosRealizados = (pontosInstalados || 0) + (pontosFinalizados || 0);
          const progresso =
            totalPontos && totalPontos > 0
              ? Math.round((pontosRealizados / totalPontos) * 100)
              : 0;

          return {
            id: campanha.id,
            nome: campanha.nome,
            cliente: campanha.cliente,
            data_inicio: campanha.data_inicio,
            data_fim: campanha.data_fim,
            cidade: campanha.cidade,
            gestor_id: campanha.gestor_id,
            criado_em: campanha.criado_em,
            total_pontos: totalPontos || 0,
            pontos_instalados: pontosInstalados || 0,
            pontos_finalizados: pontosFinalizados || 0,
            progresso,
            gestor_nome: gestorNome,
            coordenadores: coordenadores || [],
          };
        })
      );

      return campanhasComDados as Campaign[];
    },
  });
}

export function useCampaignDetail(id: string) {
  return useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      // Buscar campanha
      const { data: campanha, error: campanhaError } = await supabase
        .from("campanhas")
        .select("*")
        .eq("id", id)
        .single();

      if (campanhaError) throw campanhaError;

      // Buscar nome do gestor se existir
      let gestorNome = null;
      if (campanha.gestor_id) {
        const { data: gestorData } = await supabase
          .from("profiles")
          .select("nome")
          .eq("id", campanha.gestor_id)
          .single();
        
        gestorNome = gestorData?.nome || null;
      }

      // Buscar nome do criador se existir, senão usa o gestor
      let criadoPorNome = null;
      const criadorId = campanha.criado_por || campanha.gestor_id;
      
      if (criadorId) {
        const { data: criadorData } = await supabase
          .from("profiles")
          .select("nome")
          .eq("id", criadorId)
          .single();
        
        criadoPorNome = criadorData?.nome || null;
      }

      // Buscar instalações e endereços (queries separadas)
      const { data: instalacoes, error: instalacoesError } = await supabase
        .from("instalacoes")
        .select("id, endereco_id, status, data_instalacao, data_expiracao, data_retirada_prevista")
        .eq("campanha_id", id);

      if (instalacoesError) {
        console.error("❌ Erro ao buscar instalações:", instalacoesError);
        throw instalacoesError;
      }

      console.log(`📍 [CampaignDetail] Instalações:`, instalacoes);

      // Buscar dados dos endereços
      let enderecosComInstalacao = [];
      if (instalacoes && instalacoes.length > 0) {
        const enderecoIds = instalacoes.map((i) => i.endereco_id);
        const { data: enderecosData, error: enderecosError } = await supabase
          .from("enderecos")
          .select("id, endereco, comunidade, cidade, uf, status, lat, long")
          .in("id", enderecoIds);

        if (enderecosError) {
          console.error("❌ Erro ao buscar endereços:", enderecosError);
        }

        console.log(`  Endereços encontrados:`, enderecosData);

        // Fazer merge de instalações com endereços
        enderecosComInstalacao = instalacoes.map((instalacao) => {
          const endereco = enderecosData?.find((e) => e.id === instalacao.endereco_id);
          return {
            id: instalacao.id, // ID da instalação, não do endereço
            endereco_id: endereco?.id || instalacao.endereco_id,
            endereco: endereco?.endereco || "",
            comunidade: endereco?.comunidade || "",
            cidade: endereco?.cidade || "",
            uf: endereco?.uf || "",
            status: endereco?.status || "disponivel",
            lat: endereco?.lat || null,
            long: endereco?.long || null,
            instalacao_status: instalacao.status,
            data_instalacao: instalacao.data_instalacao,
            data_expiracao: instalacao.data_expiracao,
            data_retirada_prevista: instalacao.data_retirada_prevista,
            grupo_id: null, // Temporariamente null até criar a coluna
          };
        });
      }

      // Buscar coordenadores (queries separadas)
      const { data: coordenadoresVinculo } = await supabase
        .from("campanha_coordenadores")
        .select("coordenador_id")
        .eq("campanha_id", id);

      console.log(`📊 [CampaignDetail] Vínculos:`, coordenadoresVinculo);

      let coordenadores = [];
      if (coordenadoresVinculo && coordenadoresVinculo.length > 0) {
        const coordenadorIds = coordenadoresVinculo.map((c) => c.coordenador_id);
        const { data: coordenadoresData } = await supabase
          .from("profiles")
          .select("id, nome")
          .in("id", coordenadorIds);

        console.log(`  Coordenadores encontrados:`, coordenadoresData);
        coordenadores = coordenadoresData || [];
      }

      const totalPontos = instalacoes?.length || 0;
      const pontosInstalados =
        instalacoes?.filter((i) => i.status === "ativa").length || 0;
      const pontosFinalizados =
        instalacoes?.filter((i) => i.status === "finalizada").length || 0;
      const pontosRealizados = pontosInstalados + pontosFinalizados;
      const progresso =
        totalPontos > 0 ? Math.round((pontosRealizados / totalPontos) * 100) : 0;

      return {
        id: campanha.id,
        nome: campanha.nome,
        cliente: campanha.cliente,
        data_inicio: campanha.data_inicio,
        data_fim: campanha.data_fim,
        cidade: campanha.cidade,
        gestor_id: campanha.gestor_id,
        criado_por: campanha.criado_por,
        criado_em: campanha.criado_em,
        total_pontos: totalPontos,
        pontos_instalados: pontosInstalados,
        pontos_finalizados: pontosFinalizados,
        progresso,
        gestor_nome: gestorNome,
        criado_por_nome: criadoPorNome,
        coordenadores: coordenadores || [],
        enderecos: enderecosComInstalacao,
      } as CampaignDetail;
    },
    enabled: !!id,
  });
}

export function useCoordenadores() {
  return useQuery({
    queryKey: ["coordenadores"],
    queryFn: async () => {
      console.log("🔍 [useCoordenadores] Iniciando busca...");
      
      // Buscar todos os profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, territorios")
        .order("nome");

      console.log("📊 [PROFILES] Resultado da query:");
      console.log("  data:", profilesData);
      console.log("  error:", profilesError);
      console.log("  quantidade:", profilesData?.length || 0);

      if (profilesError) throw profilesError;

      // Buscar roles de coordenadores
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "coordenador");

      console.log("👥 [USER_ROLES] Resultado da query:");
      console.log("  data:", rolesData);
      console.log("  error:", rolesError);
      console.log("  quantidade:", rolesData?.length || 0);

      if (rolesError) throw rolesError;

      // Filtrar apenas profiles que são coordenadores
      const coordenadores = profilesData?.filter((profile: any) =>
        rolesData?.some((role: any) => role.user_id === profile.id)
      );

      console.log("✅ [MERGE] Coordenadores após filtro:");
      console.log("  coordenadores:", coordenadores);
      console.log("  quantidade:", coordenadores?.length || 0);

      const resultado = coordenadores?.map((profile: any) => ({
        id: profile.id,
        nome: profile.nome,
        territorios: profile.territorios || { cidades: [], comunidades: [] },
      })) || [];

      console.log("🎯 [RESULTADO FINAL]:", resultado);

      return resultado;
    },
  });
}

export function useEnderecosDisponiveis(uf?: string, cidade?: string) {
  return useQuery({
    queryKey: ["enderecos-disponiveis", uf, cidade],
    queryFn: async () => {
      // Importar dinamicamente para evitar circular dependency
      const { buscarEnderecosDisponiveis } = await import("@/services/disponibilidadeService");
      return buscarEnderecosDisponiveis(uf, cidade);
    },
  });
}

interface NovaCampanha {
  nome: string;
  cliente: string;
  data_inicio: string;
  data_fim: string;
  cidade: string;
  coordenadores_ids: string[];
}

export function useCreateCampanha() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (novaCampanha: NovaCampanha) => {
      // Criar campanha
      const { data: campanha, error: campanhaError } = await supabase
        .from("campanhas")
        .insert({
          nome: novaCampanha.nome,
          cliente: novaCampanha.cliente,
          data_inicio: novaCampanha.data_inicio,
          data_fim: novaCampanha.data_fim,
          cidade: novaCampanha.cidade,
          gestor_id: user?.id,
        })
        .select()
        .single();

      if (campanhaError) throw campanhaError;

      // Vincular coordenadores
      if (novaCampanha.coordenadores_ids.length > 0) {
        const { error: coordenadoresError } = await supabase
          .from("campanha_coordenadores")
          .insert(
            novaCampanha.coordenadores_ids.map((coordenador_id) => ({
              campanha_id: campanha.id,
              coordenador_id,
            }))
          );

        if (coordenadoresError) throw coordenadoresError;
      }

      return campanha;
    },
    onSuccess: () => {
      // Invalidar TODAS as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campanhas-ativas"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-detail"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["coordenador-dashboard"] });
    },
  });
}

interface AdicionarPontos {
  campanha_id: string;
  enderecos_ids: string[];
}

export function useAdicionarPontos() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ campanha_id, enderecos_ids }: AdicionarPontos) => {
      const { data, error } = await supabase
        .from("instalacoes")
        .insert(
          enderecos_ids.map((endereco_id) => ({
            campanha_id,
            endereco_id,
            representante_id: user?.id,
            status: "pendente" as const,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar TODAS as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["campaign", variables.campanha_id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-detail"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["enderecos"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["coordenador-dashboard"] });
    },
  });
}

export function useDeleteCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campanhaId: string) => {
      // 1. Deletar instalações primeiro
      const { error: instalacoesError } = await supabase
        .from("instalacoes")
        .delete()
        .eq("campanha_id", campanhaId);

      if (instalacoesError) throw instalacoesError;

      // 2. Deletar vínculos com coordenadores
      const { error: coordenadoresError } = await supabase
        .from("campanha_coordenadores")
        .delete()
        .eq("campanha_id", campanhaId);

      if (coordenadoresError) throw coordenadoresError;

      // 3. Deletar notificações relacionadas (se houver)
      // Buscar notificações que mencionam a campanha
      const { data: notificacoes } = await supabase
        .from("notificacoes")
        .select("id, mensagem")
        .ilike("mensagem", `%campanha%${campanhaId}%`);

      if (notificacoes && notificacoes.length > 0) {
        const notificacaoIds = notificacoes.map((n) => n.id);
        await supabase
          .from("notificacoes")
          .delete()
          .in("id", notificacaoIds);
      }

      // 4. Finalmente, deletar a campanha
      const { error: campanhaError } = await supabase
        .from("campanhas")
        .delete()
        .eq("id", campanhaId);

      if (campanhaError) throw campanhaError;
    },
    onSuccess: () => {
      // Invalidar TODAS as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campanhas-ativas"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["enderecos"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["coordenador-dashboard"] });
    },
  });
}

export function useUpdateCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      nome,
      cliente,
      data_inicio,
      data_fim,
    }: {
      id: string;
      nome: string;
      cliente: string;
      data_inicio: string;
      data_fim: string;
    }) => {
      const { data, error } = await supabase
        .from("campanhas")
        .update({
          nome,
          cliente,
          data_inicio,
          data_fim,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar TODAS as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-detail"] });
      queryClient.invalidateQueries({ queryKey: ["campanhas-ativas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["coordenador-dashboard"] });
    },
  });
}
