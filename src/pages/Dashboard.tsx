import {
  MapPin,
  Megaphone,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatCardSkeleton } from "@/components/StatCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import DashboardCoordenador from "./DashboardCoordenador";
import {
  useTotalPontos,
  useDistribuicaoStatus,
  useCampanhasAtivas,
  useAtividadeRecente,
  useEstatisticasInstalacoes,
  useComunidades,
  useClientes,
} from "@/hooks/useDashboardData";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const { hasRole } = useAuth();

  // Se for coordenador, mostrar dashboard específico
  if (hasRole("coordenador")) {
    return <DashboardCoordenador />;
  }

  // Dashboard para admin/operações
  return <DashboardAdmin />;
};

const DashboardAdmin = () => {
  const { data: totalPontos, isLoading: loadingPontos } = useTotalPontos();
  const { data: distribuicao, isLoading: loadingDistribuicao } = useDistribuicaoStatus();
  const { data: campanhas, isLoading: loadingCampanhas } = useCampanhasAtivas();
  const { data: atividades, isLoading: loadingAtividades } = useAtividadeRecente();
  const { data: estatisticas, isLoading: loadingEstatisticas } = useEstatisticasInstalacoes();
  const { data: numComunidades, isLoading: loadingComunidades } = useComunidades();
  const { data: numClientes, isLoading: loadingClientes } = useClientes();

  const getStatusColor = (status: string) => {
    const colors = {
      disponivel: "bg-green-500",
      ocupado: "bg-red-500",
      inativo: "bg-gray-400",
      manutencao: "bg-orange-500",
      ativa: "bg-green-500",
      pendente: "bg-yellow-500",
      finalizada: "bg-gray-400",
      cancelada: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-400";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      disponivel: "Disponível",
      ocupado: "Ocupado",
      inativo: "Inativo",
      manutencao: "Manutenção",
      ativa: "Ativa",
      pendente: "Pendente",
      finalizada: "Finalizada",
      cancelada: "Cancelada",
    };
    return labels[status as keyof typeof labels] || status;
  };

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
        {loadingPontos ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            title="Total de Pontos"
            value={totalPontos || 0}
            subtitle={`${totalPontos || 0} endereços cadastrados`}
            icon={MapPin}
            variant="primary"
          />
        )}

        {loadingCampanhas || loadingClientes ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            title="Campanhas Ativas"
            value={campanhas?.length || 0}
            subtitle={`${numClientes || 0} clientes`}
            icon={Megaphone}
          />
        )}

        {loadingEstatisticas ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            title="Em Veiculação"
            value={estatisticas?.ativas || 0}
            subtitle={
              totalPontos && totalPontos > 0
                ? `${((estatisticas?.ativas || 0) / totalPontos * 100).toFixed(1)}% do inventário`
                : "0% do inventário"
            }
            icon={CheckCircle}
          />
        )}

        {loadingEstatisticas ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            title="Para Recolher"
            value={estatisticas?.vencidas || 0}
            subtitle="Prazo vencido"
            icon={AlertTriangle}
            variant="accent"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-card rounded-xl border border-border shadow-card animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="font-display font-semibold text-foreground">Atividade Recente</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Últimas movimentações no inventário</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {loadingAtividades ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-3.5 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : atividades && atividades.length > 0 ? (
              atividades.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.endereco} — {item.comunidade}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.usuario} · {formatDistanceToNow(new Date(item.data), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(item.status)} text-white border-0`}
                  >
                    {getStatusLabel(item.status)}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                Nenhuma atividade recente
              </div>
            )}
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
            {loadingCampanhas ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : campanhas && campanhas.length > 0 ? (
              campanhas.slice(0, 3).map((campanha, i) => (
                <div key={campanha.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{campanha.nome}</p>
                      <p className="text-xs text-muted-foreground">{campanha.cliente}</p>
                    </div>
                    <span className="text-xs font-semibold text-primary">{campanha.progresso}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-brand transition-all duration-500"
                      style={{ width: `${campanha.progresso}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {campanha.instalacoes_ativas} de {campanha.total_instalacoes} pontos instalados
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhuma campanha ativa
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status distribution */}
      <div className="bg-card rounded-xl border border-border shadow-card p-5 animate-fade-in">
        <h2 className="font-display font-semibold text-foreground mb-4">Distribuição do Inventário</h2>
        {loadingDistribuicao ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-6 w-20 mx-auto mb-2" />
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        ) : distribuicao ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { status: "disponivel", label: "Disponível", data: distribuicao.disponivel },
              { status: "ocupado", label: "Ocupado", data: distribuicao.ocupado },
              { status: "inativo", label: "Inativo", data: distribuicao.inativo },
              { status: "manutencao", label: "Manutenção", data: distribuicao.manutencao },
            ].map((item) => (
              <div key={item.status} className="text-center p-3 rounded-lg bg-muted/50">
                <Badge
                  variant="outline"
                  className={`${getStatusColor(item.status)} text-white border-0 mb-2`}
                >
                  {item.label}
                </Badge>
                <p className="text-xl font-display font-bold text-foreground">{item.data.count}</p>
                <p className="text-xs text-muted-foreground">{item.data.percentage.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;
