import { useState, useCallback } from "react";
import { X, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUploadFotoInstalacao, useDeletarFotoInstalacao } from "@/hooks/useInstalacoes";
import { ImagemSegura } from "./ImagemSegura";

interface UploadFotosProps {
  campanhaId: string;
  instalacaoId: string;
  tipo: "instalacao" | "retirada";
  fotos: string[];
  onChange: (fotos: string[]) => void;
  minFotos?: number;
  maxFotos?: number;
  disabled?: boolean;
}

export function UploadFotos({
  campanhaId,
  instalacaoId,
  tipo,
  fotos,
  onChange,
  minFotos = 1,
  maxFotos = 10,
  disabled = false,
}: UploadFotosProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const uploadMutation = useUploadFotoInstalacao();
  const deleteMutation = useDeletarFotoInstalacao();

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (disabled) return;

      // Validar quantidade
      if (fotos.length + files.length > maxFotos) {
        toast({
          title: "Limite de fotos",
          description: `Você pode enviar no máximo ${maxFotos} fotos`,
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      try {
        const novasFotos: string[] = [];

        // Upload de cada arquivo
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          // Validar tipo
          if (!file.type.startsWith("image/")) {
            toast({
              title: "Arquivo inválido",
              description: `${file.name} não é uma imagem`,
              variant: "destructive",
            });
            continue;
          }

          // Validar tamanho (5MB)
          if (file.size > 5 * 1024 * 1024) {
            toast({
              title: "Arquivo muito grande",
              description: `${file.name} excede 5MB`,
              variant: "destructive",
            });
            continue;
          }

          // Upload
          const result = await uploadMutation.mutateAsync({
            file,
            campanhaId,
            instalacaoId,
            tipo,
          });

          novasFotos.push(result.url);
        }

        // Atualizar lista de fotos
        onChange([...fotos, ...novasFotos]);

        toast({
          title: "Fotos enviadas",
          description: `${novasFotos.length} foto(s) enviada(s) com sucesso`,
        });
      } catch (error: any) {
        console.error("Erro ao fazer upload:", error);
        toast({
          title: "Erro ao enviar fotos",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    },
    [fotos, onChange, campanhaId, instalacaoId, tipo, maxFotos, disabled, toast, uploadMutation]
  );

  const handleRemoverFoto = async (index: number) => {
    if (disabled) return;

    const fotoUrl = fotos[index];
    
    try {
      // Extrair path da URL
      const url = new URL(fotoUrl);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/instalacoes-fotos\/(.+)/);
      
      if (pathMatch) {
        const path = pathMatch[1];
        await deleteMutation.mutateAsync(path);
      }

      // Remover da lista
      const novasFotos = fotos.filter((_, i) => i !== index);
      onChange(novasFotos);

      toast({
        title: "Foto removida",
        description: "A foto foi removida com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao remover foto:", error);
      toast({
        title: "Erro ao remover foto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Área de Upload */}
      {!disabled && fotos.length < maxFotos && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
        >
          <input
            type="file"
            id={`upload-${tipo}`}
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={uploading || disabled}
          />
          <label
            htmlFor={`upload-${tipo}`}
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Enviando fotos...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-medium">Clique ou arraste fotos aqui</p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou HEIC até 5MB
                </p>
                <p className="text-xs text-muted-foreground">
                  {fotos.length}/{maxFotos} fotos
                </p>
              </>
            )}
          </label>
        </div>
      )}

      {/* Grid de Fotos */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fotos.map((foto, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-border group"
            >
              <ImagemSegura
                src={foto}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  onClick={() => handleRemoverFoto(index)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={deleteMutation.isPending}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                Foto {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensagem de validação */}
      {fotos.length < minFotos && (
        <p className="text-xs text-muted-foreground">
          ⚠️ Mínimo de {minFotos} foto(s) necessária(s)
        </p>
      )}

      {/* Placeholder quando vazio */}
      {fotos.length === 0 && disabled && (
        <div className="border border-border rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma foto enviada</p>
        </div>
      )}
    </div>
  );
}
