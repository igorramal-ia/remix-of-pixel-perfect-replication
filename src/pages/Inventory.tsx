import { useState } from "react";
import { Search, Plus, MapPin, MoreHorizontal, Trash2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NovoEnderecoModal } from "@/components/NovoEnderecoModal";
import { ValidarCoordenadasModal } from "@/components/ValidarCoordenadasModal";
import { useInventory, useDeletarEndereco } from "@/hooks/useInventoryData";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "disponivel" | "ocupado" | "inativo" | "manutencao";

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [validarModalOpen, setValidarModalOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: inventory, isLoading } = useInventory();
  const deletarEndereco = useDeletarEndereco();

  const handleDeletar = async (enderecoId: string, endereco: string) => {
    if (!confirm(`Tem certeza que deseja excluir o endereço "${endereco}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deletarEndereco.mutateAsync(enderecoId);
      toast({
        title: "Endereço excluído",
        description: "O endereço foi removido com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filtered = inventory?.filter((item) => {
    const matchesSearch =
      item.endereco.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.comunidade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cidade.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    const colors = {
      disponivel: "bg-green-500",
      ocupado: "bg-red-500",
      inativo: "bg-gray-400",
      manutencao: "bg-orange-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-400";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      disponivel: "Disponível",
      ocupado: "Ocupado",
      inativo: "Inativo",
      manutencao: "Manutenção",
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Inventário</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? (
              <Skeleton className="h-4 w-32 inline-block" />
            ) : (
              `${inventory?.length || 0} endereços cadastrados`
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setValidarModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-border text-sm font-semibold hover:bg-accent transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Validar Coordenadas
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-brand text-primary-foreground text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Novo Endereço
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por endereço, comunidade ou cidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "disponivel", "ocupado", "inativo", "manutencao"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {s === "all" ? "Todos" : getStatusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
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
                  Cidade/UF
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                  Proprietário
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                  Campanha
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                  Dias
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-4 h-4" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-6 w-20" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-8" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="w-8 h-8" />
                    </td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.endereco}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground">{item.comunidade}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {item.cidade} — {item.uf}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(item.status)} text-white border-0`}
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground">
                      {item.proprietario_nome || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {item.campanha_nome || "-"}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.dias_restantes !== null ? (
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            item.dias_restantes <= 0
                              ? "text-red-500 animate-pulse"
                              : item.dias_restantes <= 7
                              ? "text-orange-500"
                              : "text-foreground"
                          )}
                        >
                          {item.dias_restantes}d
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeletar(item.id, item.endereco)}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Endereço
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                    {searchQuery || statusFilter !== "all"
                      ? "Nenhum endereço encontrado com os filtros aplicados"
                      : "Nenhum endereço cadastrado. Clique em 'Novo Endereço' para começar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NovoEnderecoModal open={modalOpen} onOpenChange={setModalOpen} />
      <ValidarCoordenadasModal open={validarModalOpen} onOpenChange={setValidarModalOpen} />
    </div>
  );
};

export default Inventory;
