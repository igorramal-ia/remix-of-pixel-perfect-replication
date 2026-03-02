import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { RelatorioGerado, FiltrosRelatorios } from '@/types/relatorios';
import { extrairPathDoStorage } from '@/services/storageService';

/**
 * Hook para buscar histórico de relatórios com filtros
 */
export function useRelatorios(filtros: FiltrosRelatorios = {}) {
  return useQuery({
    queryKey: ['relatorios', filtros],
    queryFn: async () => {
      let query = supabase
        .from('relatorios_gerados' as any)
        .select(
          `
          *,
          campanha:campanhas(nome, cliente),
          gerado_por_profile:profiles!relatorios_gerados_gerado_por_fkey(nome)
        `
        )
        .order('gerado_em', { ascending: false });

      if (filtros.campanhaId && filtros.campanhaId !== 'todas') {
        query = query.eq('campanha_id', filtros.campanhaId);
      }

      if (filtros.tipo && filtros.tipo !== 'todos') {
        query = query.eq('tipo', filtros.tipo);
      }

      if (filtros.dataInicio) {
        query = query.gte('gerado_em', filtros.dataInicio);
      }

      if (filtros.dataFim) {
        query = query.lte('gerado_em', filtros.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as any as RelatorioGerado[];
    },
  });
}

/**
 * Hook para deletar relatório (apenas admins/operações)
 */
export function useDeletarRelatorio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (relatorioId: string) => {
      // 1. Buscar dados do relatório
      const { data: relatorio, error: fetchError } = await supabase
        .from('relatorios_gerados' as any)
        .select('url_arquivo, campanha_id')
        .eq('id', relatorioId)
        .single();

      if (fetchError || !relatorio) {
        throw new Error('Relatório não encontrado');
      }

      // 2. Extrair path do arquivo
      const path = extrairPathDoStorage((relatorio as any).url_arquivo);

      // 3. Deletar arquivo do Storage
      const { error: storageError } = await supabase.storage
        .from('relatorios')
        .remove([path]);

      if (storageError) {
        console.error('Erro ao deletar arquivo do storage:', storageError);
        // Continua mesmo com erro no storage
      }

      // 4. Deletar registro do banco
      const { error: deleteError } = await supabase
        .from('relatorios_gerados' as any)
        .delete()
        .eq('id', relatorioId);

      if (deleteError) {
        throw new Error('Erro ao deletar relatório');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relatorios'] });
      toast.success('Relatório deletado com sucesso');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar relatório:', error);
      toast.error(error.message || 'Erro ao deletar relatório');
    },
  });
}
