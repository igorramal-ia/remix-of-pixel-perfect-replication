import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { geocodeEAtualizarEndereco } from "@/services/geocodingService";

export interface InventoryItem {
  id: string;
  endereco: string;
  comunidade: string;
  cidade: string;
  uf: string;
  status: "disponivel" | "ocupado" | "inativo" | "manutencao";
  lat: number | null;
  long: number | null;
  proprietario_nome: string | null;
  campanha_nome: string | null;
  dias_restantes: number | null;
  data_expiracao: string | null;
}

export function useInventory() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      // Buscar endereços com proprietários
      const { data: enderecos, error: enderecosError } = await supabase
        .from("enderecos")
        .select(`
          id,
          endereco,
          comunidade,
          cidade,
          uf,
          status,
          lat,
          long,
          proprietarios (
            nome
          )
        `)
        .order("criado_em", { ascending: false });

      if (enderecosError) throw enderecosError;

      // Para cada endereço, buscar instalação ativa e campanha
      const inventoryItems: InventoryItem[] = await Promise.all(
        (enderecos || []).map(async (endereco: any) => {
          // Buscar instalação ativa para este endereço
          const { data: instalacao } = await supabase
            .from("instalacoes")
            .select(`
              data_expiracao,
              campanha_id,
              campanhas (
                nome
              )
            `)
            .eq("endereco_id", endereco.id)
            .eq("status", "ativa")
            .single();

          // Calcular dias restantes
          let diasRestantes: number | null = null;
          if (instalacao?.data_expiracao) {
            const hoje = new Date();
            const expiracao = new Date(instalacao.data_expiracao);
            const diffTime = expiracao.getTime() - hoje.getTime();
            diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          return {
            id: endereco.id,
            endereco: endereco.endereco,
            comunidade: endereco.comunidade,
            cidade: endereco.cidade,
            uf: endereco.uf,
            status: endereco.status,
            lat: endereco.lat,
            long: endereco.long,
            proprietario_nome: endereco.proprietarios?.[0]?.nome || null,
            campanha_nome: instalacao?.campanhas?.nome || null,
            dias_restantes: diasRestantes,
            data_expiracao: instalacao?.data_expiracao || null,
          };
        })
      );

      return inventoryItems;
    },
  });
}

interface NovoEndereco {
  uf: string;
  cidade: string;
  comunidade: string;
  endereco: string;
  lat?: number;
  long?: number;
}

export function useCreateEndereco() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (novoEndereco: NovoEndereco) => {
      const { data, error } = await supabase
        .from("enderecos")
        .insert({
          uf: novoEndereco.uf,
          cidade: novoEndereco.cidade,
          comunidade: novoEndereco.comunidade,
          endereco: novoEndereco.endereco,
          lat: novoEndereco.lat || null,
          long: novoEndereco.long || null,
          status: "disponivel",
          criado_por: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Buscar coordenadas automaticamente (não bloqueia)
      if (data && !novoEndereco.lat && !novoEndereco.long) {
        console.log('🗺️ Buscando coordenadas automaticamente...');
        geocodeEAtualizarEndereco(
          data.id,
          novoEndereco.endereco,
          novoEndereco.cidade,
          novoEndereco.uf
        ).then((success) => {
          if (success) {
            console.log('✅ Coordenadas atualizadas automaticamente');
            // Invalidar cache para atualizar UI
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            queryClient.invalidateQueries({ queryKey: ["enderecos"] });
          } else {
            console.warn('⚠️ Não foi possível obter coordenadas automaticamente');
          }
        });
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidar TODAS as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["enderecos"] });
      queryClient.invalidateQueries({ queryKey: ["total-pontos"] });
      queryClient.invalidateQueries({ queryKey: ["distribuicao-status"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["coordenador-dashboard"] });
    },
  });
}

// Função para buscar coordenadas via Google Maps Geocoding API
export async function geocodeAddress(
  endereco: string,
  cidade: string,
  uf: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const address = `${endereco}, ${cidade}, ${uf}, Brasil`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar coordenadas:", error);
    return null;
  }
}
