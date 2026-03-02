import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ImageOff } from "lucide-react";

interface ImagemSeguraProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Componente que exibe imagens do Supabase Storage usando Signed URLs
 * Converte automaticamente URLs públicas para signed URLs válidas
 */
export function ImagemSegura({ src, alt, className }: ImagemSeguraProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function getSignedUrl() {
      try {
        setLoading(true);
        setError(false);

        // Extrair path da URL
        let path = src;
        
        // Se for URL completa, extrair apenas o path
        if (src.includes('/storage/v1/object/public/')) {
          const match = src.match(/\/storage\/v1\/object\/public\/instalacoes-fotos\/(.+)/);
          if (match) {
            path = match[1];
          }
        } else if (src.includes('/storage/v1/object/sign/')) {
          // Já é signed URL, usar diretamente
          setSignedUrl(src);
          setLoading(false);
          return;
        }

        // Gerar signed URL (válida por 1 hora)
        const { data, error: signError } = await supabase.storage
          .from('instalacoes-fotos')
          .createSignedUrl(path, 3600); // 1 hora

        if (signError) {
          console.error('Erro ao gerar signed URL:', signError);
          setError(true);
          setLoading(false);
          return;
        }

        setSignedUrl(data.signedUrl);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao processar imagem:', err);
        setError(true);
        setLoading(false);
      }
    }

    if (src) {
      getSignedUrl();
    }
  }, [src]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted ${className}`}>
        <ImageOff className="w-6 h-6 text-muted-foreground mb-1" />
        <p className="text-xs text-muted-foreground">Erro ao carregar</p>
      </div>
    );
  }

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
