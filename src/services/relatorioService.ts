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
 */
export async function gerarPPT(dados: DadosRelatorio): Promise<Blob> {
  const pptx = new PptxGenJS();

  // Configurações globais
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Digital Favela';
  pptx.company = 'Digital Favela';
  pptx.title = `Relatório ${dados.tipo === 'parcial' ? 'Parcial' : 'Final'} - ${dados.campanha.nome}`;

  // 1. Slide de Capa
  adicionarSlideCapa(pptx, dados);

  // 2. Slide de Resumo Executivo
  adicionarSlideResumo(pptx, dados);

  // 3. Slides de Endereços (direto, sem slides intermediários)
  for (const estado of dados.dadosAgrupados.estados) {
    for (const cidade of estado.cidades) {
      for (const comunidade of cidade.comunidades) {
        // Slides de endereços (1 endereço = 1 slide)
        for (const endereco of comunidade.enderecos) {
          await adicionarSlideEndereco(pptx, endereco, dados.tipo);
        }
      }
    }
  }

  // 4. Slide de Encerramento
  adicionarSlideEncerramento(pptx);

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
 * Slide 1: Capa Profissional
 */
function adicionarSlideCapa(pptx: PptxGenJS, dados: DadosRelatorio): void {
  const slide = pptx.addSlide();

  // Background gradiente azul
  slide.background = { color: '1E40AF' }; // blue-800

  // Barra decorativa superior
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.3,
    fill: { color: '3B82F6' }, // blue-500
    line: { type: 'none' },
  });

  // Logo placeholder (área para logo)
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 0.8,
    w: 2,
    h: 0.8,
    fill: { color: 'FFFFFF' },
    line: { type: 'none' },
  });

  slide.addText('LOGO', {
    x: 0.5,
    y: 0.8,
    w: 2,
    h: 0.8,
    fontSize: 24,
    bold: true,
    color: '1E40AF',
    align: 'center',
    valign: 'middle',
  });

  // Título principal
  slide.addText('RELATÓRIO DE CAMPANHA', {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 0.6,
    fontSize: 40,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });

  // Tipo de relatório
  const tipoTexto = dados.tipo === 'parcial' ? 'RELATÓRIO PARCIAL' : 'RELATÓRIO FINAL';
  slide.addShape(pptx.ShapeType.rect, {
    x: 3.5,
    y: 3,
    w: 3,
    h: 0.5,
    fill: { color: '3B82F6' },
    line: { type: 'none' },
  });

  slide.addText(tipoTexto, {
    x: 3.5,
    y: 3,
    w: 3,
    h: 0.5,
    fontSize: 18,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
  });

  // Card de informações
  slide.addShape(pptx.ShapeType.rect, {
    x: 2,
    y: 3.8,
    w: 6,
    h: 2.2,
    fill: { color: 'FFFFFF' },
    line: { type: 'none' },
  });

  // Nome da campanha
  slide.addText(sanitizarTexto(dados.campanha.nome), {
    x: 2.2,
    y: 4,
    w: 5.6,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: '1E40AF',
    align: 'center',
  });

  // Cliente
  slide.addText(`Cliente: ${sanitizarTexto(dados.campanha.cliente)}`, {
    x: 2.2,
    y: 4.6,
    w: 5.6,
    h: 0.3,
    fontSize: 16,
    color: '475569',
    align: 'center',
  });

  // Número PI
  slide.addText(`PI: ${sanitizarTexto(dados.numeroPI)}`, {
    x: 2.2,
    y: 5,
    w: 5.6,
    h: 0.3,
    fontSize: 16,
    bold: true,
    color: '1E40AF',
    align: 'center',
  });

  // Período
  const dataInicio = dados.campanha.data_inicio
    ? format(new Date(dados.campanha.data_inicio), 'dd/MM/yyyy', { locale: ptBR })
    : '-';
  const dataFim = dados.campanha.data_fim
    ? format(new Date(dados.campanha.data_fim), 'dd/MM/yyyy', { locale: ptBR })
    : '-';

  slide.addText(`Período: ${dataInicio} até ${dataFim}`, {
    x: 2.2,
    y: 5.4,
    w: 5.6,
    h: 0.3,
    fontSize: 14,
    color: '64748B',
    align: 'center',
  });

  // Rodapé
  slide.addText(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, {
    x: 0.5,
    y: 6.8,
    w: 9,
    h: 0.3,
    fontSize: 12,
    color: 'E0E7FF',
    align: 'center',
  });
}

/**
 * Slide 2: Resumo Executivo Melhorado
 */
function adicionarSlideResumo(pptx: PptxGenJS, dados: DadosRelatorio): void {
  const slide = pptx.addSlide();

  // Background branco
  slide.background = { color: 'FFFFFF' };

  // Cabeçalho azul
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.8,
    fill: { color: '1E40AF' },
    line: { type: 'none' },
  });

  slide.addText('RESUMO EXECUTIVO', {
    x: 0.5,
    y: 0.2,
    w: 9,
    h: 0.4,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
  });

  // Estatísticas principais (grid 2x2 com cards)
  const stats = [
    {
      label: 'Total de Pontos',
      value: dados.dadosAgrupados.totalPontos.toString(),
      color: '3B82F6',
    },
    {
      label: 'Estados',
      value: dados.dadosAgrupados.totalEstados.toString(),
      color: '8B5CF6',
    },
    {
      label: 'Cidades',
      value: dados.dadosAgrupados.totalCidades.toString(),
      color: '10B981',
    },
    {
      label: 'Comunidades',
      value: dados.dadosAgrupados.totalComunidades.toString(),
      color: 'F59E0B',
    },
  ];

  const startX = 0.5;
  const startY = 1.2;
  const boxW = 4.25;
  const boxH = 1.3;
  const gap = 0.5;

  stats.forEach((stat, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = startX + col * (boxW + gap);
    const y = startY + row * (boxH + gap);

    // Card com sombra
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: boxW,
      h: boxH,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 2 },
    });

    // Barra colorida no topo
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: boxW,
      h: 0.15,
      fill: { color: stat.color },
      line: { type: 'none' },
    });

    // Valor grande
    slide.addText(stat.value, {
      x,
      y: y + 0.3,
      w: boxW,
      h: 0.5,
      fontSize: 42,
      bold: true,
      color: stat.color,
      align: 'center',
    });

    // Label
    slide.addText(stat.label, {
      x,
      y: y + 0.85,
      w: boxW,
      h: 0.3,
      fontSize: 14,
      color: '64748B',
      align: 'center',
    });
  });

  // Distribuição por estado (tabela melhorada)
  slide.addText('DISTRIBUIÇÃO POR ESTADO', {
    x: 0.5,
    y: 4.2,
    w: 9,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: '1E40AF',
  });

  const tableData: any[] = [
    [
      {
        text: 'Estado',
        options: { bold: true, fill: { color: '1E40AF' }, color: 'FFFFFF', fontSize: 12 },
      },
      {
        text: 'Cidades',
        options: { bold: true, fill: { color: '1E40AF' }, color: 'FFFFFF', fontSize: 12 },
      },
      {
        text: 'Comunidades',
        options: { bold: true, fill: { color: '1E40AF' }, color: 'FFFFFF', fontSize: 12 },
      },
      {
        text: 'Pontos',
        options: { bold: true, fill: { color: '1E40AF' }, color: 'FFFFFF', fontSize: 12 },
      },
    ],
  ];

  dados.dadosAgrupados.estados.forEach((estado, index) => {
    const fillColor = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
    tableData.push([
      {
        text: `${estado.nome} (${estado.uf})`,
        options: { fill: { color: fillColor }, fontSize: 11 },
      },
      {
        text: estado.totalCidades.toString(),
        options: { fill: { color: fillColor }, fontSize: 11 },
      },
      {
        text: estado.totalComunidades.toString(),
        options: { fill: { color: fillColor }, fontSize: 11 },
      },
      {
        text: estado.totalPontos.toString(),
        options: { fill: { color: fillColor }, bold: true, fontSize: 11 },
      },
    ]);
  });

  slide.addTable(tableData, {
    x: 0.5,
    y: 4.7,
    w: 9,
    border: { pt: 1, color: 'CBD5E1' },
    align: 'center',
    valign: 'middle',
  });
}

/**
 * Slide de cabeçalho do Estado
 */
function adicionarSlideEstado(pptx: PptxGenJS, estado: EstadoAgrupado): void {
  const slide = pptx.addSlide();

  // Background com cor de destaque
  slide.background = { color: 'F8FAFC' }; // slate-50

  // Título do estado
  slide.addText(`${estado.nome} (${estado.uf})`, {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1,
    fontSize: 40,
    bold: true,
    color: '0F172A',
    align: 'center',
  });

  // Estatísticas do estado
  slide.addText(
    `${estado.totalPontos} pontos • ${estado.totalCidades} cidades • ${estado.totalComunidades} comunidades`,
    {
      x: 0.5,
      y: 3.2,
      w: 9,
      h: 0.5,
      fontSize: 18,
      color: '475569',
      align: 'center',
    }
  );
}

/**
 * Slide de cabeçalho da Cidade
 */
function adicionarSlideCidade(pptx: PptxGenJS, cidade: CidadeAgrupada, uf: string): void {
  const slide = pptx.addSlide();

  // Breadcrumb
  slide.addText(uf, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.3,
    fontSize: 14,
    color: '64748B',
  });

  // Título da cidade
  slide.addText(sanitizarTexto(cidade.nome), {
    x: 0.5,
    y: 2,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: '1E293B',
    align: 'center',
  });

  // Estatísticas
  slide.addText(`${cidade.totalPontos} pontos • ${cidade.totalComunidades} comunidades`, {
    x: 0.5,
    y: 3,
    w: 9,
    h: 0.4,
    fontSize: 16,
    color: '475569',
    align: 'center',
  });
}

/**
 * Slide de cabeçalho da Comunidade
 */
function adicionarSlideComunidade(
  pptx: PptxGenJS,
  comunidade: ComunidadeAgrupada,
  cidade: string
): void {
  const slide = pptx.addSlide();

  // Breadcrumb
  slide.addText(sanitizarTexto(cidade), {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.3,
    fontSize: 14,
    color: '64748B',
  });

  // Título da comunidade
  slide.addText(sanitizarTexto(comunidade.nome), {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 0.7,
    fontSize: 32,
    bold: true,
    color: '1E293B',
    align: 'center',
  });

  // Total de pontos
  slide.addText(`${comunidade.totalPontos} pontos`, {
    x: 0.5,
    y: 3.3,
    w: 9,
    h: 0.4,
    fontSize: 16,
    color: '475569',
    align: 'center',
  });
}

/**
 * Slide de Endereço (CRÍTICO: 1 endereço = 1 slide)
 * Design profissional e limpo
 */
async function adicionarSlideEndereco(
  pptx: PptxGenJS,
  endereco: EnderecoAgrupado,
  tipo: TipoRelatorio
): Promise<void> {
  const slide = pptx.addSlide();

  // Background branco limpo
  slide.background = { color: 'FFFFFF' };

  // ===== CABEÇALHO COM LOCALIZAÇÃO =====
  // Barra superior azul
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 1.2,
    fill: { color: '1E40AF' }, // blue-800
    line: { type: 'none' },
  });

  // Endereço em destaque (branco sobre azul)
  slide.addText(sanitizarTexto(endereco.endereco), {
    x: 0.3,
    y: 0.25,
    w: 9.4,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: 'FFFFFF',
    align: 'left',
  });

  // Localização (comunidade, cidade, UF)
  slide.addText(
    `${sanitizarTexto(endereco.comunidade)} • ${sanitizarTexto(endereco.cidade)} - ${endereco.uf}`,
    {
      x: 0.3,
      y: 0.7,
      w: 9.4,
      h: 0.3,
      fontSize: 14,
      color: 'E0E7FF', // blue-100
      align: 'left',
    }
  );

  // ===== INFORMAÇÕES DO PONTO =====
  let currentY = 1.5;

  // Card de informações
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: currentY,
    w: 9,
    h: 1.2,
    fill: { color: 'F8FAFC' }, // slate-50
    line: { color: 'E2E8F0', width: 1 },
  });

  // Status badge
  const statusColor = endereco.status === 'ativa' ? '22C55E' : '6B7280';
  const statusLabel = endereco.status === 'ativa' ? 'ATIVA' : 'FINALIZADA';

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.7,
    y: currentY + 0.2,
    w: 1.5,
    h: 0.4,
    fill: { color: statusColor },
    line: { type: 'none' },
  });

  slide.addText(statusLabel, {
    x: 0.7,
    y: currentY + 0.2,
    w: 1.5,
    h: 0.4,
    fontSize: 12,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
  });

  // Data de instalação
  const dataInstalacao = format(new Date(endereco.data_instalacao), 'dd/MM/yyyy', {
    locale: ptBR,
  });

  slide.addText('Data de Instalação:', {
    x: 2.5,
    y: currentY + 0.25,
    w: 3,
    h: 0.3,
    fontSize: 11,
    color: '64748B',
    bold: true,
  });

  slide.addText(dataInstalacao, {
    x: 2.5,
    y: currentY + 0.55,
    w: 3,
    h: 0.3,
    fontSize: 14,
    color: '0F172A',
    bold: true,
  });

  // Data de retirada (se finalizada)
  if (tipo === 'final' && endereco.data_retirada_real) {
    const dataRetirada = format(new Date(endereco.data_retirada_real), 'dd/MM/yyyy', {
      locale: ptBR,
    });

    slide.addText('Data de Retirada:', {
      x: 5.8,
      y: currentY + 0.25,
      w: 3,
      h: 0.3,
      fontSize: 11,
      color: '64748B',
      bold: true,
    });

    slide.addText(dataRetirada, {
      x: 5.8,
      y: currentY + 0.55,
      w: 3,
      h: 0.3,
      fontSize: 14,
      color: '0F172A',
      bold: true,
    });
  }

  currentY += 1.5;

  // ===== FOTOS DA INSTALAÇÃO =====
  slide.addText('FOTOS DA INSTALAÇÃO', {
    x: 0.5,
    y: currentY,
    w: 9,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: '1E40AF',
  });

  currentY += 0.5;

  // Grid de fotos da placa (2x2)
  const fotosPlaca = endereco.fotos_placa.slice(0, 4);
  if (fotosPlaca.length > 0) {
    await adicionarGridFotosMelhorado(slide, pptx, fotosPlaca, 0.5, currentY, 9, 2.5);
    currentY += 2.8;
  } else {
    slide.addText('Nenhuma foto disponível', {
      x: 0.5,
      y: currentY,
      w: 9,
      h: 0.5,
      fontSize: 12,
      color: '94A3B8',
      italic: true,
      align: 'center',
    });
    currentY += 0.8;
  }

  // ===== FOTOS DA RETIRADA (apenas relatório final) =====
  if (tipo === 'final' && endereco.fotos_retirada && endereco.fotos_retirada.length > 0) {
    slide.addText('FOTOS DA RETIRADA', {
      x: 0.5,
      y: currentY,
      w: 9,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: '1E40AF',
    });

    currentY += 0.5;

    const fotosRetirada = endereco.fotos_retirada.slice(0, 4);
    await adicionarGridFotosMelhorado(slide, pptx, fotosRetirada, 0.5, currentY, 9, 2);
  }

  // ===== RODAPÉ COM LOCALIZAÇÃO =====
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 7,
    w: 10,
    h: 0.5,
    fill: { color: 'F1F5F9' }, // slate-100
    line: { type: 'none' },
  });

  slide.addText(`📍 ${endereco.comunidade} • ${endereco.cidade} - ${endereco.uf}`, {
    x: 0.5,
    y: 7.1,
    w: 9,
    h: 0.3,
    fontSize: 10,
    color: '64748B',
    align: 'center',
  });
}

/**
 * Helper para adicionar grid de fotos com design melhorado
 * Adiciona bordas, sombras e tratamento de erros
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
  const numFotos = urls.length;
  if (numFotos === 0) return;

  // Calcular layout (2 colunas)
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

    // Adicionar fundo branco com borda
    slide.addShape(pptx.ShapeType.rect, {
      x: fotoX,
      y: fotoY,
      w: fotoW,
      h: fotoH,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 2 },
    });

    try {
      // Tentar adicionar imagem
      slide.addImage({
        path: urls[i],
        x: fotoX + 0.05,
        y: fotoY + 0.05,
        w: fotoW - 0.1,
        h: fotoH - 0.1,
        sizing: { type: 'contain', w: fotoW - 0.1, h: fotoH - 0.1 },
      });
    } catch (error) {
      // Placeholder elegante em caso de erro
      slide.addShape(pptx.ShapeType.rect, {
        x: fotoX + 0.05,
        y: fotoY + 0.05,
        w: fotoW - 0.1,
        h: fotoH - 0.1,
        fill: { color: 'F1F5F9' },
        line: { type: 'none' },
      });

      // Ícone de imagem quebrada
      slide.addText('🖼️', {
        x: fotoX,
        y: fotoY + fotoH / 2 - 0.3,
        w: fotoW,
        h: 0.3,
        fontSize: 32,
        align: 'center',
      });

      slide.addText('Imagem não disponível', {
        x: fotoX,
        y: fotoY + fotoH / 2 + 0.05,
        w: fotoW,
        h: 0.25,
        fontSize: 9,
        color: '94A3B8',
        align: 'center',
      });
    }
  }
}

/**
 * Slide de Encerramento
 */
function adicionarSlideEncerramento(pptx: PptxGenJS): void {
  const slide = pptx.addSlide();

  // Background
  slide.background = { color: '1E293B' };

  // Agradecimento
  slide.addText('Obrigado!', {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 0.8,
    fontSize: 40,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });

  // Contato
  slide.addText('Digital Favela', {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.4,
    fontSize: 20,
    color: 'CBD5E1',
    align: 'center',
  });

  slide.addText('contato@digitalfavela.com.br', {
    x: 0.5,
    y: 4,
    w: 9,
    h: 0.3,
    fontSize: 16,
    color: '94A3B8',
    align: 'center',
  });
}
