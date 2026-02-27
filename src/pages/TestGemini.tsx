import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { askGemini, testGeminiConnection } from "@/services/gemini";
import { Loader2, CheckCircle, XCircle, Sparkles } from "lucide-react";

const TestGemini = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);

    try {
      const isConnected = await testGeminiConnection();
      setConnectionStatus(isConnected);

      if (isConnected) {
        toast({
          title: "Conexão bem-sucedida!",
          description: "A API do Gemini está funcionando corretamente.",
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: "Não foi possível conectar à API do Gemini.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setConnectionStatus(false);
      toast({
        title: "Erro ao testar conexão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleAskGemini = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vazio",
        description: "Digite uma pergunta para o Gemini.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse("");

    try {
      const result = await askGemini(prompt);
      setResponse(result);
      toast({
        title: "Resposta recebida!",
        description: "O Gemini respondeu sua pergunta.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao consultar Gemini",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const apiKey = import.meta.env.VITE_GEMINI_KEY;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Teste de Integração - Google Gemini
        </h1>
        <p className="text-muted-foreground mt-1">
          Teste a conexão e funcionalidade da API do Gemini
        </p>
      </div>

      {/* Status da API Key */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-foreground">
          Status da Configuração
        </h2>
        <div className="flex items-center gap-3">
          {apiKey ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  API Key configurada
                </p>
                <p className="text-xs text-muted-foreground">
                  VITE_GEMINI_KEY está definida
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  API Key não configurada
                </p>
                <p className="text-xs text-muted-foreground">
                  Configure VITE_GEMINI_KEY no arquivo .env
                </p>
              </div>
            </>
          )}
        </div>

        <Button
          onClick={handleTestConnection}
          disabled={!apiKey || testing}
          variant="outline"
          className="gap-2"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testando conexão...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Testar Conexão
            </>
          )}
        </Button>

        {connectionStatus !== null && (
          <div
            className={`p-3 rounded-lg ${
              connectionStatus
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                connectionStatus ? "text-green-800" : "text-red-800"
              }`}
            >
              {connectionStatus
                ? "✓ Conexão estabelecida com sucesso!"
                : "✗ Falha ao conectar com a API"}
            </p>
          </div>
        )}
      </div>

      {/* Teste de Prompt */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-foreground">
          Testar Prompt
        </h2>

        <div className="space-y-2">
          <Label htmlFor="prompt">Sua Pergunta</Label>
          <Textarea
            id="prompt"
            placeholder="Ex: Explique o que é marketing OOH em 3 linhas"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={!apiKey}
          />
        </div>

        <Button
          onClick={handleAskGemini}
          disabled={!apiKey || loading || !prompt.trim()}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Consultando Gemini...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Perguntar ao Gemini
            </>
          )}
        </Button>

        {response && (
          <div className="space-y-2">
            <Label>Resposta do Gemini</Label>
            <div className="p-4 rounded-lg bg-muted border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {response}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Exemplos de Uso */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-foreground">
          Exemplos de Prompts
        </h2>
        <div className="space-y-2">
          {[
            "Quais são as melhores práticas para campanhas OOH em comunidades?",
            "Sugira 5 locais estratégicos para instalar mídia OOH na Rocinha",
            "Como medir o sucesso de uma campanha OOH?",
            "Quais métricas são importantes para campanhas em favelas?",
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
              disabled={!apiKey}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestGemini;
