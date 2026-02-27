import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AtivarInstalacaoData {
  instalacaoId: string;
  dataInstalacao: string;
  dataRetiradaPrevista: string;
  fotoRecibo: string; // URL da foto do recibo (controle interno)
  fotosPlaca: string[]; // URLs das fotos da placa (relatório)
}

export interface FinalizarInstalacaoData {
  instalacaoId: string;
  dataRetiradaReal: string;
  fotosRetirada: string[]; // URLs das fotos já uploadadas
  observacoes?: string;
}

export interface SubstituirEnderecoData {
  instalacaoId: string;
  motivoSubstituicao: string;
  novoEnderecoId: string;
  campanhaId: string;
  grupoId: string | null;
}

// Hook para ativar instalação
export function useAtivarInstalacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: AtivarInstalacaoData) => {
      console.log("🟢 [ATIVAR INSTALAÇÃO]", data);

      // Validações
      if (!data.fotoRecibo) {
        throw new Error("É necessário enviar a foto do recibo");
      }

      if (data.fotosPlaca.length < 2) {
        throw new Error("É necessário enviar pelo menos 2 fotos da placa");
      }

      const { data: result, error } = await supabase
        .from("instalacoes")
        .update({
          status: "ativa",
          data_instalacao: data.dataInstalacao,
          data_retirada_prevista: data.dataRetiradaPrevista,
          foto_recibo: data.fotoRecibo,
          fotos_placa: data.fotosPlaca,
          atualizado_por: user?.id,
          atualizado_em: new Date().toISOString(),
        } as any)
        .eq("id", data.instalacaoId)
        .select()
        .single();

      if (error) throw error;

      console.log("✅ [INSTALAÇÃO ATIVADA]", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-detail"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes-aviso"] });
    },
  });
}

// Hook para finalizar instalação
export function useFinalizarInstalacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: FinalizarInstalacaoData) => {
      console.log("🔴 [FINALIZAR INSTALAÇÃO]", data);

      // Validações
      if (data.fotosRetirada.length < 2) {
        throw new Error("É necessário enviar pelo menos 2 fotos da retirada");
      }

      // 1. Buscar dados da instalação
      const { data: instalacao, error: fetchError } = await supabase
        .from("instalacoes")
        .select("endereco_id")
        .eq("id", data.instalacaoId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Atualizar instalação
      const { data: result, error: updateError } = await supabase
        .from("instalacoes")
        .update({
          status: "finalizada" as any,
          data_retirada_real: data.dataRetiradaReal,
          fotos_retirada: data.fotosRetirada,
          observacoes_retirada: data.observacoes,
          atualizado_por: user?.id,
          atualizado_em: new Date().toISOString(),
        } as any)
        .eq("id", data.instalacaoId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 3. Liberar endereço no inventário
      const { error: enderecoError } = await supabase
        .from("enderecos")
        .update({ status: "disponivel" })
        .eq("id", instalacao.endereco_id);

      if (enderecoError) {
        console.error("⚠️ Erro ao liberar endereço:", enderecoError);
        // Não falha a operação, apenas loga
      }

      console.log("✅ [INSTALAÇÃO FINALIZADA]", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-detail"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes-aviso"] });
      queryClient.invalidateQueries({ queryKey: ["enderecos"] });
    },
  });
}

// Hook para substituir endereço
export function useSubstituirEndereco() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: SubstituirEnderecoData) => {
      console.log("🔄 [SUBSTITUIR ENDEREÇO]", data);

      // 1. Buscar dados da instalação antiga
      const { data: instalacaoAntiga, error: fetchError } = await supabase
        .from("instalacoes")
        .select("endereco_id")
        .eq("id", data.instalacaoId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Criar nova instalação com novo endereço
      const insertData: any = {
        campanha_id: data.campanhaId,
        endereco_id: data.novoEnderecoId,
        status: "pendente",
        atualizado_por: user?.id,
      };

      // Adicionar grupo_id apenas se existir
      if (data.grupoId) {
        insertData.grupo_id = data.grupoId;
      }

      const { data: novaInstalacao, error: createError } = await supabase
        .from("instalacoes")
        .insert(insertData)
        .select()
        .single();

      if (createError) throw createError;

      // 3. Marcar instalação antiga como substituída
      const { error: updateError } = await supabase
        .from("instalacoes")
        .update({
          status: "cancelada" as any,
          motivo_substituicao: data.motivoSubstituicao,
          substituido_por: novaInstalacao.id,
          atualizado_por: user?.id,
          atualizado_em: new Date().toISOString(),
        } as any)
        .eq("id", data.instalacaoId);

      if (updateError) throw updateError;

      // 4. Liberar endereço antigo no inventário
      const { error: enderecoAntigoError } = await supabase
        .from("enderecos")
        .update({ status: "disponivel" })
        .eq("id", instalacaoAntiga.endereco_id);

      if (enderecoAntigoError) {
        console.error("⚠️ Erro ao liberar endereço antigo:", enderecoAntigoError);
      }

      // 5. Marcar novo endereço como ocupado
      const { error: enderecoNovoError } = await supabase
        .from("enderecos")
        .update({ status: "ocupado" })
        .eq("id", data.novoEnderecoId);

      if (enderecoNovoError) {
        console.error("⚠️ Erro ao ocupar novo endereço:", enderecoNovoError);
      }

      console.log("✅ [ENDEREÇO SUBSTITUÍDO]", novaInstalacao);
      return novaInstalacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-detail"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      queryClient.invalidateQueries({ queryKey: ["enderecos"] });
    },
  });
}

// Hook para buscar instalações com aviso de retirada
export function useInstalacoesAviso(diasAviso: number = 7) {
  return useQuery({
    queryKey: ["instalacoes-aviso", diasAviso],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("buscar_instalacoes_aviso_retirada" as any, {
        _dias_aviso: diasAviso,
      });

      if (error) throw error;
      return data;
    },
  });
}

// Hook para buscar instalações atrasadas
export function useInstalacoesAtrasadas() {
  return useQuery({
    queryKey: ["instalacoes-atrasadas"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("buscar_instalacoes_atrasadas" as any);

      if (error) throw error;
      return data;
    },
  });
}

// Hook para buscar histórico de uma instalação
export function useHistoricoInstalacao(instalacaoId: string) {
  return useQuery({
    queryKey: ["historico-instalacao", instalacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_instalacoes" as any)
        .select(`
          *,
          alterado_por_profile:profiles!historico_instalacoes_alterado_por_fkey(nome)
        `)
        .eq("instalacao_id", instalacaoId)
        .order("alterado_em", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!instalacaoId,
  });
}

// Hook para upload de fotos
export function useUploadFotoInstalacao() {
  return useMutation({
    mutationFn: async ({
      file,
      campanhaId,
      instalacaoId,
      tipo,
    }: {
      file: File;
      campanhaId: string;
      instalacaoId: string;
      tipo: "instalacao" | "retirada";
    }) => {
      console.log("📸 [UPLOAD FOTO]", { campanhaId, instalacaoId, tipo, fileName: file.name });

      // Gerar nome único para o arquivo
      const timestamp = new Date().getTime();
      const extensao = file.name.split(".").pop();
      const nomeArquivo = `${tipo}_${timestamp}.${extensao}`;

      // Gerar path
      const path = `${campanhaId}/${instalacaoId}/${tipo}/${nomeArquivo}`;

      // Upload
      const { data, error } = await supabase.storage
        .from("instalacoes-fotos")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Obter URL pública (assinada)
      const { data: urlData } = supabase.storage
        .from("instalacoes-fotos")
        .getPublicUrl(path);

      console.log("✅ [FOTO UPLOADADA]", urlData.publicUrl);

      return {
        path: data.path,
        url: urlData.publicUrl,
      };
    },
  });
}

// Hook para deletar foto
export function useDeletarFotoInstalacao() {
  return useMutation({
    mutationFn: async (path: string) => {
      console.log("🗑️ [DELETAR FOTO]", path);

      const { error } = await supabase.storage.from("instalacoes-fotos").remove([path]);

      if (error) throw error;

      console.log("✅ [FOTO DELETADA]");
      return true;
    },
  });
}
