import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useEnderecosDisponiveis, useAdicionarPontos } from "@/hooks/useCampaignsData";
import { Loader2, CheckCircle, Search } from "lucide-react";

interface AdicionarPontosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campanhaId: string;
}

export function AdicionarPontosModal({
  open,
  onOpenChange,
  campanhaId,
}: AdicionarPontosModalProps) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: enderecos, isLoading } = useEnderecosDisponiveis();
  const adicionarPontos = useAdicionarPontos();

  const filtered = enderecos?.filter(
    (e) =>
      e.endereco.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.comunidade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.cidade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Selecione pelo menos um endereço",
        variant: "destructive",
      });
      return;
    }

    try {
      await adicionarPontos.mutateAsync({
        campanha_id: campanhaId,
        enderecos_ids: selectedIds,
      });

      toast({
        title: "Pontos adicionados",
        description: `${selectedIds.length} ponto(s) vinculado(s) à campanha.`,
      });

      setSelectedIds([]);
      setSearchQuery("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar pontos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Pontos à Campanha</DialogTitle>
          <DialogDescription>
            Selecione os endereços disponíveis para vincular à campanha.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por endereço, comunidade ou cidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto border rounded-lg">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="p-4 space-y-2">
              {filtered.map((endereco) => (
                <label
                  key={endereco.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.includes(endereco.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIds([...selectedIds, endereco.id]);
                      } else {
                        setSelectedIds(selectedIds.filter((id) => id !== endereco.id));
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {endereco.endereco}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {endereco.comunidade} — {endereco.cidade}, {endereco.uf}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery
                ? "Nenhum endereço encontrado"
                : "Nenhum endereço disponível"}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} endereço(s) selecionado(s)
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={adicionarPontos.isPending || selectedIds.length === 0}
            >
              {adicionarPontos.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Adicionar {selectedIds.length > 0 && `(${selectedIds.length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
