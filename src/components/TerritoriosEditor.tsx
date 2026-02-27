import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Check } from "lucide-react";
import { UFS_BRASIL, useCidadesPorUF, useComunidadesPorCidade } from "@/hooks/useRegioes";

interface Territorio {
  id: string;
  uf: string;
  cidade: string;
  comunidade: string | null; // null = cidade inteira
  tipo: "cidade_inteira" | "comunidade_especifica";
}

interface TerritoriosEditorProps {
  value: {
    cidades: string[];
    comunidades: string[];
  };
  onChange: (territorios: { cidades: string[]; comunidades: string[] }) => void;
  disabled?: boolean;
}

export function TerritoriosEditor({ value, onChange, disabled }: TerritoriosEditorProps) {
  const [territorios, setTerritorios] = useState<Territorio[]>([]);
  const [inicializado, setInicializado] = useState(false);
  
  // Estado do formulário de adição
  const [ufSelecionada, setUfSelecionada] = useState<string>("");
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>("");
  const [comunidadeSelecionada, setComunidadeSelecionada] = useState<string>("");
  const [novaCidadeNome, setNovaCidadeNome] = useState("");
  const [novaComunidadeNome, setNovaComunidadeNome] = useState("");
  const [mostrarNovaCidade, setMostrarNovaCidade] = useState(false);
  const [mostrarNovaComunidade, setMostrarNovaComunidade] = useState(false);

  const { data: cidades, isLoading: loadingCidades } = useCidadesPorUF(ufSelecionada || null);
  const { data: comunidades, isLoading: loadingComunidades } = useComunidadesPorCidade(
    ufSelecionada || null,
    cidadeSelecionada && cidadeSelecionada !== "NOVA_CIDADE" ? cidadeSelecionada : null
  );

  // Converter value inicial para territorios
  useEffect(() => {
    const territoriosIniciais: Territorio[] = [];
    
    // Adicionar cidades inteiras
    value.cidades?.forEach((cidade) => {
      territoriosIniciais.push({
        id: `cidade-${cidade}`,
        uf: "", // UF não está disponível no formato antigo
        cidade,
        comunidade: null,
        tipo: "cidade_inteira",
      });
    });
    
    // Adicionar comunidades específicas
    value.comunidades?.forEach((comunidade) => {
      territoriosIniciais.push({
        id: `comunidade-${comunidade}`,
        uf: "", // UF não está disponível no formato antigo
        cidade: "", // Cidade não está disponível no formato antigo
        comunidade,
        tipo: "comunidade_especifica",
      });
    });
    
    setTerritorios(territoriosIniciais);
    setInicializado(true);
  }, []);

  const handleAdicionarTerritorio = () => {
    if (!ufSelecionada) return;

    let cidadeFinal = cidadeSelecionada;
    let comunidadeFinal = comunidadeSelecionada;

    // Se "Cadastrar nova cidade" foi selecionado
    if (cidadeSelecionada === "NOVA_CIDADE") {
      if (!novaCidadeNome.trim()) return;
      cidadeFinal = novaCidadeNome.trim();
    }

    // Se "Cadastrar nova comunidade" foi selecionado
    if (comunidadeSelecionada === "NOVA_COMUNIDADE") {
      if (!novaComunidadeNome.trim()) return;
      comunidadeFinal = novaComunidadeNome.trim();
    }

    if (!cidadeFinal) return;

    const novoTerritorio: Territorio = {
      id: `${Date.now()}-${Math.random()}`,
      uf: ufSelecionada,
      cidade: cidadeFinal,
      comunidade: comunidadeFinal === "CIDADE_INTEIRA" ? null : comunidadeFinal || null,
      tipo: comunidadeFinal === "CIDADE_INTEIRA" || !comunidadeFinal 
        ? "cidade_inteira" 
        : "comunidade_especifica",
    };

    // Verificar se já existe
    const jaExiste = territorios.some(
      (t) =>
        t.uf === novoTerritorio.uf &&
        t.cidade === novoTerritorio.cidade &&
        t.comunidade === novoTerritorio.comunidade
    );

    if (!jaExiste) {
      const novosTerritorios = [...territorios, novoTerritorio];
      setTerritorios(novosTerritorios);
      
      // Notificar mudança APENAS aqui, quando usuário clica em adicionar
      const cidades = novosTerritorios
        .filter((t) => t.tipo === "cidade_inteira")
        .map((t) => t.cidade);
      
      const comunidades = novosTerritorios
        .filter((t) => t.tipo === "comunidade_especifica")
        .map((t) => t.comunidade || "");
      
      console.log("➕ [ADICIONAR TERRITORIO] Notificando mudança:");
      console.log("  novos territorios:", novosTerritorios);
      console.log("  cidades:", cidades);
      console.log("  comunidades:", comunidades);
      
      onChange({ cidades, comunidades });
    }

    // Resetar apenas comunidade (manter UF e Cidade para facilitar)
    setComunidadeSelecionada("");
    setNovaComunidadeNome("");
    setMostrarNovaComunidade(false);
  };

  const handleRemoverTerritorio = (id: string) => {
    if (disabled) return;
    const novosTerritorios = territorios.filter((t) => t.id !== id);
    setTerritorios(novosTerritorios);
    
    // Notificar mudança ao remover
    const cidades = novosTerritorios
      .filter((t) => t.tipo === "cidade_inteira")
      .map((t) => t.cidade);
    
    const comunidades = novosTerritorios
      .filter((t) => t.tipo === "comunidade_especifica")
      .map((t) => t.comunidade || "");
    
    console.log("➖ [REMOVER TERRITORIO] Notificando mudança:");
    console.log("  territorios restantes:", novosTerritorios);
    console.log("  cidades:", cidades);
    console.log("  comunidades:", comunidades);
    
    onChange({ cidades, comunidades });
  };

  const handleUfChange = (uf: string) => {
    setUfSelecionada(uf);
    setCidadeSelecionada("");
    setComunidadeSelecionada("");
    setMostrarNovaCidade(false);
    setMostrarNovaComunidade(false);
  };

  const handleCidadeChange = (cidade: string) => {
    setCidadeSelecionada(cidade);
    setComunidadeSelecionada("");
    setMostrarNovaComunidade(false);
    
    if (cidade === "NOVA_CIDADE") {
      setMostrarNovaCidade(true);
    } else {
      setMostrarNovaCidade(false);
    }
  };

  const handleComunidadeChange = (comunidade: string) => {
    setComunidadeSelecionada(comunidade);
    
    if (comunidade === "NOVA_COMUNIDADE") {
      setMostrarNovaComunidade(true);
    } else {
      setMostrarNovaComunidade(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Territórios Adicionados */}
      {territorios.length > 0 && (
        <div className="space-y-2">
          <Label>Territórios Cobertos</Label>
          <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30 min-h-[60px]">
            {territorios.map((territorio) => (
              <Badge
                key={territorio.id}
                variant="default"
                className={
                  territorio.tipo === "cidade_inteira"
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-green-500 hover:bg-green-600"
                }
              >
                {territorio.tipo === "cidade_inteira" ? "🔵" : "🟢"}
                {territorio.tipo === "cidade_inteira"
                  ? `${territorio.cidade}/${territorio.uf} (cidade inteira)`
                  : `${territorio.comunidade}, ${territorio.cidade}/${territorio.uf}`}
                {!disabled && (
                  <button
                    onClick={() => handleRemoverTerritorio(territorio.id)}
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
      {!disabled && (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/10">
          <Label>Adicionar Território</Label>

          {/* Select UF */}
          <div>
            <label className="text-sm font-medium">UF</label>
            <Select value={ufSelecionada} onValueChange={handleUfChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a UF" />
              </SelectTrigger>
              <SelectContent>
                {UFS_BRASIL.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select Cidade */}
          {ufSelecionada && (
            <div>
              <label className="text-sm font-medium">Cidade</label>
              <Select
                value={cidadeSelecionada}
                onValueChange={handleCidadeChange}
                disabled={loadingCidades}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  {cidades?.map((cidade) => (
                    <SelectItem key={cidade} value={cidade}>
                      {cidade}
                    </SelectItem>
                  ))}
                  <SelectItem value="NOVA_CIDADE">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Cadastrar nova cidade
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Input Nova Cidade */}
          {mostrarNovaCidade && (
            <div>
              <label className="text-sm font-medium">Nome da nova cidade</label>
              <Input
                placeholder="Digite o nome da cidade"
                value={novaCidadeNome}
                onChange={(e) => setNovaCidadeNome(e.target.value)}
              />
            </div>
          )}

          {/* Select Comunidade */}
          {cidadeSelecionada && cidadeSelecionada !== "NOVA_CIDADE" && (
            <div>
              <label className="text-sm font-medium">Comunidade</label>
              <Select
                value={comunidadeSelecionada}
                onValueChange={handleComunidadeChange}
                disabled={loadingComunidades}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a comunidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIDADE_INTEIRA">
                    <strong>🔵 Cidade inteira (todas as comunidades)</strong>
                  </SelectItem>
                  {comunidades && comunidades.length > 0 && (
                    <>
                      {comunidades.map((comunidade) => (
                        <SelectItem key={comunidade} value={comunidade}>
                          🟢 {comunidade}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  <SelectItem value="NOVA_COMUNIDADE">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Cadastrar nova comunidade
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Input Nova Comunidade */}
          {mostrarNovaComunidade && (
            <div>
              <label className="text-sm font-medium">Nome da nova comunidade</label>
              <Input
                placeholder="Digite o nome da comunidade"
                value={novaComunidadeNome}
                onChange={(e) => setNovaComunidadeNome(e.target.value)}
              />
            </div>
          )}

          {/* Botão Adicionar */}
          {(cidadeSelecionada || mostrarNovaCidade) && (
            <Button
              type="button"
              onClick={handleAdicionarTerritorio}
              disabled={
                !ufSelecionada ||
                (!cidadeSelecionada && !novaCidadeNome) ||
                (mostrarNovaCidade && !novaCidadeNome.trim()) ||
                (mostrarNovaComunidade && !novaComunidadeNome.trim())
              }
              className="w-full"
            >
              <Check className="w-4 h-4 mr-2" />
              Adicionar Território
            </Button>
          )}
        </div>
      )}

      {/* Mensagem quando vazio */}
      {territorios.length === 0 && disabled && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum território configurado
        </div>
      )}
    </div>
  );
}
