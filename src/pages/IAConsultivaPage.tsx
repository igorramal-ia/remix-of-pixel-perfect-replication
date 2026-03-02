import { useState, useRef, useEffect } from "react";
import { useIAConsultiva } from "@/hooks/useIAConsultiva";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { SuggestedQuestions } from "@/components/SuggestedQuestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Trash2, Sparkles } from "lucide-react";

export default function IAConsultivaPage() {
  const { messages, isProcessing, sendMessage, clearHistory } = useIAConsultiva();
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Focar no input ao carregar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    setShowSuggestions(false);
    await sendMessage(input);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleClearHistory = () => {
    clearHistory();
    setShowSuggestions(true);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">IA Consultiva</h1>
              <p className="text-sm text-muted-foreground">
                Assistente inteligente para consultas sobre o sistema
              </p>
            </div>
          </div>
          
          {messages.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar histórico
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Messages */}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {/* Typing Indicator */}
          {isProcessing && <TypingIndicator />}
          
          {/* Suggested Questions (only show initially) */}
          {showSuggestions && messages.length === 1 && (
            <div className="mt-8">
              <SuggestedQuestions onSelectQuestion={handleSelectQuestion} />
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-card px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-2">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta..."
                disabled={isProcessing}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                size="icon"
                className="flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            Pressione Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
