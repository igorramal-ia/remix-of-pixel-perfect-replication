import { Sparkles } from "lucide-react";

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

const suggestedQuestions = {
  relatorios: [
    "Quantos relatórios foram gerados?",
    "Quantos relatórios foram gerados no último mês?",
    "Quantos relatórios foram gerados esta semana?",
  ],
  campanhas: [
    "Quantas campanhas ativas existem?",
    "Quantas campanhas foram finalizadas?",
    "Qual campanha tem mais instalações?",
  ],
  enderecos: [
    "Quantos endereços estão disponíveis?",
    "Quantos endereços estão ocupados?",
    "Quantos endereços existem em SP?",
  ],
  instalacoes: [
    "Quantas instalações ativas existem?",
    "Quantas instalações estão pendentes?",
    "Quantas instalações foram finalizadas?",
  ],
  geral: [
    "Mostre estatísticas gerais do sistema",
    "Qual o total de endereços cadastrados?",
  ],
};

export function SuggestedQuestions({ onSelectQuestion }: SuggestedQuestionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4" />
        <span>Perguntas sugeridas:</span>
      </div>

      <div className="space-y-3">
        {Object.entries(suggestedQuestions).map(([category, questions]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {category === "geral" ? "Geral" : category.charAt(0).toUpperCase() + category.slice(1)}
            </h4>
            <div className="flex flex-wrap gap-2">
              {questions.map((question) => (
                <button
                  key={question}
                  onClick={() => onSelectQuestion(question)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-card border border-border hover:bg-accent hover:border-primary/50 transition-colors text-left"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
