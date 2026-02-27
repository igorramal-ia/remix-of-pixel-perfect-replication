/**
 * Serviço de integração com Google Gemini AI
 * Documentação: https://ai.google.dev/api/rest
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

interface GeminiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Faz uma pergunta ao Google Gemini e retorna a resposta
 * @param prompt - A pergunta ou prompt para o Gemini
 * @returns Promise com a resposta em texto
 * @throws Error se a API Key não estiver configurada ou se houver erro na requisição
 */
export async function askGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;

  if (!apiKey) {
    throw new Error(
      "VITE_GEMINI_KEY não está configurada. Configure a variável de ambiente para usar o Gemini."
    );
  }

  if (!prompt || prompt.trim().length === 0) {
    throw new Error("O prompt não pode estar vazio.");
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Reduzido para respostas mais diretas
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 1024, // Voltando para 1024 com prompt mais conciso
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData: GeminiError = await response.json();
      throw new Error(
        `Erro na API do Gemini: ${errorData.error.message} (${errorData.error.status})`
      );
    }

    const data: GeminiResponse = await response.json();

    // Verificar se há candidatos na resposta
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Nenhuma resposta foi gerada pelo Gemini.");
    }

    // Extrair o texto da primeira resposta
    const firstCandidate = data.candidates[0];
    if (!firstCandidate.content || !firstCandidate.content.parts) {
      throw new Error("Resposta do Gemini está em formato inválido.");
    }

    // Verificar se a resposta foi cortada
    if (firstCandidate.finishReason === "MAX_TOKENS") {
      console.warn("⚠️ [GEMINI] Resposta foi cortada por atingir o limite de tokens");
    }

    const text = firstCandidate.content.parts
      .map((part) => part.text)
      .join("\n");

    console.log("✅ [GEMINI] Resposta completa recebida:", {
      finishReason: firstCandidate.finishReason,
      tamanho: text.length,
      preview: text.substring(0, 100) + "..."
    });

    return text;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao chamar a API do Gemini.");
  }
}

/**
 * Testa a conexão com a API do Gemini
 * @returns Promise<boolean> - true se a API está funcionando
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const response = await askGemini("Olá! Responda apenas com 'OK' se você está funcionando.");
    return response.toLowerCase().includes("ok");
  } catch (error) {
    console.error("Erro ao testar conexão com Gemini:", error);
    return false;
  }
}

/**
 * Gera sugestões de estratégia para campanhas OOH
 * @param dados - Dados da campanha (cliente, cidades, comunidades, etc)
 * @returns Promise com sugestões estratégicas
 */
export async function gerarEstrategiaCampanha(dados: {
  cliente: string;
  cidades: string[];
  comunidades?: string[];
  objetivo?: string;
}): Promise<string> {
  const prompt = `
Você é um especialista em marketing OOH (Out of Home) em comunidades periféricas do Brasil.

Dados da campanha:
- Cliente: ${dados.cliente}
- Cidades: ${dados.cidades.join(", ")}
${dados.comunidades ? `- Comunidades: ${dados.comunidades.join(", ")}` : ""}
${dados.objetivo ? `- Objetivo: ${dados.objetivo}` : ""}

Gere uma estratégia de campanha OOH considerando:
1. Melhores locais para instalação (pontos de alto tráfego)
2. Mensagens que ressoam com a comunidade local
3. Timing ideal para instalação
4. Métricas de sucesso sugeridas
5. Considerações culturais e sociais importantes

Seja específico e prático. Responda em português do Brasil.
`;

  return askGemini(prompt);
}

/**
 * Analisa dados de campanha e gera insights
 * @param dados - Dados da campanha (instalações, progresso, etc)
 * @returns Promise com análise e insights
 */
export async function analisarCampanha(dados: {
  nome: string;
  totalPontos: number;
  pontosInstalados: number;
  diasRestantes?: number;
}): Promise<string> {
  const progresso = (dados.pontosInstalados / dados.totalPontos) * 100;

  const prompt = `
Você é um analista de campanhas OOH (Out of Home).

Dados da campanha "${dados.nome}":
- Total de pontos: ${dados.totalPontos}
- Pontos instalados: ${dados.pontosInstalados}
- Progresso: ${progresso.toFixed(1)}%
${dados.diasRestantes ? `- Dias restantes: ${dados.diasRestantes}` : ""}

Analise estes dados e forneça:
1. Avaliação do progresso atual
2. Recomendações para acelerar instalações (se necessário)
3. Alertas sobre possíveis problemas
4. Próximos passos sugeridos

Seja objetivo e prático. Responda em português do Brasil.
`;

  return askGemini(prompt);
}
