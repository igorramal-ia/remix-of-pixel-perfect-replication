import { useState, useCallback } from "react";
import { Message } from "@/types/iaConsultiva";
import { interpretQuestion } from "@/services/questionInterpreter";
import { executeQuery } from "@/services/queryExecutor";
import { formatResponse } from "@/services/responseFormatter";

export function useIAConsultiva() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content: "Olá! Sou seu assistente consultivo. Posso responder perguntas sobre relatórios, campanhas, endereços e instalações do sistema. Como posso ajudar?",
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return;

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Interpretar pergunta
      const intent = interpretQuestion(content);

      // Se confidence muito baixa, retornar mensagem de erro
      if (intent.confidence < 0.5) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          type: "assistant",
          content: "Desculpe, não entendi sua pergunta. Tente reformular ou escolha uma das sugestões abaixo:\n\n• Quantos relatórios foram gerados?\n• Quantas campanhas ativas existem?\n• Quantos endereços estão disponíveis?",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return;
      }

      // Executar query
      const result = await executeQuery(intent);

      // Formatar resposta
      const formatted = formatResponse(intent, result);

      // Adicionar resposta do assistente
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: formatted.text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Se houver sugestões, adicionar como mensagem separada
      if (formatted.suggestions && formatted.suggestions.length > 0) {
        setTimeout(() => {
          const suggestionsMessage: Message = {
            id: `suggestions-${Date.now()}`,
            type: "assistant",
            content: `Você também pode perguntar:\n${formatted.suggestions.map((s) => `• ${s}`).join("\n")}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, suggestionsMessage]);
        }, 500);
      }
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const clearHistory = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        type: "assistant",
        content: "Olá! Sou seu assistente consultivo. Posso responder perguntas sobre relatórios, campanhas, endereços e instalações do sistema. Como posso ajudar?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    isProcessing,
    sendMessage,
    clearHistory,
  };
}
