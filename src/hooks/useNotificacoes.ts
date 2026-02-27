import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notificacao {
  id: string;
  user_id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criado_em: string;
}

export function useNotificacoes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notificacoes", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .eq("user_id", user.id)
        .order("criado_em", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Notificacao[];
    },
    enabled: !!user,
  });
}

export function useNotificacoesNaoLidas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notificacoes-nao-lidas", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { data, error } = await supabase.rpc("contar_notificacoes_nao_lidas", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as number;
    },
    enabled: !!user,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
}

export function useMarcarNotificacaoLida() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificacaoId: string) => {
      const { error } = await supabase.rpc("marcar_notificacao_lida", {
        notificacao_id: notificacaoId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes-nao-lidas", user?.id] });
    },
  });
}

export function useMarcarTodasLidas() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("marcar_todas_notificacoes_lidas");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes-nao-lidas", user?.id] });
    },
  });
}

export function useCriarNotificacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificacao: {
      user_id: string;
      titulo: string;
      mensagem: string;
    }) => {
      const { data, error } = await supabase
        .from("notificacoes")
        .insert(notificacao)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes", variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes-nao-lidas", variables.user_id] });
    },
  });
}
