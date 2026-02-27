import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { UFS_BRASIL } from "@/hooks/useRegioes";

interface TerritoriosEditorUFProps {
  value: {
    ufs: string[];
  };
  onChange: (territorios: { ufs: string[] }) => void;
  disabled?: boolean;
}

export function TerritoriosEditorUF({ value, onChange, disabled }: TerritoriosEditorUFProps) {
  const [ufs, setUfs] = useState<string[]>(value.ufs || []);
  const [ufSelecionada, setUfSelecionada] = useState<string>("");

  // Sincronizar com value externo
  useEffect(() => {
    setUfs(value.ufs || []);
  }, [value]);

  const handleAdicionarUF = () => {
    if (!ufSelecionada || ufs.includes(ufSelecionada)) return;

    const novasUfs = [...ufs, ufSelecionada];
    setUfs(novasUfs);
    onChange({ ufs: novasUfs });
    setUfSelecionada("");
  };

  const handleRemoverUF = (uf: string) => {
    if (disabled) return;
    const novasUfs = ufs.filter((u) => u !== uf);
    setUfs(novasUfs);
    onChange({ ufs: novasUfs });
  };

  // Filtrar UFs que já foram adicionadas
  const ufsDisponiveis = UFS_BRASIL.filter((uf) => !ufs.includes(uf));

  return (
    <div className="space-y-4">
      {/* UFs Adicionadas */}
      {ufs.length > 0 && (
        <div className="space-y-2">
          <Label>Estados Cobertos</Label>
          <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30 min-h-[60px]">
            {ufs.map((uf) => (
              <Badge
                key={uf}
                variant="default"
                className="bg-blue-500 hover:bg-blue-600"
              >
                {uf}
                {!disabled && (
                  <button
                    onClick={() => handleRemoverUF(uf)}
                    className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Formulário de Adição */}
      {!disabled && ufsDisponiveis.length > 0 && (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/10">
          <Label>Adicionar Estado</Label>

          <div className="flex gap-2">
            <Select value={ufSelecionada} onValueChange={setUfSelecionada}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione a UF" />
              </SelectTrigger>
              <SelectContent>
                {ufsDisponiveis.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              onClick={handleAdicionarUF}
              disabled={!ufSelecionada}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mensagem quando vazio */}
      {ufs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {disabled 
            ? "Nenhum estado configurado" 
            : "Adicione os estados que este coordenador irá cobrir"}
        </div>
      )}

      {/* Mensagem quando todos foram adicionados */}
      {!disabled && ufsDisponiveis.length === 0 && ufs.length > 0 && (
        <div className="text-center py-4 text-sm text-green-600">
          ✓ Todos os estados disponíveis foram adicionados
        </div>
      )}
    </div>
  );
}
