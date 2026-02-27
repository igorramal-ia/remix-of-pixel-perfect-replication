import { supabase } from '@/integrations/supabase/client';
import type { TipoRelatorio } from '@/types/relatorios';

/**
 * Valida número PI (não pode ser vazio ou apenas espaços)
 */
export function validarNumeroPI(numeroPI: string): void {
  if (!numeroPI || numeroPI.trim().length === 0) {
    throw new Error('Número PI é obrigatório');
  }
}

/**
 * Valida se a campanha existe
 */
export async function validarCampanha(campanhaId: string): Promise<void> {
  const { data: campanha, error } = await supabase
    .from('campanhas')
    .select('id')
    .eq('id', campanhaId)
    .single();

  if (error || !campanha) {
    throw new Error('Campanha não encontrada');
  }
}

/**
 * Valida se há instalações disponíveis para o tipo de relatório
 */
export async function validarInstalacoes(
  campanhaId: string,
  tipo: TipoRelatorio
): Promise<void> {
  const statusPermitidos = tipo === 'parcial' ? ['ativa'] : ['ativa', 'finalizada'];

  const { count, error } = await supabase
    .from('instalacoes')
    .select('*', { count: 'exact', head: true })
    .eq('campanha_id', campanhaId)
    .in('status', statusPermitidos);

  if (error) {
    throw new Error('Erro ao verificar instalações');
  }

  if (!count || count === 0) {
    throw new Error(
      `Nenhuma instalação ${
        tipo === 'parcial' ? 'ativa' : 'ativa ou finalizada'
      } encontrada para esta campanha`
    );
  }
}

/**
 * Valida limites de geração (máximo 500 endereços)
 */
export async function validarLimites(
  campanhaId: string,
  tipo: TipoRelatorio
): Promise<void> {
  const statusPermitidos = tipo === 'parcial' ? ['ativa'] : ['ativa', 'finalizada'];

  const { count, error } = await supabase
    .from('instalacoes')
    .select('*', { count: 'exact', head: true })
    .eq('campanha_id', campanhaId)
    .in('status', statusPermitidos);

  if (error) {
    throw new Error('Erro ao verificar limites');
  }

  if (count && count > 500) {
    throw new Error(
      `Esta campanha possui ${count} instalações. O limite é 500 por relatório. ` +
        `Considere gerar relatórios separados por estado ou cidade.`
    );
  }
}

/**
 * Sanitiza texto para uso no PPT
 */
export function sanitizarTexto(texto: string): string {
  return texto
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Caracteres de controle
    .replace(/[<>]/g, '') // Tags HTML
    .trim();
}

/**
 * Sanitiza número PI
 */
export function sanitizarNumeroPI(numeroPI: string): string {
  return numeroPI
    .trim()
    .replace(/[^\w\-]/g, '') // Apenas alfanuméricos e hífen
    .toUpperCase();
}
