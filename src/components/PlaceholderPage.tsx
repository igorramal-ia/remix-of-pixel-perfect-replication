import { FileText, Brain, Users } from "lucide-react";

const placeholderPages: Record<string, { title: string; desc: string; icon: typeof FileText }> = {
  reports: { title: "Relatórios", desc: "Geração de relatórios PDF por campanha com foto + dados.", icon: FileText },
  ai: { title: "IA de Estratégia", desc: "Sugestão inteligente de pontos de instalação via IA.", icon: Brain },
  users: { title: "Usuários", desc: "Gestão de representantes, gestores e clientes.", icon: Users },
};

export function PlaceholderPage({ page }: { page: "reports" | "ai" | "users" }) {
  const config = placeholderPages[page];
  const Icon = config.icon;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">{config.title}</h1>
        <p className="text-muted-foreground mt-1">{config.desc}</p>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-card h-96 flex items-center justify-center animate-fade-in">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-foreground">Em breve</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Este módulo será implementado nas próximas etapas do desenvolvimento.
          </p>
        </div>
      </div>
    </div>
  );
}
