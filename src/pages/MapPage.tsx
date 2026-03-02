import { useEffect, useState } from "react";
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Endereco {
  id: string;
  uf: string;
  cidade: string;
  comunidade: string;
  endereco: string;
  lat: number;
  long: number;
  status: "disponivel" | "ocupado" | "inativo" | "manutencao";
  ativo: boolean;
  status_real: "disponivel" | "ocupado";
  campanha_nome?: string;
}

type FiltroStatus = "todos" | "disponivel" | "ocupado";

const MapPage = () => {
  const { toast } = useToast();
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  // Centro do Brasil
  const defaultCenter = { lat: -15.7801, lng: -47.9292 };
  const defaultZoom = 4;

  useEffect(() => {
    fetchEnderecos();
  }, []);

  const fetchEnderecos = async () => {
    try {
      // Buscar endereços ativos com coordenadas
      const { data: enderecosData, error: enderecosError } = await supabase
        .from("enderecos")
        .select("id, uf, cidade, comunidade, endereco, lat, long, status, ativo")
        .eq("ativo", true)
        .not("lat", "is", null)
        .not("long", "is", null);

      if (enderecosError) {
        console.error("Erro ao buscar endereços:", enderecosError);
        throw enderecosError;
      }

      if (!enderecosData || enderecosData.length === 0) {
        console.log("⚠️ Nenhum endereço encontrado com coordenadas e ativo=true");
        setEnderecos([]);
        setLoading(false);
        return;
      }

      console.log(`✅ ${enderecosData.length} endereços ativos encontrados`);

      // Buscar TODAS as instalações (sem filtro por endereço)
      const { data: instalacoesData, error: instalacoesError } = await supabase
        .from("instalacoes")
        .select("endereco_id, status, data_retirada_real, campanha_id");

      if (instalacoesError) {
        console.error("Erro ao buscar instalações:", instalacoesError);
        // Continua mesmo com erro nas instalações, mostra endereços sem status
        const enderecosSimples: Endereco[] = enderecosData.map((endereco) => ({
          ...endereco,
          status_real: "disponivel" as const,
        }));
        setEnderecos(enderecosSimples);
        setLoading(false);
        return;
      }

      console.log(`✅ ${instalacoesData?.length || 0} instalações encontradas`);

      // Buscar nomes das campanhas se houver instalações
      const campanhasMap = new Map<string, string>();
      if (instalacoesData && instalacoesData.length > 0) {
        const campanhaIds = [...new Set(instalacoesData.map(i => i.campanha_id))];
        const { data: campanhasData } = await supabase
          .from("campanhas")
          .select("id, nome")
          .in("id", campanhaIds);
        
        if (campanhasData) {
          campanhasData.forEach(c => campanhasMap.set(c.id, c.nome));
        }
      }

      // Processar cada endereço para determinar status real
      const enderecosComStatus: Endereco[] = enderecosData.map((endereco) => {
        const instalacoesDoEndereco = instalacoesData?.filter(
          (i) => i.endereco_id === endereco.id
        ) || [];

        // Verificar se tem instalação ativa ou pendente (ambos ocupam o endereço)
        const instalacaoAtiva = instalacoesDoEndereco.find(
          (i) => i.status === "ativa" || i.status === "pendente"
        );

        if (instalacaoAtiva) {
          return {
            ...endereco,
            status_real: "ocupado" as const,
            campanha_nome: campanhasMap.get(instalacaoAtiva.campanha_id),
          };
        }

        // Disponível (qualquer outro caso)
        return {
          ...endereco,
          status_real: "disponivel" as const,
        };
      });

      setEnderecos(enderecosComStatus);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar endereços",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar endereços
  const enderecosFiltrados = enderecos.filter((e) => {
    if (filtroStatus === "todos") return true;
    return e.status_real === filtroStatus;
  });

  const getMarkerColor = (statusReal: Endereco["status_real"]): string => {
    const colors = {
      disponivel: "#22c55e", // verde
      ocupado: "#ef4444", // vermelho
    };
    return colors[statusReal];
  };

  const getStatusLabel = (statusReal: Endereco["status_real"]): string => {
    const labels = {
      disponivel: "Disponível",
      ocupado: "Ocupado",
    };
    return labels[statusReal];
  };

  // Contar por status
  const contadores = {
    todos: enderecos.length,
    disponivel: enderecos.filter((e) => e.status_real === "disponivel").length,
    ocupado: enderecos.filter((e) => e.status_real === "ocupado").length,
  };

  if (!apiKey) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Mapa</h1>
          <p className="text-muted-foreground mt-1">Visualização geográfica do inventário</p>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="font-display font-semibold text-foreground">Chave da API não configurada</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Configure a variável de ambiente VITE_GOOGLE_MAPS_KEY para ativar o mapa.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Mapa</h1>
          <p className="text-muted-foreground mt-1">Visualização geográfica do inventário</p>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando endereços...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Mapa</h1>
            <p className="text-muted-foreground mt-1">
              Visualização geográfica do inventário ({enderecosFiltrados.length} de {enderecos.length} endereços)
            </p>
          </div>
          
          {/* Legenda */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Ocupado</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltroStatus("todos")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filtroStatus === "todos"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:bg-accent"
            )}
          >
            Todos ({contadores.todos})
          </button>
          <button
            onClick={() => setFiltroStatus("disponivel")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filtroStatus === "disponivel"
                ? "bg-green-500 text-white"
                : "bg-card border border-border text-muted-foreground hover:bg-accent"
            )}
          >
            Disponíveis ({contadores.disponivel})
          </button>
          <button
            onClick={() => setFiltroStatus("ocupado")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filtroStatus === "ocupado"
                ? "bg-red-500 text-white"
                : "bg-card border border-border text-muted-foreground hover:bg-accent"
            )}
          >
            Ocupados ({contadores.ocupado})
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden h-[calc(100vh-200px)] animate-fade-in">
        <APIProvider apiKey={apiKey}>
          <GoogleMap
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
            mapId="digital-favela-map"
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: "100%", height: "100%" }}
          >
            {enderecosFiltrados.map((endereco) => (
              <AdvancedMarker
                key={endereco.id}
                position={{ lat: endereco.lat, lng: endereco.long }}
                onClick={() => setSelectedMarker(endereco.id)}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: getMarkerColor(endereco.status_real),
                    border: "2px solid white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    cursor: "pointer",
                  }}
                />
              </AdvancedMarker>
            ))}

            {selectedMarker && (
              <InfoWindow
                position={{
                  lat: enderecosFiltrados.find((e) => e.id === selectedMarker)?.lat || 
                      enderecos.find((e) => e.id === selectedMarker)?.lat || 0,
                  lng: enderecosFiltrados.find((e) => e.id === selectedMarker)?.long || 
                      enderecos.find((e) => e.id === selectedMarker)?.long || 0,
                }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                {(() => {
                  const endereco = enderecos.find((e) => e.id === selectedMarker);
                  if (!endereco) return null;

                  return (
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold text-sm mb-2">{endereco.endereco}</h3>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          <span className="font-medium">Comunidade:</span> {endereco.comunidade}
                        </p>
                        <p>
                          <span className="font-medium">Cidade:</span> {endereco.cidade}
                        </p>
                        <p>
                          <span className="font-medium">UF:</span> {endereco.uf}
                        </p>
                        <p className="flex items-center gap-2 pt-1">
                          <span className="font-medium">Status:</span>
                          <span
                            className="px-2 py-0.5 rounded-full text-white text-xs"
                            style={{ backgroundColor: getMarkerColor(endereco.status_real) }}
                          >
                            {getStatusLabel(endereco.status_real)}
                          </span>
                        </p>
                        {endereco.status_real === "ocupado" && endereco.campanha_nome && (
                          <p className="pt-1">
                            <span className="font-medium">Campanha:</span> {endereco.campanha_nome}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </InfoWindow>
            )}
          </GoogleMap>
        </APIProvider>
      </div>
    </div>
  );
};

export default MapPage;
