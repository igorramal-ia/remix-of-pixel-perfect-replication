import PptxGenJS from 'pptxgenjs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  DadosRelatorio,
  TipoRelatorio,
  EstadoAgrupado,
  CidadeAgrupada,
  ComunidadeAgrupada,
  EnderecoAgrupado,
  Instalacao,
} from '@/types/relatorios';
import { sanitizarTexto } from '@/utils/validacoes';

/**
 * Gera arquivo PPT completo do relatório
 * VERSÃO SIMPLIFICADA: Apenas capa + slides de fotos
 */
export async function gerarPPT(dados: DadosRelatorio): Promise<Blob> {
  const pptx = new PptxGenJS();

  // Configurações globais
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Digital Favela';
  pptx.company = 'Digital Favela';
  pptx.title = `Relatório ${dados.tipo === 'parcial' ? 'Parcial' : 'Final'} - ${dados.campanha.nome}`;

  // 1. Slide de Capa (informações da campanha)
  adicionarSlideCapa(pptx, dados);

  // 2. Slides de Fotos (1 endereço = 1 slide)
  for (const estado of dados.dadosAgrupados.estados) {
    for (const cidade of estado.cidades) {
      for (const comunidade of cidade.comunidades) {
        for (const endereco of comunidade.enderecos) {
          await adicionarSlideFotos(pptx, endereco, dados.tipo);
        }
      }
    }
  }

  // Gerar blob
  const blob = (await pptx.write({ outputType: 'blob' })) as Blob;
  return blob;
}

/**
 * Filtra instalações por tipo de relatório
 */
export function filtrarInstalacoesPorTipo(
  instalacoes: Instalacao[],
  tipo: TipoRelatorio
): Instalacao[] {
  if (tipo === 'parcial') {
    return instalacoes.filter((i) => i.status === 'ativa');
  } else {
    // tipo === 'final'
    return instalacoes.filter((i) => i.status === 'ativa' || i.status === 'finalizada');
  }
}

/**
 * Slide 1: Capa Simples com Informações da Campanha
 */
function adicionarSlideCapa(pptx: PptxGenJS, dados: DadosRelatorio): void {
  const slide = pptx.addSlide();

  // Background branco limpo
  slide.background = { color: 'FFFFFF' };

  // Card central com informações
  slide.addShape(pptx.ShapeType.rect, {
    x: 2,
    y: 2,
    w: 6,
    h: 3.5,
    fill: { color: 'F8FAFC' }, // cinza muito claro
    line: { color: 'E2E8F0', width: 1 },
  });

  let currentY = 2.3;

  // Título
  slide.addText('RELATÓRIO DE CAMPANHA', {
    x: 2.2,
    y: currentY,
    w: 5.6,
    h: 0.5,
    fontSize: 28,
    bold: true,
    color: '1E293B',
    align: 'center',
  });

  currentY += 0.7;

  // Tipo de relatório
  const tipoTexto = dados.tipo === 'parcial' ? 'Relatório Parcial' : 'Relatório Final';
  slide.addText(tipoTexto, {
    x: 2.2,
    y: currentY,
    w: 5.6,
    h: 0.3,
    fontSize: 14,
    color: '64748B',
    align: 'center',
  });

  currentY += 0.6;

  // Nome da campanha
  slide.addText(sanitizarTexto(dados.campanha.nome), {
    x: 2.2,
    y: currentY,
    w: 5.6,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: '0F172A',
    align: 'center',
  });

  currentY += 0.6;

  // Cliente
  slide.addText(`Cliente: ${sanitizarTexto(dados.campanha.cliente)}`, {
    x: 2.2,
    y: currentY,
    w: 5.6,
    h: 0.3,
    fontSize: 14,
    color: '475569',
    align: 'center',
  });

  currentY += 0.4;

  // Número PI
  slide.addText(`PI: ${sanitizarTexto(dados.numeroPI)}`, {
    x: 2.2,
    y: currentY,
    w: 5.6,
    h: 0.3,
    fontSize: 14,
    bold: true,
    color: '1E40AF',
    align: 'center',
  });

  currentY += 0.4;

  // Período
  const dataInicio = dados.campanha.data_inicio
    ? format(new Date(dados.campanha.data_inicio), 'dd/MM/yyyy', { locale: ptBR })
    : '-';
  const dataFim = dados.campanha.data_fim
    ? format(new Date(dados.campanha.data_fim), 'dd/MM/yyyy', { locale: ptBR })
    : '-';

  slide.addText(`Período: ${dataInicio} até ${dataFim}`, {
    x: 2.2,
    y: currentY,
    w: 5.6,
    h: 0.3,
    fontSize: 12,
    color: '64748B',
    align: 'center',
  });

  currentY += 0.4;

  // Data de geração
  slide.addText(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, {
    x: 2.2,
    y: currentY,
    w: 5.6,
    h: 0.3,
    fontSize: 11,
    color: '94A3B8',
    align: 'center',
  });
}

/**
 * Slide de Fotos (SIMPLIFICADO)
 * Apenas endereço, data e fotos com fundo branco
 */
async function adicionarSlideFotos(
  pptx: PptxGenJS,
  endereco: EnderecoAgrupado,
  tipo: TipoRelatorio
): Promise<void> {
  const slide = pptx.addSlide();

  // Background branco limpo
  slide.background = { color: 'FFFFFF' };

  // ===== CABEÇALHO COM INFORMAÇÕES =====
  let currentY = 0.5;

  // Endereço em destaque
  slide.addText(sanitizarTexto(endereco.endereco), {
    x: 0.5,
    y: currentY,
    w: 9,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: '0F172A',
  });

  currentY += 0.5;

  // Localização (comunidade, cidade, UF)
  slide.addText(
    `${sanitizarTexto(endereco.comunidade)} • ${sanitizarTexto(endereco.cidade)} - ${endereco.uf}`,
    {
      x: 0.5,
      y: currentY,
      w: 9,
      h: 0.3,
      fontSize: 12,
      color: '64748B',
    }
  );

  currentY += 0.4;

  // Data de instalação
  const dataInstalacao = format(new Date(endereco.data_instalacao), 'dd/MM/yyyy', {
    locale: ptBR,
  });

  let infoTexto = `Instalação: ${dataInstalacao}`;

  // Data de retirada (se finalizada)
  if (tipo === 'final' && endereco.data_retirada_real) {
    const dataRetirada = format(new Date(endereco.data_retirada_real), 'dd/MM/yyyy', {
      locale: ptBR,
    });
    infoTexto += ` • Retirada: ${dataRetirada}`;
  }

  slide.addText(infoTexto, {
    x: 0.5,
    y: currentY,
    w: 9,
    h: 0.3,
    fontSize: 11,
    color: '475569',
  });

  currentY += 0.6;

  // ===== FOTOS DA INSTALAÇÃO =====
  const fotosPlaca = endereco.fotos_placa.slice(0, 4);
  if (fotosPlaca.length > 0) {
    slide.addText('Fotos da Instalação:', {
      x: 0.5,
      y: currentY,
      w: 9,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: '1E293B',
    });

    currentY += 0.4;

    await adicionarGridFotosSimples(slide, pptx, fotosPlaca, 0.5, currentY, 9, 2.5);
    currentY += 2.8;
  }

  // ===== FOTOS DA RETIRADA (apenas relatório final) =====
  if (tipo === 'final' && endereco.fotos_retirada && endereco.fotos_retirada.length > 0) {
    const fotosRetirada = endereco.fotos_retirada.slice(0, 4);

    slide.addText('Fotos da Retirada:', {
      x: 0.5,
      y: currentY,
      w: 9,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: '1E293B',
    });

    currentY += 0.4;

    await adicionarGridFotosSimples(slide, pptx, fotosRetirada, 0.5, currentY, 9, 2.5);
  }
}

/**
 * Grid de fotos SIMPLIFICADO
 * Fundo branco com efeito leve (sombra sutil)
 */
async function adicionarGridFotosSimples(
  slide: any,
  pptx: PptxGenJS,
  urls: string[],
  x: number,
  y: number,
  totalWidth: number,
  totalHeight: number
): Promise<void> {
  const numFotos = urls.length;
  if (numFotos === 0) return;

  // Layout 2x2
  const cols = 2;
  const rows = Math.ceil(numFotos / cols);
  const gap = 0.3;
  const fotoW = (totalWidth - gap * (cols - 1)) / cols;
  const fotoH = (totalHeight - gap * (rows - 1)) / rows;

  for (let i = 0; i < numFotos; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const fotoX = x + col * (fotoW + gap);
    const fotoY = y + row * (fotoH + gap);

    // Sombra sutil (efeito leve)
    slide.addShape(pptx.ShapeType.rect, {
      x: fotoX + 0.03,
      y: fotoY + 0.03,
      w: fotoW,
      h: fotoH,
      fill: { color: '000000', transparency: 95 }, // sombra muito leve
      line: { type: 'none' },
    });

    // Fundo branco
    slide.addShape(pptx.ShapeType.rect, {
      x: fotoX,
      y: fotoY,
      w: fotoW,
      h: fotoH,
      fill: { color: 'FFFFFF' },
      line: { color: 'E5E7EB', width: 1 }, // borda cinza muito clara
    });

    try {
      // Adicionar imagem com padding
      slide.addImage({
        path: urls[i],
        x: fotoX + 0.1,
        y: fotoY + 0.1,
        w: fotoW - 0.2,
        h: fotoH - 0.2,
        sizing: { type: 'contain', w: fotoW - 0.2, h: fotoH - 0.2 },
      });
    } catch (error) {
      // Placeholder simples em caso de erro
      slide.addShape(pptx.ShapeType.rect, {
        x: fotoX + 0.1,
        y: fotoY + 0.1,
        w: fotoW - 0.2,
        h: fotoH - 0.2,
        fill: { color: 'F3F4F6' }, // cinza muito claro
        line: { type: 'none' },
      });

      slide.addText('🖼️', {
        x: fotoX,
        y: fotoY + fotoH / 2 - 0.25,
        w: fotoW,
        h: 0.3,
        fontSize: 28,
        align: 'center',
      });

      slide.addText('Imagem não disponível', {
        x: fotoX,
        y: fotoY + fotoH / 2 + 0.1,
        w: fotoW,
        h: 0.2,
        fontSize: 9,
        color: '9CA3AF',
        align: 'center',
      });
    }
  }
}

/**
 * Slide 2: Resumo Executivo Melhorado
 * DEPRECATED - Não usado na versão simplificada
 */
function adicionarSlideResumo(pptx: PptxGenJS, dados: DadosRelatorio): void {
  // Função mantida para compatibilidade, mas não é mais chamada
  return;
}

/**
 * Slide de cabeçalho do Estado
 * DEPRECATED - Não usado na versão simplificada
 */
function adicionarSlideEstado(pptx: PptxGenJS, estado: EstadoAgrupado): void {
  // Função mantida para compatibilidade, mas não é mais chamada
  return;
}

/**
 * Slide de cabeçalho da Cidade
 * DEPRECATED - Não usado na versão simplificada
 */
function adicionarSlideCidade(pptx: PptxGenJS, cidade: CidadeAgrupada, uf: string): void {
  // Função mantida para compatibilidade, mas não é mais chamada
  return;
}

/**
 * Slide de cabeçalho da Comunidade
 * DEPRECATED - Não usado na versão simplificada
 */
function adicionarSlideComunidade(
  pptx: PptxGenJS,
  comunidade: ComunidadeAgrupada,
  cidade: string
): void {
  // Função mantida para compatibilidade, mas não é mais chamada
  return;
}

/**
 * Slide de Endereço (CRÍTICO: 1 endereço = 1 slide)
 * DEPRECATED - Substituído por adicionarSlideFotos
 */
async function adicionarSlideEndereco(
  pptx: PptxGenJS,
  endereco: EnderecoAgrupado,
  tipo: TipoRelatorio
): Promise<void> {
  // Função mantida para compatibilidade, mas não é mais chamada
  return;
}

/**
 * Helper para adicionar grid de fotos com design melhorado
 * DEPRECATED - Substituído por adicionarGridFotosSimples
 */
async function adicionarGridFotosMelhorado(
  slide: any,
  pptx: PptxGenJS,
  urls: string[],
  x: number,
  y: number,
  totalWidth: number,
  totalHeight: number
): Promise<void> {
  // Função mantida para compatibilidade, mas não é mais chamada
  return;
}

/**
 * Slide de Encerramento
 * DEPRECATED - Não usado na versão simplificada
 */
function adicionarSlideEncerramento(pptx: PptxGenJS): void {
  // Função mantida para compatibilidade, mas não é mais chamada
  return;
}
