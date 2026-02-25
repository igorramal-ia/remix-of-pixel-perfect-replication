import { useEffect, useState } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin } from "lucide-react";

interface Endereco {
  id: string;
  uf: string;
  cidade: string;
  comunidade: string;
  endereco: string;
  lat: number;
  long: number;
  status: "disponivel" | "ocupado" | "inativo" | "manutencao";
}

const MapPage = () => {
  const { toast } = useToast();
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  // Centro do Brasil
  const defaultCenter = { lat: -15.7801, lng: -47.9292 };
  const defaultZoom = 4;

  useEffect(() => {
    fetchEnderecos();
  }, []);

  const fetchEnderecos = async () => {
    try {
      const { data, error } = await supabase
        .from("enderecos")
        .select("id, uf, cidade, comunidade, endereco, lat, long, status")
        .not("lat", "is", null)
        .not("long", "is", null);

      if (error) throw error;

      setEnderecos(data || []);
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

  const getMarkerColor = (status: Endereco["status"]): string => {
    const colors = {
      disponivel: "#22c55e", // verde
      ocupado: "#ef4444", // vermelho
      inativo: "#9ca3af", // cinza
      manutencao: "#f97316", // laranja
    };
    return colors[status];
  };

  const getStatusLabel = (status: Endereco["status"]): string => {
    const labels = {
      disponivel: "Disponível",
      ocupado: "Ocupado",
      inativo: "Inativo",
      manutencao: "Manutenção",
    };
    return labels[status];
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
      <div className="animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Mapa</h1>
            <p className="text-muted-foreground mt-1">
              Visualização geográfica do inventário ({enderecos.length} endereços)
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
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-muted-foreground">Inativo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Manutenção</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden h-[calc(100vh-200px)] animate-fade-in">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
            mapId="digital-favela-map"
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: "100%", height: "100%" }}
          >
            {enderecos.map((endereco) => (
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
                    backgroundColor: getMarkerColor(endereco.status),
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
                  lat: enderecos.find((e) => e.id === selectedMarker)?.lat || 0,
                  lng: enderecos.find((e) => e.id === selectedMarker)?.long || 0,
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
                            style={{ backgroundColor: getMarkerColor(endereco.status) }}
                          >
                            {getStatusLabel(endereco.status)}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
};

export default MapPage;
