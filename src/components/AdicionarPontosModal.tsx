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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useEnderecosDisponiveis, useAdicionarPontos } from "@/hooks/useCampaignsData";
import { useCreateEndereco } from "@/hooks/useInventoryData";
import { Loader2, CheckCircle, Search, Plus } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("existentes");
  
  // Formulário de novo endereço
  const [novoEndereco, setNovoEndereco] = useState({
    uf: "",
    cidade: "",
    comunidade: "",
    endereco: "",
  });
  
  const { data: enderecos, isLoading } = useEnderecosDisponiveis();
  const adicionarPontos = useAdicionarPontos();
  const criarEndereco = useCreateEndereco();

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

  const handleCriarENovo = async () => {
    // Validar campos
    if (!novoEndereco.uf || !novoEndereco.cidade || !novoEndereco.comunidade || !novoEndereco.endereco) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Criar endereço
      const enderecoData = await criarEndereco.mutateAsync(novoEndereco);

      // 2. Adicionar à campanha
      await adicionarPontos.mutateAsync({
        campanha_id: campanhaId,
        enderecos_ids: [enderecoData.id],
      });

      toast({
        title: "Endereço criado e adicionado",
        description: "O novo endereço foi criado e vinculado à campanha.",
      });

      // Limpar formulário
      setNovoEndereco({
        uf: "",
        cidade: "",
        comunidade: "",
        endereco: "",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao criar endereço",
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
            Selecione endereços disponíveis ou crie um novo endereço.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existentes">Endereços Existentes</TabsTrigger>
            <TabsTrigger value="novo">
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existentes" className="flex-1 flex flex-col overflow-hidden mt-4">
            <div className="relative mb-4">
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
                    : "Nenhum endereço disponível. Crie um novo na aba 'Criar Novo'."}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t mt-4">
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
          </TabsContent>

          <TabsContent value="novo" className="flex-1 flex flex-col overflow-hidden mt-4">
            <div className="flex-1 overflow-y-auto space-y-4 p-1">
              <div className="space-y-2">
                <Label htmlFor="uf">Estado (UF)</Label>
                <Input
                  id="uf"
                  placeholder="Ex: SP"
                  value={novoEndereco.uf}
                  onChange={(e) => setNovoEndereco({ ...novoEndereco, uf: e.target.value.toUpperCase() })}
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="Ex: São Paulo"
                  value={novoEndereco.cidade}
                  onChange={(e) => setNovoEndereco({ ...novoEndereco, cidade: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comunidade">Comunidade</Label>
                <Input
                  id="comunidade"
                  placeholder="Ex: Paraisópolis"
                  value={novoEndereco.comunidade}
                  onChange={(e) => setNovoEndereco({ ...novoEndereco, comunidade: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  placeholder="Ex: Rua das Flores, 123"
                  value={novoEndereco.endereco}
                  onChange={(e) => setNovoEndereco({ ...novoEndereco, endereco: e.target.value })}
                />
              </div>

              <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                <p>💡 As coordenadas (latitude/longitude) serão buscadas automaticamente via Google Maps após a criação.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCriarENovo}
                disabled={criarEndereco.isPending || adicionarPontos.isPending}
              >
                {(criarEndereco.isPending || adicionarPontos.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar e Adicionar
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
