import { supabase } from '@/integrations/supabase/client';

// Pegar API Key do ambiente (suporta ambos os nomes)
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY;

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
}

/**
 * Busca coordenadas de um endereço usando Google Geocoding API
 * 
 * @param endereco - Endereço completo (ex: "Rua Exemplo, 123")
 * @param cidade - Nome da cidade
 * @param uf - Sigla do estado (ex: "SP")
 * @returns Coordenadas (latitude, longitude) ou null se não encontrar
 */
export async function geocodeEndereco(
  endereco: string,
  cidade: string,
  uf: string
): Promise<GeocodingResult | null> {
  try {
    // Verificar se API Key está configurada
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('⚠️ Google Maps API Key não configurada');
      return null;
    }

    // Montar endereço completo
    const enderecoCompleto = `${endereco}, ${cidade}, ${uf}, Brasil`;
    
    console.log('🗺️ Buscando coordenadas para:', enderecoCompleto);
    
    // Chamar API do Google
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(enderecoCompleto)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      
      const geocodingResult = {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formatted_address: result.formatted_address,
      };
      
      console.log('✅ Coordenadas encontradas:', geocodingResult);
      
      return geocodingResult;
    }
    
    if (data.status === 'ZERO_RESULTS') {
      console.warn('⚠️ Nenhum resultado encontrado para:', enderecoCompleto);
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('❌ Limite de requisições excedido (Google Maps API)');
    } else {
      console.error('❌ Geocoding falhou:', data.status, data.error_message);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao fazer geocoding:', error);
    return null;
  }
}

/**
 * Atualiza latitude e longitude de um endereço no banco
 * 
 * @param enderecoId - ID do endereço
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @returns true se sucesso, false se erro
 */
export async function atualizarCoordenadas(
  enderecoId: string,
  latitude: number,
  longitude: number
): Promise<boolean> {
  try {
    console.log('💾 Atualizando coordenadas no banco:', { enderecoId, latitude, longitude });
    
    const { error } = await supabase
      .from('enderecos')
      .update({ lat: latitude, long: longitude })
      .eq('id', enderecoId);
    
    if (error) {
      console.error('❌ Erro ao atualizar coordenadas:', error);
      return false;
    }
    
    console.log('✅ Coordenadas atualizadas com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar coordenadas:', error);
    return false;
  }
}

/**
 * Busca e atualiza coordenadas de um endereço (função completa)
 * 
 * @param enderecoId - ID do endereço
 * @param endereco - Endereço completo
 * @param cidade - Nome da cidade
 * @param uf - Sigla do estado
 * @returns true se sucesso, false se erro
 */
export async function geocodeEAtualizarEndereco(
  enderecoId: string,
  endereco: string,
  cidade: string,
  uf: string
): Promise<boolean> {
  const result = await geocodeEndereco(endereco, cidade, uf);
  
  if (!result) {
    return false;
  }
  
  return await atualizarCoordenadas(enderecoId, result.latitude, result.longitude);
}

/**
 * Busca coordenadas de múltiplos endereços em lote
 * ATENÇÃO: Usar com cuidado para não exceder limite da API
 * 
 * @param enderecos - Array de endereços para geocodificar
 * @param delay - Delay entre requisições em ms (padrão: 200ms)
 * @returns Array de resultados
 */
export async function geocodeLote(
  enderecos: Array<{
    id: string;
    endereco: string;
    cidade: string;
    uf: string;
  }>,
  delay: number = 200
): Promise<Array<{ id: string; success: boolean; result?: GeocodingResult }>> {
  const resultados: Array<{ id: string; success: boolean; result?: GeocodingResult }> = [];
  
  for (const end of enderecos) {
    const result = await geocodeEndereco(end.endereco, end.cidade, end.uf);
    
    if (result) {
      await atualizarCoordenadas(end.id, result.latitude, result.longitude);
      resultados.push({ id: end.id, success: true, result });
    } else {
      resultados.push({ id: end.id, success: false });
    }
    
    // Delay para não exceder rate limit
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return resultados;
}
