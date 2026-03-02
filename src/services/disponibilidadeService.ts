import { supabase } from "@/integrations/supabase/client";
import { differenceInDays } from "date-fns";

export interface EnderecoDisponivel {
  id: string;
  endereco: string;
  comunidade: string;
  cidade: string;
  uf: string;
  lat: number | null;
  long: number | null;
  status_ocupacao: "disponivel" | "ocupado" | "em_transicao";
}

/**
 * Busca endereços disponíveis para sugestão em campanhas
 * 
 * Regras:
 * - Disponível: Sem instalação ativa OU finalizada há mais de 2 dias
 * - Ocupado: Tem instalação ativa
 * - Em transição: Finalizada há menos de 2 dias
 */
export async function buscarEnderecosDisponiveis(
  uf?: string,
  cidade?: string
): Promise<EnderecoDisponivel[]> {
  try {
    // Buscar todos os endereços
    let query = supabase
      .from("enderecos")
      .select(`
        id,
        endereco,
        comunidade,
        cidade,
        uf,
        lat,
        long
      `);

    if (uf) query = query.eq("uf", uf);
    if (cidade) query = query.eq("cidade", cidade);

    const { data: enderecos, error: enderecosError } = await query;

    if (enderecosError) {
      console.error("❌ Erro ao buscar endereços:", enderecosError);
      throw enderecosError;
    }

    if (!enderecos || enderecos.length === 0) {
      return [];
    }

    // Buscar instalações para cada endereço
    const enderecosIds = enderecos.map((e) => e.id);
    const { data: instalacoes, error: instalacoesError } = await supabase
      .from("instalacoes")
      .select("endereco_id, status, data_retirada_real")
      .in("endereco_id", enderecosIds);

    if (instalacoesError) {
      console.error("❌ Erro ao buscar instalações:", instalacoesError);
      throw instalacoesError;
    }

    // Processar cada endereço para determinar disponibilidade
    const enderecosComStatus: EnderecoDisponivel[] = enderecos.map((endereco) => {
      const instalacoesDoEndereco = instalacoes?.filter(
        (i) => i.endereco_id === endereco.id
      ) || [];

      // Verificar se tem instalação ativa
      const temInstalacaoAtiva = instalacoesDoEndereco.some(
        (i) => i.status === "ativa"
      );

      if (temInstalacaoAtiva) {
        return {
          id: endereco.id,
          endereco: endereco.endereco,
          comunidade: endereco.comunidade,
          cidade: endereco.cidade,
          uf: endereco.uf,
          lat: endereco.lat,
          long: endereco.long,
          status_ocupacao: "ocupado" as const,
        };
      }

      // Verificar se tem instalação finalizada recentemente (< 2 dias)
      const instalacaoRecente = instalacoesDoEndereco.find((i) => {
        if (i.status === "finalizada" && i.data_retirada_real) {
          const diasDesdeRetirada = differenceInDays(
            new Date(),
            new Date(i.data_retirada_real)
          );
          return diasDesdeRetirada < 2;
        }
        return false;
      });

      if (instalacaoRecente) {
        return {
          id: endereco.id,
          endereco: endereco.endereco,
          comunidade: endereco.comunidade,
          cidade: endereco.cidade,
          uf: endereco.uf,
          lat: endereco.lat,
          long: endereco.long,
          status_ocupacao: "em_transicao" as const,
        };
      }

      // Disponível
      return {
        id: endereco.id,
        endereco: endereco.endereco,
        comunidade: endereco.comunidade,
        cidade: endereco.cidade,
        uf: endereco.uf,
        lat: endereco.lat,
        long: endereco.long,
        status_ocupacao: "disponivel" as const,
      };
    });

    // Retornar apenas disponíveis (não ocupados, não em transição)
    return enderecosComStatus.filter((e) => e.status_ocupacao === "disponivel");
  } catch (error) {
    console.error("❌ Erro ao buscar endereços disponíveis:", error);
    return [];
  }
}
