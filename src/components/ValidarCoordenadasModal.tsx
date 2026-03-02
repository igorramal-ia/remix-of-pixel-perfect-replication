import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  validarCoordenadasEmLote,
  corrigirCoordenadas,
} from "@/services/validacaoCoordenadas";

interface ValidarCoordenadasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ResultadoValidacao {
  endereco_id: string;
  endereco: string;
  lat_atual: number | null;
  long_atual: number | null;
  lat_correta: number | null;
  long_correta: number | null;
  distancia_km: number | null;
  status: "correto" | "incorreto" | "sem_coordenadas" | "erro";
  mensagem: string;
}

export function ValidarCoordenadasModal({
  open,
  onOpenChange,
}: ValidarCoordenadasModalProps) {
  const { toast } = useToast();
  const [validando, setValidando] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
  const [resultados, setResultados] = useState<ResultadoValidacao[]>([]);
  const [corrigindo, setCorrigindo] = useState<string | null>(null);

  const iniciarValidacao = async () => {
    setValidando(true);
    setResultados([]);
    setProgresso({ atual: 0, total: 0 });

    try {
      // Buscar endereços ativos
      const { data: enderecos, error } = await supabase
        .from("enderecos")
        .select("id, endereco, cidade, uf, lat, long")
        .eq("ativo", true)
        .order("cidade", { ascending: true });

      if (error) throw error;

      if (!enderecos || enderecos.length === 0) {
        toast({
          title: "Nenhum endereço encontrado",
          description: "Não há endereços ativos para validar",
        });
        setValidando(false);
        return;
      }

      setProgresso({ atual: 0, total: enderecos.length });

      const resultadosValidacao = await validarCoordenadasEmLote(
        enderecos,
        (atual, total) => {
          setProgresso({ atual, total });
        }
      );

      setResultados(resultadosValidacao);

      const incorretos = resultadosValidacao.filter(
        (r) => r.status === "incorreto" || r.status === "sem_coordenadas"
      ).length;

      toast({
        title: "Validação concluída",
        description: `${incorretos} endereço(s) com coordenadas incorretas ou ausentes`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao validar coordenadas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setValidando(false);
    }
  };

  const corrigirEndereco = async (resultado: ResultadoValidacao) => {
    if (!resultado.lat_correta || !resultado.long_correta) return;

    setCorrigindo(resultado.endereco_id);

    try {
      await corrigirCoordenadas(
        resultado.endereco_id,
        resultado.lat_correta,
        resultado.long_correta
      );

      toast({
        title: "Coordenadas corrigidas",
        description: "As coordenadas foram atualizadas com sucesso",
      });

      // Atualizar resultado
      setResultados((prev) =>
        prev.map((r) =>
          r.endereco_id === resultado.endereco_id
            ? { ...r, status: "correto" as const, mensagem: "Corrigido" }
            : r
        )
      );
    } catch (error: any) {
      toast({
        title: "Erro ao corrigir coordenadas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCorrigindo(null);
    }
  };

  const getStatusIcon = (status: ResultadoValidacao["status"]) => {
    switch (status) {
      case "correto":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "incorreto":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "sem_coordenadas":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "erro":
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const resultadosProblematicos = resultados.filter(
    (r) => r.status === "incorreto" || r.status === "sem_coordenadas"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Validar Coordenadas
          </DialogTitle>
          <DialogDescription>
            Valida se as coordenadas dos endereços estão corretas usando a API do Google Maps
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!validando && resultados.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Clique no botão abaixo para iniciar a validação de coordenadas
              </p>
              <Button onClick={iniciarValidacao}>
                Iniciar Validação
              </Button>
            </div>
          )}

          {validando && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Validando coordenadas... {progresso.atual} de {progresso.total}
              </p>
              <div className="w-full bg-secondary rounded-full h-2 mt-4">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${(progresso.atual / progresso.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {!validando && resultados.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Corretos</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {resultados.filter((r) => r.status === "correto").length}
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Incorretos</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {resultados.filter((r) => r.status === "incorreto").length}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Sem Coordenadas</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {resultados.filter((r) => r.status === "sem_coordenadas").length}
                  </p>
                </div>
              </div>

              {resultadosProblematicos.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Endereços com Problemas</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {resultadosProblematicos.map((resultado) => (
                      <div
                        key={resultado.endereco_id}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            {getStatusIcon(resultado.status)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {resultado.endereco}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {resultado.mensagem}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => corrigirEndereco(resultado)}
                            disabled={
                              corrigindo === resultado.endereco_id ||
                              !resultado.lat_correta ||
                              !resultado.long_correta
                            }
                          >
                            {corrigindo === resultado.endereco_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Corrigir"
                            )}
                          </Button>
                        </div>

                        {resultado.distancia_km !== null && (
                          <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 pl-7">
                            <div>
                              <span className="font-medium">Atual:</span>{" "}
                              {resultado.lat_atual?.toFixed(6)}, {resultado.long_atual?.toFixed(6)}
                            </div>
                            <div>
                              <span className="font-medium">Correta:</span>{" "}
                              {resultado.lat_correta?.toFixed(6)}, {resultado.long_correta?.toFixed(6)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
                <Button onClick={iniciarValidacao}>
                  Validar Novamente
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
