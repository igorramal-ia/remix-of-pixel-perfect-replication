import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, MapPin, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubstituirEndereco } from "@/hooks/useInstalacoes";
import { useEnderecosDisponiveis } from "@/hooks/useCampaignsData";

interface SubstituirEnderecoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instalacao: {
    id: string;
    endereco: string;
    comunidade: string;
    cidade: string;
    uf: string;
  };
  campanhaId: string;
}

export function SubstituirEnderecoModal({
  open,
  onOpenChange,
  instalacao,
  campanhaId,
}: SubstituirEnderecoModalProps) {
  const { toast } = useToast();
  const substituirMutation = useSubstituirEndereco();
  const { data: enderecosDisponiveis } = useEnderecosDisponiveis();

  const [motivo, setMotivo] = useState("");
  const [tipoSelecao, setTipoSelecao] = useState<"inventario" | "novo">("inventario");
  const [enderecoSelecionado, setEnderecoSelecionado] = useState("");

  // Filtrar apenas endereços da mesma região (já vem filtrado como disponível)
  const enderecosRegiao = enderecosDisponiveis?.filter(
    (e) => e.uf === instalacao.uf
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!motivo.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o motivo da substituição",
        variant: "destructive",
      });
      return;
    }

    if (tipoSelecao === "inventario" && !enderecoSelecionado) {
      toast({
        title: "Selecione um endereço",
        description: "Escolha um endereço do inventário",
        variant: "destructive",
      });
      return;
    }

    if (tipoSelecao === "novo") {
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Cadastro de novo endereço será implementado em breve",
        variant: "destructive",
      });
      return;
    }

    try {
      await substituirMutation.mutateAsync({
        instalacaoId: instalacao.id,
        motivoSubstituicao: motivo,
        novoEnderecoId: enderecoSelecionado,
        campanhaId,
        grupoId: null, // Temporariamente null
      });

      toast({
        title: "Endereço substituído",
        description: "O endereço foi substituído com sucesso. O novo endereço está pendente de instalação.",
      });

      // Resetar e fechar
      setMotivo("");
      setEnderecoSelecionado("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao substituir endereço",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Substituir Endereço</DialogTitle>
          <DialogDescription>
            Troque este endereço por outro disponível no inventário
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Endereço Atual */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Endereço Atual</Label>
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">{instalacao.endereco}</p>
                <p className="text-xs text-muted-foreground">
                  {instalacao.comunidade}, {instalacao.cidade}/{instalacao.uf}
                </p>
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo da Substituição <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Ex: Proprietário recusou, local inadequado, etc."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Tipo de Seleção */}
          <div className="space-y-3">
            <Label>Novo Endereço</Label>
            <RadioGroup value={tipoSelecao} onValueChange={(v) => setTipoSelecao(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inventario" id="inventario" />
                <Label htmlFor="inventario" className="font-normal cursor-pointer">
                  Selecionar do inventário
                </Label>
              </div>
              <div className="flex items-center space-x-2 opacity-50">
                <RadioGroupItem value="novo" id="novo" disabled />
                <Label htmlFor="novo" className="font-normal cursor-not-allowed">
                  Cadastrar novo endereço (em breve)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Lista de Endereços */}
          {tipoSelecao === "inventario" && (
            <div className="space-y-2">
              <Label>Endereços Disponíveis na Região</Label>
              {enderecosRegiao && enderecosRegiao.length > 0 ? (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {enderecosRegiao.map((endereco) => (
                    <label
                      key={endereco.id}
                      className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted transition-colors border-b last:border-b-0 ${
                        enderecoSelecionado === endereco.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="endereco"
                        value={endereco.id}
                        checked={enderecoSelecionado === endereco.id}
                        onChange={(e) => setEnderecoSelecionado(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{endereco.endereco}</p>
                        <p className="text-xs text-muted-foreground">
                          {endereco.comunidade}, {endereco.cidade}/{endereco.uf}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg p-6 text-center">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum endereço disponível na região {instalacao.uf}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cadastre novos endereços no inventário primeiro
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={substituirMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={
                substituirMutation.isPending ||
                (tipoSelecao === "inventario" && !enderecoSelecionado)
              }
            >
              {substituirMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Substituir Endereço
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
