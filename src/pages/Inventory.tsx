import { useState } from "react";
import { Search, Filter, Plus, MapPin, MoreHorizontal } from "lucide-react";
import { StatusBadge, OOHStatus } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

const mockData = [
  { id: 1, address: "Rua da Paz, 123", community: "Rocinha", city: "Rio de Janeiro", uf: "RJ", status: "active" as OOHStatus, owner: "José Almeida", campaign: "Verão Coca-Cola 2026", days: 18 },
  { id: 2, address: "Av. Brasil, 456", community: "Complexo do Alemão", city: "Rio de Janeiro", uf: "RJ", status: "available" as OOHStatus, owner: "Maria Souza", campaign: "-", days: null },
  { id: 3, address: "Trav. da Esperança, 78", community: "Vidigal", city: "Rio de Janeiro", uf: "RJ", status: "waiting" as OOHStatus, owner: "Ana Lima", campaign: "Lançamento Vivo Fibra", days: null },
  { id: 4, address: "Rua Nova, 22", community: "Maré", city: "Rio de Janeiro", uf: "RJ", status: "collect" as OOHStatus, owner: "Carlos Costa", campaign: "Festival Skol Beats", days: 0 },
  { id: 5, address: "Largo do Cruzeiro, 5", community: "Paraisópolis", city: "São Paulo", uf: "SP", status: "active" as OOHStatus, owner: "Pedro Rocha", campaign: "Verão Coca-Cola 2026", days: 25 },
  { id: 6, address: "Beco do Samba, 10", community: "Heliópolis", city: "São Paulo", uf: "SP", status: "available" as OOHStatus, owner: "Lucia Nunes", campaign: "-", days: null },
  { id: 7, address: "Rua Esperança, 88", community: "Cidade de Deus", city: "Rio de Janeiro", uf: "RJ", status: "finished" as OOHStatus, owner: "Roberto Silva", campaign: "-", days: null },
  { id: 8, address: "Av. Principal, 200", community: "Sol Nascente", city: "Brasília", uf: "DF", status: "active" as OOHStatus, owner: "Fernanda Dias", campaign: "Lançamento Vivo Fibra", days: 12 },
];

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OOHStatus | "all">("all");

  const filtered = mockData.filter((item) => {
    const matchesSearch =
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.community.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Inventário</h1>
          <p className="text-muted-foreground mt-1">{mockData.length} endereços cadastrados</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-brand text-primary-foreground text-sm font-semibold shadow-md hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Novo Endereço
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por endereço ou comunidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "available", "waiting", "active", "collect", "finished"] as const).map((s) => (
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
              {s === "all" ? "Todos" : s === "available" ? "Disponível" : s === "waiting" ? "Aguardando" : s === "active" ? "Em Veiculação" : s === "collect" ? "Recolher" : "Finalizado"}
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
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Endereço</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Comunidade</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Proprietário</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Campanha</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Dias</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.address}</p>
                        <p className="text-xs text-muted-foreground">{item.city} — {item.uf}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{item.community}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={item.status} /></td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{item.owner}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{item.campaign}</td>
                  <td className="px-5 py-3.5">
                    {item.days !== null && (
                      <span className={cn(
                        "text-sm font-semibold",
                        item.days === 0 ? "text-status-collect animate-pulse-status" : "text-foreground"
                      )}>
                        {item.days}d
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
