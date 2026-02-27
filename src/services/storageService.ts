import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { TipoRelatorio } from '@/types/relatorios';

/**
 * Faz upload de arquivo PPT para o Supabase Storage
 */
export async function uploadParaStorage(
  blob: Blob,
  nomeArquivo: string,
  campanhaId: string
): Promise<string> {
  const path = `${campanhaId}/${nomeArquivo}`;

  try {
    const { data, error } = await supabase.storage
      .from('relatorios')
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Erro no upload:', error);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage.from('relatorios').getPublicUrl(path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload para storage:', error);
    throw new Error('Erro ao salvar arquivo no servidor');
  }
}

/**
 * Extrai o path do arquivo a partir da URL do storage
 */
export function extrairPathDoStorage(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/relatorios/');
    if (pathParts.length > 1) {
      return pathParts[1];
    }
    throw new Error('URL inválida');
  } catch (error) {
    console.error('Erro ao extrair path:', error);
    throw new Error('Não foi possível extrair o path do arquivo');
  }
}

/**
 * Faz download automático de um blob
 */
export function downloadBlob(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gera nome de arquivo para o relatório
 * Formato: {tipo}_PI{numero}_{timestamp}.pptx
 */
export function gerarNomeArquivo(
  campanhaNome: string,
  tipo: TipoRelatorio,
  numeroPI: string
): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
  const tipoFormatado = tipo === 'parcial' ? 'parcial' : 'final';
  const piFormatado = numeroPI.replace(/[^\w\-]/g, '').toUpperCase();
  
  return `${tipoFormatado}_PI${piFormatado}_${timestamp}.pptx`;
}
