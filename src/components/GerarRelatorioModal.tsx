import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { useGerarRelatorio } from '@/hooks/useGerarRelatorio';
import { toast } from 'sonner';
import type { TipoRelatorio } from '@/types/relatorios';

interface GerarRelatorioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campanhaId: string;
  campanhaNome: string;
}

export function GerarRelatorioModal({
  open,
  onOpenChange,
  campanhaId,
  campanhaNome,
}: GerarRelatorioModalProps) {
  const [tipo, setTipo] = useState<TipoRelatorio>('parcial');
  const [numeroPI, setNumeroPI] = useState('');
  const gerarRelatorio = useGerarRelatorio();

  const handleGerar = async () => {
    if (!numeroPI.trim()) {
      toast.error('Número PI é obrigatório');
      return;
    }

    await gerarRelatorio.mutateAsync({
      campanhaId,
      tipo,
      numeroPI: numeroPI.trim(),
    });

    // Limpar e fechar
    setNumeroPI('');
    setTipo('parcial');
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!gerarRelatorio.isPending) {
      setNumeroPI('');
      setTipo('parcial');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Relatório
          </DialogTitle>
          <DialogDescription>
            Gere um relatório profissional em PowerPoint para a campanha{' '}
            <span className="font-semibold">{campanhaNome}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de Relatório */}
          <div className="space-y-3">
            <Label>Tipo de Relatório</Label>
            <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as TipoRelatorio)}>
              <div className="flex items-start space-x-3 space-y-0 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="parcial" id="parcial" />
                <div className="flex-1">
                  <Label htmlFor="parcial" className="font-semibold cursor-pointer">
                    Relatório Parcial
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Apenas instalações ativas. Ideal para acompanhamento durante a campanha.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-y-0 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="final" id="final" />
                <div className="flex-1">
                  <Label htmlFor="final" className="font-semibold cursor-pointer">
                    Relatório Final
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Instalações ativas e finalizadas. Inclui fotos de instalação e retirada.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Número PI */}
          <div className="space-y-2">
            <Label htmlFor="numeroPI">
              Número PI <span className="text-destructive">*</span>
            </Label>
            <Input
              id="numeroPI"
              placeholder="Ex: PI-12345"
              value={numeroPI}
              onChange={(e) => setNumeroPI(e.target.value)}
              disabled={gerarRelatorio.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Número do Pedido de Inserção (obrigatório)
            </p>
          </div>

          {/* Loading */}
          {gerarRelatorio.isPending && (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Gerando relatório...</p>
                <p className="text-xs text-muted-foreground">
                  Isso pode levar alguns segundos. Aguarde.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={gerarRelatorio.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGerar}
            disabled={gerarRelatorio.isPending || !numeroPI.trim()}
          >
            {gerarRelatorio.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
