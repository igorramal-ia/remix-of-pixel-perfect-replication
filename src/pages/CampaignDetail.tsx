import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Calendar, Users, CheckCircle, Clock, AlertTriangle, FileText } from "lucide-react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdicionarPontosModal } from "@/components/AdicionarPontosModal";
import { AtivarInstalacaoModal } from "@/components/AtivarInstalacaoModal";
import { FinalizarInstalacaoModal } from "@/components/FinalizarInstalacaoModal";
import { SubstituirEnderecoModal } from "@/components/SubstituirEnderecoModal";
import { GerarRelatorioModal } from "@/components/GerarRelatorioModal";
import { useCampaignDetail } from "@/hooks/useCampaignsData";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [ativarModalOpen, setAtivarModalOpen] = useState(false);
  const [finalizarModalOpen, setFinalizarModalOpen] = useState(false);
  const [substituirModalOpen, setSubstituirModalOpen] = useState(false);
  const [relatorioModalOpen, setRelatorioModalOpen] = useState(false);
  const [instalacaoSelecionada, setInstalacaoSelecionada] = useState<any>(null);
  const [enderecosPorPagina, setEnderecosPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const { data: campaign, isLoading } = useCampaignDetail(id!);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  // Filtrar por status
  const enderecosFiltrados = campaign?.enderecos.filter((e) => {
    if (filtroStatus === "todos") return true;
    return e.instalacao_status === filtroStatus;
  }) || [];

  // Calcular paginação
  const totalPaginas = enderecosFiltrados.length > 0
    ? Math.ceil(enderecosFiltrados.length / enderecosPorPagina)
    : 0;
  const enderecosPaginados = enderecosFiltrados.slice(
    (paginaAtual - 1) * enderecosPorPagina,
    paginaAtual * enderecosPorPagina
  );

  const getStatusColor = (status: string) => {
    const colors = {
      ativa: "bg-green-500",
      pendente: "bg-yellow-500",
      finalizada: "bg-gray-400",
      finalizado: "bg-gray-400",
      cancelada: "bg-red-500",
      substituido: "bg-orange-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-400";
  };

  const getStatusColorHex = (status: string) => {
    const colors = {
      ativa: "#22c55e",      // green-500
      pendente: "#eab308",   // yellow-500
      finalizada: "#9ca3af", // gray-400
      finalizado: "#9ca3af", // gray-400
      cancelada: "#ef4444",  // red-500
      substituido: "#f97316", // orange-500
    };
    return colors[status as keyof typeof colors] || "#9ca3af";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      ativa: "Ativa",
      pendente: "Pendente",
      finalizada: "Finalizada",
      cancelada: "Cancelada",
      substituido: "Substituído",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handleAbrirAtivar = (endereco: any) => {
    setInstalacaoSelecionada(endereco);
    setAtivarModalOpen(true);
  };

  const handleAbrirFinalizar = (endereco: any) => {
    setInstalacaoSelecionada(endereco);
    setFinalizarModalOpen(true);
  };

  const handleAbrirSubstituir = (endereco: any) => {
    setInstalacaoSelecionada(endereco);
    setSubstituirModalOpen(true);
  };

  // Calcular dias restantes para retirada
  const calcularDiasRestantes = (dataRetirada: string) => {
    const hoje = new Date();
    const retirada = new Date(dataRetirada);
    const diff = Math.ceil((retirada.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Calcular centro do mapa baseado nos pontos
  const mapCenter = campaign?.enderecos.length
    ? {
        lat:
          campaign.enderecos.reduce((sum, e) => sum + (e.lat || 0), 0) /
          campaign.enderecos.filter((e) => e.lat).length,
        lng:
          campaign.enderecos.reduce((sum, e) => sum + (e.long || 0), 0) /
          campaign.enderecos.filter((e) => e.long).length,
      }
    : { lat: -15.7801, lng: -47.9292 };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Campanha não encontrada
          </h2>
          <p className="text-muted-foreground mb-4">
            A campanha que você está procurando não existe.
          </p>
          <Button onClick={() => navigate("/campanhas")}>
            Voltar para Campanhas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in">
        <button
          onClick={() => navigate("/campanhas")}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            {campaign.nome}
          </h1>
          <p className="text-muted-foreground mt-1">{campaign.cliente}</p>
        </div>
        <div className="flex gap-2">
          {(hasRole('administrador') || hasRole('operacoes')) && (
            <>
              <Button
                onClick={() => setRelatorioModalOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Gerar Relatório
              </Button>
              <Button onClick={() => setModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Pontos
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-display font-bold text-foreground">
                {campaign.total_pontos}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total de Pontos</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-display font-bold text-green-600">
                {campaign.pontos_instalados}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Instalados</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-display font-bold text-primary">
                {campaign.progresso}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Progresso</p>
            </div>
          </div>

          {/* Map */}
          {apiKey && campaign.enderecos.some((e) => e.lat && e.long) && (
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden h-[400px]">
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultCenter={mapCenter}
                  defaultZoom={12}
                  mapId="digital-favela-map"
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  style={{ width: "100%", height: "100%" }}
                >
                  {campaign.enderecos
                    .filter((e) => e.lat && e.long)
                    .map((endereco) => (
                      <AdvancedMarker
                        key={endereco.id}
                        position={{ lat: endereco.lat!, lng: endereco.long! }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            backgroundColor: getStatusColorHex(
                              endereco.instalacao_status || "pendente"
                            ),
                            border: "3px solid white",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                            cursor: "pointer",
                          }}
                          title={`${endereco.endereco} - ${getStatusLabel(endereco.instalacao_status || "pendente")}`}
                        />
                      </AdvancedMarker>
                    ))}
                </Map>
              </APIProvider>
            </div>
          )}

          {/* Endereços */}
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-semibold text-foreground">
                    Endereços Vinculados
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {campaign.enderecos.length} pontos cadastrados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Mostrar:</label>
                  <select
                    value={enderecosPorPagina}
                    onChange={(e) => {
                      setEnderecosPorPagina(Number(e.target.value));
                      setPaginaAtual(1);
                    }}
                    className="text-xs border border-border rounded px-2 py-1 bg-background"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={campaign.enderecos.length}>Todos</option>
                  </select>
                </div>
              </div>

              {/* Filtros de Status */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFiltroStatus("todos");
                    setPaginaAtual(1);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    filtroStatus === "todos"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Todos ({campaign.enderecos.length})
                </button>
                <button
                  onClick={() => {
                    setFiltroStatus("pendente");
                    setPaginaAtual(1);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    filtroStatus === "pendente"
                      ? "bg-yellow-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Pendente ({campaign.enderecos.filter((e) => e.instalacao_status === "pendente").length})
                </button>
                <button
                  onClick={() => {
                    setFiltroStatus("ativa");
                    setPaginaAtual(1);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    filtroStatus === "ativa"
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Ativa ({campaign.enderecos.filter((e) => e.instalacao_status === "ativa").length})
                </button>
                <button
                  onClick={() => {
                    setFiltroStatus("finalizada");
                    setPaginaAtual(1);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    filtroStatus === "finalizada"
                      ? "bg-gray-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Finalizada ({campaign.enderecos.filter((e) => e.instalacao_status === "finalizada").length})
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      Endereço
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      Comunidade
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      Instalação
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enderecosPaginados.length > 0 ? (
                    enderecosPaginados.map((endereco) => {
                      const diasRestantes = endereco.data_retirada_prevista 
                        ? calcularDiasRestantes(endereco.data_retirada_prevista)
                        : null;
                      const avisoRetirada = diasRestantes !== null && diasRestantes <= 7 && diasRestantes >= 0;
                      const atrasado = diasRestantes !== null && diasRestantes < 0;

                      return (
                        <tr key={endereco.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {endereco.endereco}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {endereco.cidade} — {endereco.uf}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-foreground">
                            {endereco.comunidade}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant="outline"
                                className={`${getStatusColor(
                                  endereco.instalacao_status || "pendente"
                                )} text-white border-0 w-fit`}
                              >
                                {getStatusLabel(endereco.instalacao_status || "pendente")}
                              </Badge>
                              {avisoRetirada && (
                                <Badge variant="outline" className="bg-orange-500 text-white border-0 w-fit text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Retirar em {diasRestantes}d
                                </Badge>
                              )}
                              {atrasado && (
                                <Badge variant="outline" className="bg-red-600 text-white border-0 w-fit text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Atrasado {Math.abs(diasRestantes)}d
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-sm">
                              {endereco.data_instalacao ? (
                                <div>
                                  <p className="text-foreground">
                                    {format(new Date(endereco.data_instalacao), "dd/MM/yyyy", {
                                      locale: ptBR,
                                    })}
                                  </p>
                                  {endereco.data_retirada_prevista && (
                                    <p className="text-xs text-muted-foreground">
                                      Retirada: {format(new Date(endereco.data_retirada_prevista), "dd/MM/yyyy", {
                                        locale: ptBR,
                                      })}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-2">
                              {endereco.instalacao_status === "pendente" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleAbrirAtivar(endereco)}
                                  >
                                    Ativar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAbrirSubstituir(endereco)}
                                  >
                                    Substituir
                                  </Button>
                                </>
                              )}
                              {endereco.instalacao_status === "ativa" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleAbrirFinalizar(endereco)}
                                >
                                  Finalizar
                                </Button>
                              )}
                              {(endereco.instalacao_status === "finalizada" || endereco.instalacao_status === "substituido") && (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                        Nenhum endereço vinculado. Clique em "Adicionar Pontos" para começar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPaginas > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Mostrando {(paginaAtual - 1) * enderecosPorPagina + 1} a{" "}
                  {Math.min(paginaAtual * enderecosPorPagina, enderecosFiltrados.length)} de{" "}
                  {enderecosFiltrados.length} endereços
                  {filtroStatus !== "todos" && ` (filtrado: ${filtroStatus})`}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaAtual(paginaAtual - 1)}
                    disabled={paginaAtual === 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                      .filter((p) => {
                        // Mostrar primeira, última, atual e adjacentes
                        return (
                          p === 1 ||
                          p === totalPaginas ||
                          Math.abs(p - paginaAtual) <= 1
                        );
                      })
                      .map((p, idx, arr) => (
                        <React.Fragment key={`page-${p}`}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-2 text-muted-foreground">
                              ...
                            </span>
                          )}
                          <Button
                            variant={paginaAtual === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPaginaAtual(p)}
                            className="w-8 h-8 p-0"
                          >
                            {p}
                          </Button>
                        </React.Fragment>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaAtual(paginaAtual + 1)}
                    disabled={paginaAtual === totalPaginas}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
            <h3 className="font-display font-semibold text-foreground">
              Informações da Campanha
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Período</p>
                  <p className="text-foreground font-medium">
                    {campaign.data_inicio
                      ? format(new Date(campaign.data_inicio), "dd/MM/yyyy", {
                          locale: ptBR,
                        })
                      : "-"}{" "}
                    até{" "}
                    {campaign.data_fim
                      ? format(new Date(campaign.data_fim), "dd/MM/yyyy", {
                          locale: ptBR,
                        })
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Cidade(s)</p>
                  <p className="text-foreground font-medium">
                    {campaign.cidade || "Não especificado"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coordenadores */}
          <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-display font-semibold text-foreground">
                Coordenadores
              </h3>
            </div>
            <div className="space-y-2">
              {campaign.coordenadores.length > 0 ? (
                campaign.coordenadores.map((coordenador) => (
                  <div
                    key={coordenador.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-foreground">{coordenador.nome}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum coordenador vinculado
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <AdicionarPontosModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        campanhaId={campaign.id}
      />

      <GerarRelatorioModal
        open={relatorioModalOpen}
        onOpenChange={setRelatorioModalOpen}
        campanhaId={campaign.id}
        campanhaNome={campaign.nome}
      />

      {instalacaoSelecionada && (
        <>
          <AtivarInstalacaoModal
            open={ativarModalOpen}
            onOpenChange={setAtivarModalOpen}
            instalacao={instalacaoSelecionada}
            campanhaId={campaign.id}
          />

          <FinalizarInstalacaoModal
            open={finalizarModalOpen}
            onOpenChange={setFinalizarModalOpen}
            instalacao={instalacaoSelecionada}
            campanhaId={campaign.id}
          />

          <SubstituirEnderecoModal
            open={substituirModalOpen}
            onOpenChange={setSubstituirModalOpen}
            instalacao={instalacaoSelecionada}
            campanhaId={campaign.id}
          />
        </>
      )}
    </div>
  );
};

export default CampaignDetail;
