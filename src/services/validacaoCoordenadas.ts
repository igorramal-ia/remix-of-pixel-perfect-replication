import { supabase } from "@/integrations/supabase/client";

interface EnderecoParaValidar {
  id: string;
  endereco: string;
  cidade: string;
  uf: string;
  lat: number | null;
  long: number | null;
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

/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 */
function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Busca coordenadas corretas via Google Geocoding API
 */
async function buscarCoordenadasCorretas(
  endereco: string,
  cidade: string,
  uf: string
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    console.error("Google Maps API Key não configurada");
    return null;
  }

  const enderecoCompleto = `${endereco}, ${cidade}, ${uf}, Brasil`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    enderecoCompleto
  )}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar coordenadas:", error);
    return null;
  }
}

/**
 * Valida as coordenadas de um endereço
 */
export async function validarCoordenadas(
  endereco: EnderecoParaValidar
): Promise<ResultadoValidacao> {
  // Se não tem coordenadas, buscar
  if (!endereco.lat || !endereco.long) {
    const coordenadas = await buscarCoordenadasCorretas(
      endereco.endereco,
      endereco.cidade,
      endereco.uf
    );

    if (coordenadas) {
      return {
        endereco_id: endereco.id,
        endereco: `${endereco.endereco}, ${endereco.cidade}/${endereco.uf}`,
        lat_atual: null,
        long_atual: null,
        lat_correta: coordenadas.lat,
        long_correta: coordenadas.lng,
        distancia_km: null,
        status: "sem_coordenadas",
        mensagem: "Coordenadas encontradas",
      };
    }

    return {
      endereco_id: endereco.id,
      endereco: `${endereco.endereco}, ${endereco.cidade}/${endereco.uf}`,
      lat_atual: null,
      long_atual: null,
      lat_correta: null,
      long_correta: null,
      distancia_km: null,
      status: "erro",
      mensagem: "Não foi possível encontrar coordenadas",
    };
  }

  // Buscar coordenadas corretas
  const coordenadasCorretas = await buscarCoordenadasCorretas(
    endereco.endereco,
    endereco.cidade,
    endereco.uf
  );

  if (!coordenadasCorretas) {
    return {
      endereco_id: endereco.id,
      endereco: `${endereco.endereco}, ${endereco.cidade}/${endereco.uf}`,
      lat_atual: endereco.lat,
      long_atual: endereco.long,
      lat_correta: null,
      long_correta: null,
      distancia_km: null,
      status: "erro",
      mensagem: "Erro ao validar coordenadas",
    };
  }

  // Calcular distância
  const distancia = calcularDistancia(
    endereco.lat,
    endereco.long,
    coordenadasCorretas.lat,
    coordenadasCorretas.lng
  );

  // Considerar correto se a distância for menor que 1km
  const status = distancia < 1 ? "correto" : "incorreto";
  const mensagem =
    status === "correto"
      ? "Coordenadas corretas"
      : `Diferença de ${distancia.toFixed(2)} km`;

  return {
    endereco_id: endereco.id,
    endereco: `${endereco.endereco}, ${endereco.cidade}/${endereco.uf}`,
    lat_atual: endereco.lat,
    long_atual: endereco.long,
    lat_correta: coordenadasCorretas.lat,
    long_correta: coordenadasCorretas.lng,
    distancia_km: distancia,
    status,
    mensagem,
  };
}

/**
 * Valida coordenadas de múltiplos endereços
 */
export async function validarCoordenadasEmLote(
  enderecos: EnderecoParaValidar[],
  onProgress?: (atual: number, total: number) => void
): Promise<ResultadoValidacao[]> {
  const resultados: ResultadoValidacao[] = [];

  for (let i = 0; i < enderecos.length; i++) {
    const resultado = await validarCoordenadas(enderecos[i]);
    resultados.push(resultado);

    if (onProgress) {
      onProgress(i + 1, enderecos.length);
    }

    // Delay para não exceder rate limit da API
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return resultados;
}

/**
 * Corrige coordenadas de um endereço
 */
export async function corrigirCoordenadas(
  enderecoId: string,
  lat: number,
  lng: number
): Promise<void> {
  const { error } = await supabase
    .from("enderecos")
    .update({ lat, long: lng })
    .eq("id", enderecoId);

  if (error) {
    throw new Error(`Erro ao atualizar coordenadas: ${error.message}`);
  }
}
