import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  GerarRelatorioParams,
  RelatorioGerado,
  Instalacao,
  DadosRelatorio,
} from '@/types/relatorios';
import { gerarPPT, filtrarInstalacoesPorTipo } from '@/services/relatorioService';
import { agruparHierarquicamente } from '@/services/agrupamentoService';
import {
  uploadParaStorage,
  downloadBlob,
  gerarNomeArquivo,
  extrairPathDoStorage,
} from '@/services/storageService';
import {
  validarNumeroPI,
  validarCampanha,
  validarInstalacoes,
  validarLimites,
} from '@/utils/validacoes';

export function useGerarRelatorio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: GerarRelatorioParams): Promise<RelatorioGerado> => {
      let uploadPath: string | null = null;
      let registroId: string | null = null;

      try {
        // Validações
        validarNumeroPI(params.numeroPI);
        await validarCampanha(params.campanhaId);
        await validarInstalacoes(params.campanhaId, params.tipo);
        await validarLimites(params.campanhaId, params.tipo);

        // 1. Buscar dados da campanha
        const { data: campanha, error: campanhaError } = await supabase
          .from('campanhas')
          .select('id, nome, cliente, data_inicio, data_fim')
          .eq('id', params.campanhaId)
          .single();

        if (campanhaError || !campanha) {
          throw new Error('Erro ao buscar dados da campanha');
        }

        // 2. Buscar instalações
        const statusPermitidos =
          params.tipo === 'parcial' ? ['ativa'] : ['ativa', 'finalizada'];

        const { data: instalacoes, error: instalacoesError } = await supabase
          .from('instalacoes')
          .select(
            `
            id,
            status,
            data_instalacao,
            data_retirada_real,
            fotos_placa,
            fotos_retirada,
            endereco:enderecos (
              id,
              endereco,
              comunidade,
              cidade,
              uf,
              latitude,
              longitude
            )
          `
          )
          .eq('campanha_id', params.campanhaId)
          .in('status', statusPermitidos as any);

        if (instalacoesError) {
          throw new Error('Erro ao buscar instalações');
        }

        // Transformar dados
        const instalacoesFormatadas: Instalacao[] = (instalacoes || []).map((inst: any) => ({
          id: inst.id,
          endereco_id: inst.endereco.id,
          endereco: inst.endereco.endereco,
          comunidade: inst.endereco.comunidade,
          cidade: inst.endereco.cidade,
          uf: inst.endereco.uf,
          latitude: inst.endereco.latitude,
          longitude: inst.endereco.longitude,
          status: inst.status,
          data_instalacao: inst.data_instalacao,
          data_retirada_real: inst.data_retirada_real,
          fotos_placa: inst.fotos_placa || [],
          fotos_retirada: inst.fotos_retirada || [],
        }));

        // 3. Converter URLs das fotos para signed URLs (para funcionar no PPT)
        const instalacoesComSignedUrls = await Promise.all(
          instalacoesFormatadas.map(async (instalacao) => {
            // Converter fotos da placa
            const fotosPlacaSignedUrls = await Promise.all(
              instalacao.fotos_placa.map(async (url) => {
                try {
                  // Extrair path do storage da URL
                  const urlObj = new URL(url);
                  const pathParts = urlObj.pathname.split('/');
                  const bucketIndex = pathParts.indexOf('instalacoes-fotos');
                  if (bucketIndex === -1) return url;
                  
                  const storagePath = pathParts.slice(bucketIndex + 1).join('/');
                  
                  // Gerar signed URL (válida por 1 hora)
                  const { data, error } = await supabase.storage
                    .from('instalacoes-fotos')
                    .createSignedUrl(storagePath, 3600);
                  
                  if (error || !data) {
                    console.error('Erro ao gerar signed URL:', error);
                    return url; // Retorna URL original em caso de erro
                  }
                  
                  return data.signedUrl;
                } catch (error) {
                  console.error('Erro ao processar URL:', error);
                  return url;
                }
              })
            );

            // Converter fotos da retirada
            const fotosRetiradaSignedUrls = instalacao.fotos_retirada
              ? await Promise.all(
                  instalacao.fotos_retirada.map(async (url) => {
                    try {
                      const urlObj = new URL(url);
                      const pathParts = urlObj.pathname.split('/');
                      const bucketIndex = pathParts.indexOf('instalacoes-fotos');
                      if (bucketIndex === -1) return url;
                      
                      const storagePath = pathParts.slice(bucketIndex + 1).join('/');
                      
                      const { data, error } = await supabase.storage
                        .from('instalacoes-fotos')
                        .createSignedUrl(storagePath, 3600);
                      
                      if (error || !data) {
                        console.error('Erro ao gerar signed URL:', error);
                        return url;
                      }
                      
                      return data.signedUrl;
                    } catch (error) {
                      console.error('Erro ao processar URL:', error);
                      return url;
                    }
                  })
                )
              : [];

            return {
              ...instalacao,
              fotos_placa: fotosPlacaSignedUrls,
              fotos_retirada: fotosRetiradaSignedUrls,
            };
          })
        );

        // 4. Agrupar hierarquicamente
        const dadosAgrupados = agruparHierarquicamente(instalacoesComSignedUrls);

        // 5. Gerar PPT
        const dadosRelatorio: DadosRelatorio = {
          campanha,
          dadosAgrupados,
          tipo: params.tipo,
          numeroPI: params.numeroPI,
        };

        const pptBlob = await gerarPPT(dadosRelatorio);

        // 5. Upload para Storage
        const nomeArquivo = gerarNomeArquivo(campanha.nome, params.tipo, params.numeroPI);
        uploadPath = `${params.campanhaId}/${nomeArquivo}`;
        const urlArquivo = await uploadParaStorage(pptBlob, nomeArquivo, params.campanhaId);

        // 6. Salvar registro no histórico
        const { data: relatorio, error: relatorioError } = await supabase
          .from('relatorios_gerados' as any)
          .insert({
            campanha_id: params.campanhaId,
            tipo: params.tipo,
            numero_pi: params.numeroPI,
            formato: 'ppt',
            url_arquivo: urlArquivo,
            nome_arquivo: nomeArquivo,
            tamanho_bytes: pptBlob.size,
            gerado_por: user!.id,
          })
          .select()
          .single();

        if (relatorioError) {
          throw new Error('Erro ao salvar registro do relatório');
        }

        registroId = relatorio.id;

        // 7. Download automático
        downloadBlob(pptBlob, nomeArquivo);

        return relatorio as any as RelatorioGerado;
      } catch (error) {
        // Rollback: deletar arquivo se foi feito upload
        if (uploadPath) {
          try {
            await supabase.storage.from('relatorios').remove([uploadPath]);
          } catch (rollbackError) {
            console.error('Erro no rollback do storage:', rollbackError);
          }
        }

        // Rollback: deletar registro se foi criado
        if (registroId) {
          try {
            await supabase.from('relatorios_gerados' as any).delete().eq('id', registroId);
          } catch (rollbackError) {
            console.error('Erro no rollback do registro:', rollbackError);
          }
        }

        // Log detalhado
        console.error('Erro ao gerar relatório:', {
          error,
          params,
          timestamp: new Date().toISOString(),
        });

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relatorios'] });
      toast.success('Relatório gerado com sucesso!');
    },
    onError: (error: any) => {
      // Mensagens específicas por tipo de erro
      if (error.message.includes('PI')) {
        toast.error('Número PI é obrigatório');
      } else if (error.message.includes('Campanha')) {
        toast.error('Campanha não encontrada');
      } else if (error.message.includes('instalação')) {
        toast.error(error.message);
      } else if (error.message.includes('limite')) {
        toast.error(error.message);
      } else if (error.message.includes('Storage') || error.message.includes('upload')) {
        toast.error('Erro ao salvar arquivo. Tente novamente.');
      } else {
        toast.error('Erro ao gerar relatório. Tente novamente.');
      }
    },
  });
}
