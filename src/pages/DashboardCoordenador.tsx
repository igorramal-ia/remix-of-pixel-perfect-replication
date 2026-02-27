import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { StatCardSkeleton } from "@/components/StatCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Megaphone,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
} from "lucide-react";
import {
  useCoordenadorStats,
  useCampanhasCoordenador,
  useTerritoriosCoordenador,
} from "@/hooks/useCoordenadorDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DashboardCoordenador = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: loadingStats, error: errorStats } = useCoordenadorStats();
  const { data: campanhas, isLoading: loadingCampanhas, error: errorCampanhas } = useCampanhasCoordenador();
  const { data: territorios, isLoading: loadingTerritorios, error: errorTerritorios } = useTerritoriosCoordenador();

  // Debug
  console.log("🔍 [DashboardCoordenador] Renderizando...");
  console.log("  user:", user);
  console.log("  stats:", stats);
  console.log("  campanhas:", campanhas);
  console.log("  territorios:", territorios);
  console.log("  errors:", { errorStats, errorCampanhas, errorTerritorios });

  if (errorStats || errorCampanhas || errorTerritorios) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <h2 className="text-lg font-semibold text-destructive mb-2">Erro ao carregar dashboard</h2>
          <p className="text-sm text-muted-foreground">
            {errorStats?.message || errorCampanhas?.message || errorTerritorios?.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Bem-vindo, {user?.user_metadata?.nome || "Coordenador"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Suas campanhas e estatísticas de instalação
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Campanhas Ativas"
              value={stats?.campanhas_ativas || 0}
              subtitle="Atribuídas a você"
              icon={Megaphone}
              variant="primary"
            />
            <StatCard
              title="Comunidades"
              value={stats?.total_enderecos || 0}
              subtitle="Sob sua responsabilidade"
              icon={MapPin}
            />
            <StatCard
              title="Instalados"
              value={stats?.instalacoes_ativas || 0}
              subtitle={`${stats?.progresso_geral || 0}% concluído`}
              icon={CheckCircle}
            />
            <StatCard
              title="Pendentes"
              value={stats?.instalacoes_pendentes || 0}
              subtitle="Aguardando instalação"
              icon={AlertTriangle}
              variant="accent"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campanhas Ativas */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-card animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="font-display font-semibold text-foreground">
                Minhas Campanhas Ativas
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Campanhas atribuídas a você
              </p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {loadingCampanhas ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : campanhas && campanhas.length > 0 ? (
              campanhas.map((campanha) => (
                <div
                  key={campanha.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/campanhas/${campanha.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {campanha.nome}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {campanha.cliente}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/15 text-green-600 border-0">
                      Ativa
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {campanha.data_inicio
                        ? format(new Date(campanha.data_inicio), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}{" "}
                      —{" "}
                      {campanha.data_fim
                        ? format(new Date(campanha.data_fim), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <MapPin className="w-3 h-3" />
                    <span>{campanha.regiao}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {campanha.pontos_instalados} de {campanha.total_pontos} pontos
                      </span>
                      <span className="font-semibold text-primary">
                        {campanha.progresso}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-brand transition-all duration-700"
                        style={{ width: `${campanha.progresso}%` }}
                      />
                    </div>
                    {campanha.pontos_pendentes > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {campanha.pontos_pendentes} ponto
                        {campanha.pontos_pendentes > 1 ? "s" : ""} pendente
                        {campanha.pontos_pendentes > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/campanhas/${campanha.id}`);
                      }}
                    >
                      Ver Detalhes
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                    {campanha.pontos_pendentes > 0 && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Redirecionar para versão mobile
                          navigate(`/campanhas/${campanha.id}`);
                        }}
                      >
                        Trabalhar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Nenhuma campanha ativa atribuída a você
              </div>
            )}
          </div>
        </div>

        {/* Territórios */}
        <div className="bg-card rounded-xl border border-border shadow-card animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="font-display font-semibold text-foreground">
                Meus Territórios
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Regiões sob sua responsabilidade
              </p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {loadingTerritorios ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : territorios && territorios.length > 0 ? (
              territorios.map((territorio, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {territorio.uf}
                  </h3>
                  {territorio.cidades.map((cidade, cidadeIdx) => (
                    <div key={cidadeIdx} className="ml-6 space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {cidade.nome}
                      </p>
                      {cidade.comunidades.map((comunidade, comIdx) => (
                        <div
                          key={comIdx}
                          className="ml-4 flex items-center justify-between text-xs"
                        >
                          <span className="text-muted-foreground">
                            • {comunidade.nome}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {comunidade.total_enderecos} endereços
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhum território atribuído
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCoordenador;
