import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAtivarInstalacao } from "@/hooks/useInstalacoes";
import { UploadFotos } from "./UploadFotos";

interface AtivarInstalacaoModalProps {
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

export function AtivarInstalacaoModal({
  open,
  onOpenChange,
  instalacao,
  campanhaId,
}: AtivarInstalacaoModalProps) {
  const { toast } = useToast();
  const ativarMutation = useAtivarInstalacao();

  const [dataInstalacao, setDataInstalacao] = useState("");
  const [dataRetirada, setDataRetirada] = useState("");
  const [fotoRecibo, setFotoRecibo] = useState<string[]>([]);
  const [fotosPlaca, setFotosPlaca] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!dataInstalacao || !dataRetirada) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha as datas de instalação e retirada",
        variant: "destructive",
      });
      return;
    }

    if (fotoRecibo.length < 1) {
      toast({
        title: "Foto do recibo obrigatória",
        description: "É necessário enviar 1 foto do comprovante/recibo",
        variant: "destructive",
      });
      return;
    }

    if (fotosPlaca.length < 2) {
      toast({
        title: "Fotos da placa obrigatórias",
        description: "É necessário enviar pelo menos 2 fotos da placa instalada",
        variant: "destructive",
      });
      return;
    }

    if (new Date(dataRetirada) <= new Date(dataInstalacao)) {
      toast({
        title: "Data inválida",
        description: "Data de retirada deve ser posterior à data de instalação",
        variant: "destructive",
      });
      return;
    }

    try {
      await ativarMutation.mutateAsync({
        instalacaoId: instalacao.id,
        dataInstalacao,
        dataRetiradaPrevista: dataRetirada,
        fotoRecibo: fotoRecibo[0], // Apenas 1 foto do recibo
        fotosPlaca: fotosPlaca, // Array de fotos da placa
      });

      toast({
        title: "Instalação ativada",
        description: "A instalação foi ativada com sucesso",
      });

      // Resetar e fechar
      setDataInstalacao("");
      setDataRetirada("");
      setFotoRecibo([]);
      setFotosPlaca([]);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao ativar instalação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ativar Instalação</DialogTitle>
          <DialogDescription>
            Registre a instalação da placa com fotos e datas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Endereço */}
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">{instalacao.endereco}</p>
              <p className="text-xs text-muted-foreground">
                {instalacao.comunidade}, {instalacao.cidade}/{instalacao.uf}
              </p>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-instalacao">
                Data de Instalação <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data-instalacao"
                type="date"
                value={dataInstalacao}
                onChange={(e) => setDataInstalacao(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-retirada">
                Data de Retirada Prevista <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data-retirada"
                type="date"
                value={dataRetirada}
                onChange={(e) => setDataRetirada(e.target.value)}
                min={dataInstalacao || undefined}
                required
              />
            </div>
          </div>

          {/* Foto do Recibo */}
          <div className="space-y-2">
            <Label>
              Foto do Recibo/Comprovante <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Envie 1 foto do comprovante de instalação (para controle interno)
            </p>
            <UploadFotos
              campanhaId={campanhaId}
              instalacaoId={instalacao.id}
              tipo="recibo"
              fotos={fotoRecibo}
              onChange={setFotoRecibo}
              minFotos={1}
              maxFotos={1}
            />
          </div>

          {/* Fotos da Placa */}
          <div className="space-y-2">
            <Label>
              Fotos da Placa Instalada <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Envie pelo menos 2 fotos da placa instalada (para relatório)
            </p>
            <UploadFotos
              campanhaId={campanhaId}
              instalacaoId={instalacao.id}
              tipo="placa"
              fotos={fotosPlaca}
              onChange={setFotosPlaca}
              minFotos={2}
              maxFotos={5}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={ativarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={ativarMutation.isPending || fotoRecibo.length < 1 || fotosPlaca.length < 2}
            >
              {ativarMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ativar Instalação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
