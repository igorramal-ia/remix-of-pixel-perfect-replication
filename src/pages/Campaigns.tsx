import { useState } from "react";
import { Plus, Calendar, Users, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { NovaCampanhaModalV2 } from "@/components/NovaCampanhaModalV2";
import { useCampaigns, useDeleteCampanha, useUpdateCampanha } from "@/hooks/useCampaignsData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Campaigns = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCampanha, setSelectedCampanha] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    cliente: "",
    data_inicio: "",
    data_fim: "",
  });

  const { data: campaigns, isLoading } = useCampaigns();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const deleteCampanha = useDeleteCampanha();
  const updateCampanha = useUpdateCampanha();

  const canManage = hasRole("administrador") || hasRole("operacoes");

  const isActive = (dataInicio: string | null, dataFim: string | null) => {
    if (!dataInicio || !dataFim) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);
    return hoje >= inicio && hoje <= fim;
  };

  const handleEdit = (e: React.MouseEvent, campaign: any) => {
    e.stopPropagation();
    setSelectedCampanha(campaign);
    setEditForm({
      nome: campaign.nome,
      cliente: campaign.cliente,
      data_inicio: campaign.data_inicio || "",
      data_fim: campaign.data_fim || "",
    });
    setEditModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, campaign: any) => {
    e.stopPropagation();
    setSelectedCampanha(campaign);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCampanha) return;

    try {
      await deleteCampanha.mutateAsync(selectedCampanha.id);
      toast({
        title: "Campanha excluída",
        description: "A campanha foi removida com sucesso.",
      });
      setDeleteModalOpen(false);
      setSelectedCampanha(null);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir campanha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const confirmEdit = async () => {
    if (!selectedCampanha) return;

    try {
      await updateCampanha.mutateAsync({
        id: selectedCampanha.id,
        ...editForm,
      });
      toast({
        title: "Campanha atualizada",
        description: "As informações foram atualizadas com sucesso.",
      });
      setEditModalOpen(false);
      setSelectedCampanha(null);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar campanha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Campanhas
          </h1>
          <div className="text-muted-foreground mt-1">
            {isLoading ? (
              <Skeleton className="h-4 w-32 inline-block" />
            ) : (
              <span>{campaigns?.length || 0} campanhas cadastradas</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-brand text-primary-foreground text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
              <div className="border-t border-border px-5 py-3">
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
            </div>
          ))
        ) : campaigns && campaigns.length > 0 ? (
          campaigns.map((campaign, i) => (
            <div
              key={campaign.id}
              className="bg-card rounded-xl border border-border shadow-card hover:shadow-elevated transition-all duration-200 overflow-hidden animate-fade-in cursor-pointer"
              style={{ animationDelay: `${i * 100}ms` }}
              onClick={() => navigate(`/campanhas/${campaign.id}`)}
            >
              <div className="p-5 space-y-4">
                {/* Title */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-foreground">
                      {campaign.nome}
                    </h3>
                    <p className="text-sm text-muted-foreground">{campaign.cliente}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold",
                        isActive(campaign.data_inicio, campaign.data_fim)
                          ? "bg-green-500/15 text-green-600"
                          : "bg-gray-500/15 text-gray-600"
                      )}
                    >
                      {isActive(campaign.data_inicio, campaign.data_fim) ? "Ativa" : "Finalizada"}
                    </span>
                    {canManage && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleEdit(e, campaign)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors"
                          title="Editar campanha"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, campaign)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                          title="Excluir campanha"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {campaign.data_inicio
                        ? format(new Date(campaign.data_inicio), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}{" "}
                      —{" "}
                      {campaign.data_fim
                        ? format(new Date(campaign.data_fim), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>
                      {campaign.coordenadores.length > 0
                        ? `${campaign.coordenadores.length} coordenador${
                            campaign.coordenadores.length > 1 ? "es" : ""
                          }`
                        : "Sem coordenadores"}
                    </span>
                  </div>
                </div>

                {/* Cities */}
                {campaign.cidade && (
                  <div className="flex gap-2 flex-wrap">
                    {campaign.cidade.split(",").map((city, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground"
                      >
                        {city.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {campaign.pontos_instalados} de {campaign.total_pontos} pontos
                    </span>
                    <span className="font-semibold text-primary">
                      {campaign.progresso}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-brand transition-all duration-700"
                      style={{ width: `${campaign.progresso}%` }}
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
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            Nenhuma campanha cadastrada. Clique em "Nova Campanha" para começar.
          </div>
        )}
      </div>

      <NovaCampanhaModalV2 open={modalOpen} onOpenChange={setModalOpen} />

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Campanha</DialogTitle>
            <DialogDescription>
              Atualize as informações da campanha
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome da Campanha</Label>
              <Input
                id="edit-nome"
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-cliente">Cliente</Label>
              <Input
                id="edit-cliente"
                value={editForm.cliente}
                onChange={(e) => setEditForm({ ...editForm, cliente: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-data-inicio">Data Início</Label>
                <Input
                  id="edit-data-inicio"
                  type="date"
                  value={editForm.data_inicio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, data_inicio: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-data-fim">Data Fim</Label>
                <Input
                  id="edit-data-fim"
                  type="date"
                  value={editForm.data_fim}
                  onChange={(e) => setEditForm({ ...editForm, data_fim: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmEdit}
                disabled={updateCampanha.isPending}
                className="flex-1"
              >
                {updateCampanha.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Campanha</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a campanha "{selectedCampanha?.nome}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteCampanha.isPending}
              className="flex-1"
            >
              {deleteCampanha.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;
