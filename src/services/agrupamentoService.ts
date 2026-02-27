import type {
  Instalacao,
  DadosAgrupados,
  EstadoAgrupado,
  CidadeAgrupada,
  ComunidadeAgrupada,
} from '@/types/relatorios';

/**
 * Agrupa instalações hierarquicamente por Estado → Cidade → Comunidade
 * Ordena alfabeticamente em todos os níveis
 */
export function agruparHierarquicamente(instalacoes: Instalacao[]): DadosAgrupados {
  // Ordenar instalações
  const instalacoesOrdenadas = [...instalacoes].sort((a, b) => {
    // 1. Por UF
    if (a.uf !== b.uf) return a.uf.localeCompare(b.uf);
    // 2. Por cidade
    if (a.cidade !== b.cidade) return a.cidade.localeCompare(b.cidade);
    // 3. Por comunidade
    if (a.comunidade !== b.comunidade) return a.comunidade.localeCompare(b.comunidade);
    // 4. Por endereço
    return a.endereco.localeCompare(b.endereco);
  });

  // Agrupar por estado
  const estadosMap = new Map<string, EstadoAgrupado>();

  for (const instalacao of instalacoesOrdenadas) {
    // Obter ou criar estado
    if (!estadosMap.has(instalacao.uf)) {
      estadosMap.set(instalacao.uf, {
        uf: instalacao.uf,
        nome: obterNomeEstado(instalacao.uf),
        cidades: [],
        totalPontos: 0,
        totalCidades: 0,
        totalComunidades: 0,
      });
    }
    const estado = estadosMap.get(instalacao.uf)!;

    // Obter ou criar cidade
    let cidade = estado.cidades.find((c) => c.nome === instalacao.cidade);
    if (!cidade) {
      cidade = {
        nome: instalacao.cidade,
        comunidades: [],
        totalPontos: 0,
        totalComunidades: 0,
      };
      estado.cidades.push(cidade);
    }

    // Obter ou criar comunidade
    let comunidade = cidade.comunidades.find((c) => c.nome === instalacao.comunidade);
    if (!comunidade) {
      comunidade = {
        nome: instalacao.comunidade,
        enderecos: [],
        totalPontos: 0,
      };
      cidade.comunidades.push(comunidade);
    }

    // Adicionar endereço
    comunidade.enderecos.push(instalacao);
    comunidade.totalPontos++;
    cidade.totalPontos++;
    estado.totalPontos++;
  }

  // Calcular totais
  const estados = Array.from(estadosMap.values());
  for (const estado of estados) {
    estado.totalCidades = estado.cidades.length;
    estado.totalComunidades = estado.cidades.reduce(
      (sum, c) => sum + c.comunidades.length,
      0
    );
    for (const cidade of estado.cidades) {
      cidade.totalComunidades = cidade.comunidades.length;
    }
  }

  return {
    estados,
    totalPontos: instalacoes.length,
    totalEstados: estados.length,
    totalCidades: estados.reduce((sum, e) => sum + e.totalCidades, 0),
    totalComunidades: estados.reduce((sum, e) => sum + e.totalComunidades, 0),
  };
}

/**
 * Mapeia sigla da UF para nome completo do estado
 */
export function obterNomeEstado(uf: string): string {
  const estados: Record<string, string> = {
    AC: 'Acre',
    AL: 'Alagoas',
    AP: 'Amapá',
    AM: 'Amazonas',
    BA: 'Bahia',
    CE: 'Ceará',
    DF: 'Distrito Federal',
    ES: 'Espírito Santo',
    GO: 'Goiás',
    MA: 'Maranhão',
    MT: 'Mato Grosso',
    MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais',
    PA: 'Pará',
    PB: 'Paraíba',
    PR: 'Paraná',
    PE: 'Pernambuco',
    PI: 'Piauí',
    RJ: 'Rio de Janeiro',
    RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul',
    RO: 'Rondônia',
    RR: 'Roraima',
    SC: 'Santa Catarina',
    SP: 'São Paulo',
    SE: 'Sergipe',
    TO: 'Tocantins',
  };
  return estados[uf] || uf;
}
