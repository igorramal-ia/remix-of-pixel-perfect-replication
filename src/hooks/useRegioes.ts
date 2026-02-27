import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Lista fixa de UFs brasileiras
export const UFS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export interface Cidade {
  uf: string;
  cidade: string;
}

export interface Comunidade {
  comunidade: string;
  cidade: string;
  uf: string;
}

// Buscar cidades únicas de uma UF (da tabela enderecos)
export function useCidadesPorUF(uf: string | null) {
  return useQuery({
    queryKey: ["cidades", uf],
    queryFn: async () => {
      if (!uf) return [];

      // Buscar cidades únicas da tabela enderecos
      const { data, error } = await supabase
        .from("enderecos")
        .select("cidade")
        .eq("uf", uf);

      if (error) throw error;

      // Remover duplicatas e ordenar
      const cidadesSet = new Set<string>();
      data?.forEach((e: any) => cidadesSet.add(e.cidade));

      return Array.from(cidadesSet).sort();
    },
    enabled: !!uf,
  });
}

// Buscar comunidades únicas de uma cidade
export function useComunidadesPorCidade(uf: string | null, cidade: string | null) {
  return useQuery({
    queryKey: ["comunidades", uf, cidade],
    queryFn: async () => {
      if (!uf || !cidade) return [];

      const { data, error } = await supabase
        .from("enderecos")
        .select("comunidade")
        .eq("uf", uf)
        .eq("cidade", cidade);

      if (error) throw error;

      // Remover duplicatas e ordenar
      const comunidadesSet = new Set<string>();
      data?.forEach((e: any) => comunidadesSet.add(e.comunidade));

      return Array.from(comunidadesSet).sort();
    },
    enabled: !!uf && !!cidade,
  });
}

// Adicionar nova cidade (apenas retorna sucesso por enquanto)
// A tabela cidades_cobertura precisa ser criada via SQL Editor do Supabase
export function useAdicionarCidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uf, cidade }: { uf: string; cidade: string }) => {
      // Retorna sucesso - a cidade será usada diretamente no grupo
      // Futuramente, quando a tabela cidades_cobertura existir, salvar aqui
      return { uf, cidade, id: crypto.randomUUID(), criado_em: new Date().toISOString() };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cidades", variables.uf] });
    },
  });
}

// Buscar endereços disponíveis por região
export function useEnderecosDisponiveis(params: {
  uf: string;
  cidade: string;
  comunidade?: string | null;
}) {
  return useQuery({
    queryKey: ["enderecos-disponiveis", params.uf, params.cidade, params.comunidade],
    queryFn: async () => {
      let query = supabase
        .from("enderecos")
        .select("id, endereco, comunidade, cidade, uf, lat, long")
        .eq("status", "disponivel")
        .eq("uf", params.uf)
        .eq("cidade", params.cidade);

      // Se comunidade específica foi selecionada
      if (params.comunidade && params.comunidade !== "CIDADE_INTEIRA") {
        query = query.eq("comunidade", params.comunidade);
      }

      const { data, error } = await query.order("comunidade");

      if (error) throw error;
      return data || [];
    },
    enabled: !!params.uf && !!params.cidade,
  });
}
