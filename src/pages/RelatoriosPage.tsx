import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  Download,
  Trash2,
  Filter,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRelatorios, useDeletarRelatorio } from '@/hooks/useRelatorios';
import { useCampaigns } from '@/hooks/useCampaignsData';
import { useAuth } from '@/contexts/AuthContext';
import type { FiltrosRelatorios, TipoRelatorio } from '@/types/relatorios';

export default function RelatoriosPage() {
  const { hasRole } = useAuth();
  const [filtros, setFiltros] = useState<FiltrosRelatorios>({
    campanhaId: '',
    tipo: '',
    dataInicio: '',
    dataFim: '',
  });
  const [relatorioParaDeletar, setRelatorioParaDeletar] = useState<string | null>(null);

  const { data: relatorios, isLoading } = useRelatorios(filtros);
  const { data: campanhas } = useCampaigns();
  const deletarRelatorio = useDeletarRelatorio();

  const podeDeleter = hasRole('administrador') || hasRole('operacoes');

  const handleLimparFiltros = () => {
    setFiltros({
      campanhaId: '',
      tipo: '',
      dataInicio: '',
      dataFim: '',
    });
  };

  const handleDeletar = async () => {
    if (relatorioParaDeletar) {
      await deletarRelatorio.mutateAsync(relatorioParaDeletar);
      setRelatorioParaDeletar(null);
    }
  };

  const formatarTamanho = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getTipoBadge = (tipo: TipoRelatorio) => {
    if (tipo === 'parcial') {
      return (
        <Badge variant="outline" className="bg-blue-500 text-white border-0">
          Parcial
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-500 text-white border-0">
        Final
      </Badge>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">
            Histórico de relatórios gerados do sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-xl border border-border shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro por Campanha */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Campanha</label>
            <Select
              value={filtros.campanhaId}
              onValueChange={(value) =>
                setFiltros((prev) => ({ ...prev, campanhaId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {campanhas?.map((campanha) => (
                  <SelectItem key={campanha.id} value={campanha.id}>
                    {campanha.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Tipo */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Tipo</label>
            <Select
              value={filtros.tipo}
              onValueChange={(value) => setFiltros((prev) => ({ ...prev, tipo: value as '' | TipoRelatorio }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botão Limpar */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={handleLimparFiltros}
              className="w-full gap-2"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela de Relatórios */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                  Campanha
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                  Tipo
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                  Número PI
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                  Gerado por
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                  Data
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                  Tamanho
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-6 w-16" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : relatorios && relatorios.length > 0 ? (
                relatorios.map((relatorio) => (
                  <tr key={relatorio.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {relatorio.campanha?.nome || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {relatorio.campanha?.cliente || ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{getTipoBadge(relatorio.tipo)}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground">
                      {relatorio.numero_pi}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground">
                      {relatorio.gerado_por_profile?.nome || 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground">
                      {format(new Date(relatorio.gerado_em), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {formatarTamanho(relatorio.tamanho_bytes)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(relatorio.url_arquivo, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        {podeDeleter && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRelatorioParaDeletar(relatorio.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        Nenhum relatório encontrado
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gere relatórios a partir das páginas de campanhas
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog de Confirmação de Deleção */}
      <AlertDialog
        open={!!relatorioParaDeletar}
        onOpenChange={(open) => !open && setRelatorioParaDeletar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Deletar Relatório
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este relatório? Esta ação não pode ser
              desfeita. O arquivo será removido permanentemente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletarRelatorio.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletar}
              disabled={deletarRelatorio.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deletarRelatorio.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Deletar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
