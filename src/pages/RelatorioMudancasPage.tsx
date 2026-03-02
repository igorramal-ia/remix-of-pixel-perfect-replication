import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, MapPin, Calendar, User, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useHistoricoMudancas } from "@/hooks/useHistoricoMudancas";
import { cn } from "@/lib/utils";

const RelatorioMudancasPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: historico, isLoading } = useHistoricoMudancas();

  // Filtrar por busca
  const filtered = historico?.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.campanha.nome.toLowerCase().includes(searchLower) ||
      item.campanha.cliente.toLowerCase().includes(searchLower) ||
      item.endereco_antigo.endereco.toLowerCase().includes(searchLower) ||
      item.endereco_novo.endereco.toLowerCase().includes(searchLower) ||
      item.motivo.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            Relatório de Mudanças de Endereço
          </h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? (
              <Skeleton className="h-4 w-48 inline-block" />
            ) : (
              `${historico?.length || 0} mudanças registradas`
            )}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por campanha, cliente, endereço ou motivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Mudanças */}
      <div className="space-y-4 animate-fade-in">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map((mudanca) => (
            <div
              key={mudanca.id}
              className="bg-card rounded-xl border border-border shadow-card p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    {mudanca.campanha.nome}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Cliente: {mudanca.campanha.cliente}
                  </p>
                </div>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-200">
                  Substituição
                </Badge>
              </div>

              {/* Informações da Mudança */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Endereço Antigo */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Endereço Antigo
                  </p>
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <MapPin className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {mudanca.endereco_antigo.endereco}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mudanca.endereco_antigo.comunidade}, {mudanca.endereco_antigo.cidade}/{mudanca.endereco_antigo.uf}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Endereço Novo */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Endereço Novo
                  </p>
                  <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {mudanca.endereco_novo.endereco}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mudanca.endereco_novo.comunidade}, {mudanca.endereco_novo.cidade}/{mudanca.endereco_novo.uf}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivo */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Motivo da Substituição
                </p>
                <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                  {mudanca.motivo}
                </p>
              </div>

              {/* Observações (se houver) */}
              {mudanca.observacoes && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Observações
                  </p>
                  <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                    {mudanca.observacoes}
                  </p>
                </div>
              )}

              {/* Footer do Card */}
              <div className="flex items-center gap-4 pt-4 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {format(new Date(mudanca.data_mudanca), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Realizado por: {mudanca.realizado_por_profile.nome}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? "Nenhuma mudança encontrada" : "Nenhuma mudança registrada"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Tente ajustar os filtros de busca"
                : "As substituições de endereço aparecerão aqui"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatorioMudancasPage;
