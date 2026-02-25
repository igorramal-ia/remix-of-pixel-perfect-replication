import { Plus, Search, Calendar, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const campaigns = [
  {
    id: 1,
    name: "Verão Coca-Cola 2026",
    client: "Coca-Cola",
    startDate: "01/01/2026",
    endDate: "28/02/2026",
    cities: ["Rio de Janeiro", "São Paulo"],
    totalPoints: 50,
    installed: 39,
    manager: "Fernanda Alves",
    status: "active",
  },
  {
    id: 2,
    name: "Lançamento Vivo Fibra",
    client: "Vivo",
    startDate: "15/01/2026",
    endDate: "15/03/2026",
    cities: ["Rio de Janeiro", "Brasília"],
    totalPoints: 30,
    installed: 14,
    manager: "Ricardo Mendes",
    status: "active",
  },
  {
    id: 3,
    name: "Festival Skol Beats",
    client: "Ambev",
    startDate: "10/02/2026",
    endDate: "10/03/2026",
    cities: ["Rio de Janeiro"],
    totalPoints: 25,
    installed: 23,
    manager: "Juliana Costa",
    status: "active",
  },
  {
    id: 4,
    name: "Back to School Renner",
    client: "Renner",
    startDate: "01/02/2026",
    endDate: "01/04/2026",
    cities: ["São Paulo"],
    totalPoints: 40,
    installed: 5,
    manager: "Fernanda Alves",
    status: "planning",
  },
];

const Campaigns = () => {
  const progress = (installed: number, total: number) =>
    Math.round((installed / total) * 100);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Campanhas</h1>
          <p className="text-muted-foreground mt-1">{campaigns.length} campanhas cadastradas</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-brand text-primary-foreground text-sm font-semibold shadow-md hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaigns.map((campaign, i) => (
          <div
            key={campaign.id}
            className="bg-card rounded-xl border border-border shadow-card hover:shadow-elevated transition-all duration-200 overflow-hidden animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="p-5 space-y-4">
              {/* Title */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-foreground">{campaign.name}</h3>
                  <p className="text-sm text-muted-foreground">{campaign.client}</p>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold",
                    campaign.status === "active"
                      ? "bg-status-available/15 text-status-available"
                      : "bg-status-waiting/15 text-status-waiting"
                  )}
                >
                  {campaign.status === "active" ? "Ativa" : "Planejamento"}
                </span>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{campaign.startDate} — {campaign.endDate}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{campaign.manager}</span>
                </div>
              </div>

              {/* Cities */}
              <div className="flex gap-2 flex-wrap">
                {campaign.cities.map((city) => (
                  <span
                    key={city}
                    className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground"
                  >
                    {city}
                  </span>
                ))}
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {campaign.installed} de {campaign.totalPoints} pontos
                  </span>
                  <span className="font-semibold text-primary">
                    {progress(campaign.installed, campaign.totalPoints)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-brand transition-all duration-700"
                    style={{ width: `${progress(campaign.installed, campaign.totalPoints)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border px-5 py-3 flex justify-end">
              <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Ver detalhes <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Campaigns;
