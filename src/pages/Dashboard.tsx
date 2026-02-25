import {
  MapPin,
  Megaphone,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge, OOHStatus } from "@/components/StatusBadge";

const recentActivity = [
  { address: "Rua da Paz, 123 — Rocinha", status: "active" as OOHStatus, rep: "Carlos Silva", time: "Há 2h" },
  { address: "Av. Brasil, 456 — Complexo do Alemão", status: "available" as OOHStatus, rep: "Ana Santos", time: "Há 4h" },
  { address: "Trav. da Esperança, 78 — Vidigal", status: "waiting" as OOHStatus, rep: "João Lima", time: "Há 6h" },
  { address: "Rua Nova, 22 — Maré", status: "collect" as OOHStatus, rep: "Maria Costa", time: "Há 8h" },
  { address: "Largo do Cruzeiro, 5 — Paraisópolis", status: "active" as OOHStatus, rep: "Pedro Rocha", time: "Há 12h" },
];

const activeCampaigns = [
  { name: "Verão Coca-Cola 2026", client: "Coca-Cola", progress: 78, total: 50, installed: 39 },
  { name: "Lançamento Vivo Fibra", client: "Vivo", progress: 45, total: 30, installed: 14 },
  { name: "Festival Skol Beats", client: "Ambev", progress: 92, total: 25, installed: 23 },
];

const Dashboard = () => {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do inventário OOH — Digital Favela
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Pontos"
          value={847}
          subtitle="Em 12 comunidades"
          icon={MapPin}
          trend={{ value: 12, positive: true }}
          variant="primary"
        />
        <StatCard
          title="Campanhas Ativas"
          value={8}
          subtitle="3 clientes"
          icon={Megaphone}
          trend={{ value: 25, positive: true }}
        />
        <StatCard
          title="Em Veiculação"
          value={312}
          subtitle="36.8% do inventário"
          icon={CheckCircle}
        />
        <StatCard
          title="Para Recolher"
          value={15}
          subtitle="Prazo vencido"
          icon={AlertTriangle}
          variant="accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-card rounded-xl border border-border shadow-card animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="font-display font-semibold text-foreground">Atividade Recente</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Últimas movimentações no inventário</p>
            </div>
            <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Ver tudo <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.address}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.rep} · {item.time}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-card animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="font-display font-semibold text-foreground">Campanhas Ativas</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Progresso de instalação</p>
            </div>
          </div>
          <div className="p-5 space-y-5">
            {activeCampaigns.map((campaign, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">{campaign.client}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary">{campaign.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-brand transition-all duration-500"
                    style={{ width: `${campaign.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {campaign.installed} de {campaign.total} pontos instalados
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status distribution */}
      <div className="bg-card rounded-xl border border-border shadow-card p-5 animate-fade-in">
        <h2 className="font-display font-semibold text-foreground mb-4">Distribuição do Inventário</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { status: "available" as OOHStatus, count: 420, pct: 49.6 },
            { status: "waiting" as OOHStatus, count: 85, pct: 10.0 },
            { status: "active" as OOHStatus, count: 312, pct: 36.8 },
            { status: "collect" as OOHStatus, count: 15, pct: 1.8 },
            { status: "finished" as OOHStatus, count: 15, pct: 1.8 },
          ].map((item) => (
            <div key={item.status} className="text-center p-3 rounded-lg bg-muted/50">
              <StatusBadge status={item.status} className="mb-2" />
              <p className="text-xl font-display font-bold text-foreground">{item.count}</p>
              <p className="text-xs text-muted-foreground">{item.pct}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
