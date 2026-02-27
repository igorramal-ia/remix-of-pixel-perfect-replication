import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFinalizarInstalacao } from "@/hooks/useInstalacoes";
import { UploadFotos } from "./UploadFotos";

interface FinalizarInstalacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instalacao: {
    id: string;
    endereco: string;
    comunidade: string;
    cidade: string;
    uf: string;
    data_instalacao?: string;
    data_retirada_prevista?: string;
  };
  campanhaId: string;
}

export function FinalizarInstalacaoModal({
  open,
  onOpenChange,
  instalacao,
  campanhaId,
}: FinalizarInstalacaoModalProps) {
  const { toast } = useToast();
  const finalizarMutation = useFinalizarInstalacao();

  const [dataRetirada, setDataRetirada] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!dataRetirada) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha a data de retirada",
        variant: "destructive",
      });
      return;
    }

    if (fotos.length < 2) {
      toast({
        title: "Fotos obrigatórias",
        description: "É necessário enviar pelo menos 2 fotos da retirada",
        variant: "destructive",
      });
      return;
    }

    try {
      await finalizarMutation.mutateAsync({
        instalacaoId: instalacao.id,
        dataRetiradaReal: dataRetirada,
        fotosRetirada: fotos,
        observacoes: observacoes || undefined,
      });

      toast({
        title: "Instalação finalizada",
        description: "A instalação foi finalizada e o endereço foi liberado no inventário",
      });

      // Resetar e fechar
      setDataRetirada("");
      setFotos([]);
      setObservacoes("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar instalação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Instalação</DialogTitle>
          <DialogDescription>
            Registre a retirada da placa com fotos e data
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Endereço */}
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">{instalacao.endereco}</p>
              <p className="text-xs text-muted-foreground">
                {instalacao.comunidade}, {instalacao.cidade}/{instalacao.uf}
              </p>
              {instalacao.data_instalacao && (
                <p className="text-xs text-muted-foreground mt-1">
                  Instalado em: {new Date(instalacao.data_instalacao).toLocaleDateString("pt-BR")}
                </p>
              )}
              {instalacao.data_retirada_prevista && (
                <p className="text-xs text-muted-foreground">
                  Retirada prevista: {new Date(instalacao.data_retirada_prevista).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </div>

          {/* Data de Retirada */}
          <div className="space-y-2">
            <Label htmlFor="data-retirada">
              Data Real de Retirada <span className="text-destructive">*</span>
            </Label>
            <Input
              id="data-retirada"
              type="date"
              value={dataRetirada}
              onChange={(e) => setDataRetirada(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              min={instalacao.data_instalacao}
              required
            />
          </div>

          {/* Fotos */}
          <div className="space-y-2">
            <Label>
              Fotos da Retirada <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Envie pelo menos 2 fotos comprovando a retirada da placa
            </p>
            <UploadFotos
              campanhaId={campanhaId}
              instalacaoId={instalacao.id}
              tipo="retirada"
              fotos={fotos}
              onChange={setFotos}
              minFotos={2}
              maxFotos={5}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Retirada sem problemas, proprietário satisfeito"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={finalizarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={finalizarMutation.isPending || fotos.length < 2}
            >
              {finalizarMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Finalizar Instalação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
