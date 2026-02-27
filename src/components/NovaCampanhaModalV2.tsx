import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCoordenadores } from "@/hooks/useCampaignsData";
import { useCriarNotificacao } from "@/hooks/useNotificacoes";
import { Loader2, ChevronRight, ChevronLeft, Sparkles, Check, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { askGemini } from "@/services/gemini";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UFS_BRASIL,
  useCidadesPorUF,
  useComunidadesPorCidade,
  useAdicionarCidade,
} from "@/hooks/useRegioes";

const formSchema = z.object({
  nome: z.string().min(3, "Digite o nome da campanha"),
  cliente: z.string().min(2, "Digite o nome do cliente"),
  data_inicio: z.string().min(1, "Selecione a data de início"),
  data_fim: z.string().min(1, "Selecione a data de fim"),
});

type FormData = z.infer<typeof formSchema>;

interface Grupo {
  id: string;
  uf: string;
  cidade: string;
  comunidade: string | null; // null = cidade inteira
  quantidade: number;
  coordenador_id: string | null;
  coordenador_nome: string | null;
  endereco_ids: string[];
  sugestaoIA?: {
    coordenador_id: string;
    coordenador_nome: string;
    endereco_ids: string[];
    justificativa: string;
  };
}

interface NovaCampanhaModalV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaCampanhaModalV2({ open, onOpenChange }: NovaCampanhaModalV2Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: coordenadores } = useCoordenadores();
  const criarNotificacao = useCriarNotificacao();

  const [etapa, setEtapa] = useState(1);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [novoGrupo, setNovoGrupo] = useState({
    uf: "",
    cidade: "",
    comunidade: null as string | null,
    quantidade: 0,
  });
  const [novaCidadeNome, setNovaCidadeNome] = useState("");
  const [mostrarNovaCidade, setMostrarNovaCidade] = useState(false);
  const [loadingIA, setLoadingIA] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const { data: cidades, isLoading: loadingCidades } = useCidadesPorUF(novoGrupo.uf || null);
  const { data: comunidades, isLoading: loadingComunidades } = useComunidadesPorCidade(
    novoGrupo.uf || null,
    novoGrupo.cidade || null
  );
  const adicionarCidade = useAdicionarCidade();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cliente: "",
      data_inicio: "",
      data_fim: "",
    },
  });

  const handleProximaEtapa = () => {
    if (etapa === 1) {
      form.trigger().then((isValid) => {
        if (isValid) setEtapa(2);
      });
    } else if (etapa === 2) {
      if (grupos.length === 0) {
        toast({
          title: "Adicione pelo menos um grupo",
          description: "É necessário ter pelo menos um grupo de instalação.",
          variant: "destructive",
        });
        return;
      }
      setEtapa(3);
    }
  };

  const handleAdicionarGrupo = async () => {
    if (!novoGrupo.uf || !novoGrupo.cidade || novoGrupo.quantidade <= 0) {
      toast({
        title: "Preencha os dados do grupo",
        description: "Selecione UF, cidade e quantidade de pontos.",
        variant: "destructive",
      });
      return;
    }

    // Se "Adicionar nova cidade" foi selecionado
    if (novoGrupo.cidade === "NOVA_CIDADE") {
      if (!novaCidadeNome.trim()) {
        toast({
          title: "Digite o nome da cidade",
          description: "É necessário informar o nome da nova cidade.",
          variant: "destructive",
        });
        return;
      }

      try {
        await adicionarCidade.mutateAsync({
          uf: novoGrupo.uf,
          cidade: novaCidadeNome.trim(),
        });

        toast({
          title: "Cidade adicionada",
          description: `${novaCidadeNome} foi adicionada à cobertura.`,
        });

        // Atualizar o grupo com a nova cidade
        const grupo: Grupo = {
          id: Math.random().toString(36).substr(2, 9),
          uf: novoGrupo.uf,
          cidade: novaCidadeNome.trim(),
          comunidade: null, // Cidade nova não tem comunidades ainda
          quantidade: novoGrupo.quantidade,
          coordenador_id: null,
          coordenador_nome: null,
          endereco_ids: [],
        };

        setGrupos([...grupos, grupo]);
        setNovoGrupo({ uf: "", cidade: "", comunidade: null, quantidade: 0 });
        setNovaCidadeNome("");
        setMostrarNovaCidade(false);
        return;
      } catch (error: any) {
        toast({
          title: "Erro ao adicionar cidade",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    }

    const grupo: Grupo = {
      id: Math.random().toString(36).substr(2, 9),
      uf: novoGrupo.uf,
      cidade: novoGrupo.cidade,
      comunidade: novoGrupo.comunidade === "CIDADE_INTEIRA" ? null : novoGrupo.comunidade,
      quantidade: novoGrupo.quantidade,
      coordenador_id: null,
      coordenador_nome: null,
      endereco_ids: [],
    };

    setGrupos([...grupos, grupo]);
    setNovoGrupo({ uf: "", cidade: "", comunidade: null, quantidade: 0 });
  };

  const handleSugerirComIA = async (grupoId: string) => {
    const grupo = grupos.find((g) => g.id === grupoId);
    if (!grupo) return;

    setLoadingIA(true);

    try {
      // Buscar endereços disponíveis na região
      let query = supabase
        .from("enderecos")
        .select("id, endereco, comunidade, cidade, uf")
        .eq("status", "disponivel")
        .eq("uf", grupo.uf)
        .eq("cidade", grupo.cidade);

      // Se comunidade específica foi selecionada
      if (grupo.comunidade) {
        query = query.eq("comunidade", grupo.comunidade);
      }

      const { data: enderecos, error: enderecosError } = await query.limit(
        grupo.quantidade * 2
      );

      if (enderecosError) throw enderecosError;

      // Buscar coordenadores com territórios
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, territorios");

      if (profilesError) throw profilesError;

      // Buscar roles de coordenadores
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "coordenador");

      if (rolesError) throw rolesError;

      // Filtrar apenas profiles que são coordenadores
      const coordenadoresData = profilesData?.filter((profile: any) =>
        rolesData?.some((role: any) => role.user_id === profile.id)
      );

      // Verificar se há endereços disponíveis
      const temEnderecos = enderecos && enderecos.length > 0;
      const regiaoDescricao = grupo.comunidade
        ? `${grupo.comunidade}, ${grupo.cidade}/${grupo.uf}`
        : `${grupo.cidade}/${grupo.uf} (cidade inteira)`;

      // Preparar dados estruturados para o prompt (limitados para não exceder tokens)
      const enderecosDisponiveis = enderecos?.slice(0, 20).map((e) => e.id) || [];

      const coordenadoresFormatados = coordenadoresData?.map((c: any) => {
        // Normalizar territorios (suportar formato antigo e novo)
        let ufs = [];
        if (c.territorios?.ufs) {
          ufs = c.territorios.ufs;
        } else if (c.territorios?.cidades || c.territorios?.comunidades) {
          console.warn(`⚠️ [FORMATO ANTIGO] Coordenador ${c.nome} usa formato antigo`);
          ufs = []; // Vazio até migrar
        }
        
        return {
          id: c.id,
          nome: c.nome,
          ufs: ufs,
        };
      }) || [];

      // Filtrar coordenadores que cobrem a UF
      const coordenadoresFiltrados = coordenadoresFormatados.filter((c: any) => {
        return c.ufs.includes(grupo.uf);
      });

      if (coordenadoresFiltrados.length === 0) {
        toast({
          title: "Nenhum coordenador disponível",
          description: "Não há coordenadores cadastrados que cobrem esta região.",
          variant: "destructive",
        });
        return;
      }

      // Montar prompt ultra-conciso para evitar corte
      const prompt = temEnderecos
        ? `JSON puro. Região: ${regiaoDescricao}. Pontos: ${grupo.quantidade}.
Coordenadores (use ID exato):
${coordenadoresFiltrados.slice(0, 3).map((c: any) => `${c.id}|${c.nome}`).join('\n')}
Endereços: ${enderecosDisponiveis.slice(0, grupo.quantidade).join(',')}
Escolha 1 coordenador e até ${grupo.quantidade} IDs.
{"coordenador_id":"ID_EXATO","coordenador_nome":"NOME","endereco_ids":["id1"],"justificativa":"curta"}`
        : `JSON puro. Região: ${regiaoDescricao}. Pontos: ${grupo.quantidade}.
Coordenadores (use ID exato):
${coordenadoresFiltrados.slice(0, 3).map((c: any) => `${c.id}|${c.nome}`).join('\n')}
Sem endereços.
{"coordenador_id":"ID_EXATO","coordenador_nome":"NOME","endereco_ids":[],"justificativa":"Mapear em campo"}`;

      const resposta = await askGemini(prompt);

      console.log("🤖 [IA] Resposta bruta:", resposta);
      console.log("🤖 [IA] Tipo da resposta:", typeof resposta);
      console.log("🤖 [IA] Tamanho da resposta:", resposta?.length);

      // Extrair JSON da resposta (pode vir com texto ao redor ou markdown)
      let jsonMatch = resposta.match(/\{[\s\S]*\}/);
      
      // Se não encontrou, tentar remover markdown
      if (!jsonMatch) {
        console.log("⚠️ [IA] Tentando remover markdown...");
        const semMarkdown = resposta.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        console.log("🤖 [IA] Resposta sem markdown:", semMarkdown);
        jsonMatch = semMarkdown.match(/\{[\s\S]*\}/);
      }
      
      if (!jsonMatch) {
        console.error("❌ [IA] Não encontrou JSON na resposta");
        console.error("❌ [IA] Resposta completa:", resposta);
        toast({
          title: "Erro ao processar sugestão",
          description: "A IA não retornou JSON. Verifique o console (F12) para mais detalhes.",
          variant: "destructive",
        });
        return;
      }

      console.log("📝 [IA] JSON extraído:", jsonMatch[0]);

      let sugestao;
      try {
        sugestao = JSON.parse(jsonMatch[0]);
        console.log("✅ [IA] JSON parseado:", sugestao);
      } catch (parseError) {
        console.error("❌ [IA] Erro ao parsear JSON:", parseError);
        console.error("❌ [IA] String que tentou parsear:", jsonMatch[0]);
        toast({
          title: "Erro ao processar sugestão",
          description: "JSON inválido. Verifique o console (F12) para mais detalhes.",
          variant: "destructive",
        });
        return;
      }

      // Validar estrutura do JSON
      if (!sugestao.coordenador_id || !sugestao.coordenador_nome) {
        toast({
          title: "Resposta incompleta",
          description: "A IA não forneceu todas as informações necessárias. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Validar se coordenador_id existe na lista de coordenadores reais
      const coordenadorValido = coordenadoresFormatados.find(
        (c: any) => c.id === sugestao.coordenador_id
      );

      if (!coordenadorValido) {
        console.error("❌ [IA] Coordenador inválido:", sugestao.coordenador_id);
        console.error("❌ [IA] Coordenadores válidos:", coordenadoresFormatados.map((c: any) => c.id));
        
        // Fallback: usar primeiro coordenador da lista filtrada
        const coordenadoresFiltrados = coordenadoresFormatados.filter((c: any) => {
          return c.ufs.includes(grupo.uf);
        });

        if (coordenadoresFiltrados.length > 0) {
          sugestao.coordenador_id = coordenadoresFiltrados[0].id;
          sugestao.coordenador_nome = coordenadoresFiltrados[0].nome;
          console.warn("⚠️ [IA] Usando fallback:", sugestao.coordenador_id);
        } else {
          toast({
            title: "Erro na sugestão",
            description: "A IA retornou um coordenador inválido e não há fallback disponível.",
            variant: "destructive",
          });
          return;
        }
      }

      // Atualizar grupo com sugestão
      setGrupos(
        grupos.map((g) =>
          g.id === grupoId
            ? {
                ...g,
                sugestaoIA: sugestao,
              }
            : g
        )
      );

      toast({
        title: "Sugestão gerada",
        description: temEnderecos
          ? "A IA analisou os dados e gerou uma sugestão."
          : "A IA sugeriu um coordenador para mapear a região.",
      });
    } catch (error: any) {
      console.error("Erro ao gerar sugestão:", error);
      toast({
        title: "Erro ao gerar sugestão",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingIA(false);
    }
  };

  const handleAceitarSugestao = (grupoId: string) => {
    setGrupos(
      grupos.map((g) => {
        if (g.id === grupoId && g.sugestaoIA) {
          return {
            ...g,
            coordenador_id: g.sugestaoIA.coordenador_id,
            coordenador_nome: g.sugestaoIA.coordenador_nome,
            endereco_ids: g.sugestaoIA.endereco_ids,
            sugestaoIA: undefined,
          };
        }
        return g;
      })
    );

    toast({
      title: "Sugestão aceita",
      description: "O grupo foi atualizado com a sugestão da IA.",
    });
  };

  const handleRejeitarSugestao = (grupoId: string) => {
    setGrupos(
      grupos.map((g) =>
        g.id === grupoId
          ? {
              ...g,
              sugestaoIA: undefined,
            }
          : g
      )
    );
  };

  const handleSelecionarCoordenador = async (grupoId: string, coordenadorId: string) => {
    if (!coordenadorId) return;
    
    const grupo = grupos.find((g) => g.id === grupoId);
    if (!grupo) return;
    
    const coordenador = coordenadores?.find((c) => c.id === coordenadorId);
    
    try {
      // Buscar endereços disponíveis na região
      let query = supabase
        .from("enderecos")
        .select("id, endereco, comunidade, cidade, uf")
        .eq("status", "disponivel")
        .eq("uf", grupo.uf)
        .eq("cidade", grupo.cidade);

      // Se comunidade específica foi selecionada
      if (grupo.comunidade) {
        query = query.eq("comunidade", grupo.comunidade);
      }

      const { data: enderecos, error: enderecosError } = await query.limit(
        grupo.quantidade * 2
      );

      if (enderecosError) throw enderecosError;

      const temEnderecos = enderecos && enderecos.length > 0;
      const enderecosIds = temEnderecos 
        ? enderecos.slice(0, grupo.quantidade).map((e) => e.id)
        : [];

      // Atualizar grupo com coordenador e endereços
      setGrupos(
        grupos.map((g) =>
          g.id === grupoId
            ? {
                ...g,
                coordenador_id: coordenadorId,
                coordenador_nome: coordenador?.nome || null,
                endereco_ids: enderecosIds,
              }
            : g
        )
      );

      // Mostrar mensagem apropriada
      if (temEnderecos) {
        toast({
          title: "Coordenador selecionado",
          description: `${enderecosIds.length} endereços disponíveis foram vinculados.`,
        });
      } else {
        toast({
          title: "Coordenador selecionado",
          description: "Não há endereços cadastrados nesta região. O coordenador deverá mapear em campo.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar endereços:", error);
      toast({
        title: "Erro ao buscar endereços",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoverGrupo = (grupoId: string) => {
    setGrupos(grupos.filter((g) => g.id !== grupoId));
  };

  const handleSalvar = async () => {
    const dadosForm = form.getValues();

    setSalvando(true);

    try {
      // Montar string de cidades para a campanha
      const cidadesStr = grupos
        .map((g) => {
          if (g.comunidade) {
            return `${g.comunidade}, ${g.cidade}/${g.uf}`;
          }
          return `${g.cidade}/${g.uf} (cidade inteira)`;
        })
        .join("; ");

      // 1. Criar campanha
      const { data: campanha, error: campanhaError } = await supabase
        .from("campanhas")
        .insert({
          nome: dadosForm.nome,
          cliente: dadosForm.cliente,
          data_inicio: dadosForm.data_inicio,
          data_fim: dadosForm.data_fim,
          cidade: cidadesStr,
          gestor_id: user?.id,
        })
        .select()
        .single();

      if (campanhaError) throw campanhaError;

      // 2. Para cada grupo, criar instalações e vincular coordenador
      for (const grupo of grupos) {
        if (!grupo.coordenador_id) continue;

        // Criar instalações
        if (grupo.endereco_ids.length > 0) {
          const { error: instalacoesError } = await supabase
            .from("instalacoes")
            .insert(
              grupo.endereco_ids.map((endereco_id) => ({
                campanha_id: campanha.id,
                endereco_id,
                representante_id: grupo.coordenador_id,
                status: "pendente" as const,
              }))
            );

          if (instalacoesError) throw instalacoesError;
        }

        // Vincular coordenador
        const { error: coordenadorError } = await supabase
          .from("campanha_coordenadores")
          .insert({
            campanha_id: campanha.id,
            coordenador_id: grupo.coordenador_id,
            endereco_ids: grupo.endereco_ids,
          });

        if (coordenadorError) throw coordenadorError;

        // Criar notificação
        const regiaoDescricao = grupo.comunidade
          ? `${grupo.comunidade}, ${grupo.cidade}/${grupo.uf}`
          : `${grupo.cidade}/${grupo.uf} (cidade inteira)`;

        const faltamPontos = grupo.quantidade - grupo.endereco_ids.length;
        
        let mensagemNotificacao = "";
        if (grupo.endereco_ids.length === 0) {
          mensagemNotificacao = `Você foi vinculado à campanha "${dadosForm.nome}" do cliente ${dadosForm.cliente}. Região: ${regiaoDescricao}. Você deverá mapear e cadastrar ${grupo.quantidade} pontos durante o trabalho de campo. Período: ${new Date(dadosForm.data_inicio).toLocaleDateString("pt-BR")} a ${new Date(dadosForm.data_fim).toLocaleDateString("pt-BR")}.`;
        } else if (faltamPontos > 0) {
          mensagemNotificacao = `Você foi vinculado à campanha "${dadosForm.nome}" do cliente ${dadosForm.cliente}. Região: ${regiaoDescricao}. ${grupo.endereco_ids.length} pontos já atribuídos. ATENÇÃO: Faltam ${faltamPontos} pontos que deverão ser mapeados em campo. Período: ${new Date(dadosForm.data_inicio).toLocaleDateString("pt-BR")} a ${new Date(dadosForm.data_fim).toLocaleDateString("pt-BR")}.`;
        } else {
          mensagemNotificacao = `Você foi vinculado à campanha "${dadosForm.nome}" do cliente ${dadosForm.cliente}. Região: ${regiaoDescricao}. ${grupo.endereco_ids.length} pontos atribuídos. Período: ${new Date(dadosForm.data_inicio).toLocaleDateString("pt-BR")} a ${new Date(dadosForm.data_fim).toLocaleDateString("pt-BR")}.`;
        }

        // Criar notificação (não bloquear se falhar)
        try {
          await criarNotificacao.mutateAsync({
            user_id: grupo.coordenador_id,
            titulo: "Nova campanha atribuída",
            mensagem: mensagemNotificacao,
          });
        } catch (notifError) {
          console.warn("Erro ao criar notificação (não crítico):", notifError);
        }
      }

      toast({
        title: "Campanha criada",
        description: "A campanha foi criada e os coordenadores foram notificados.",
      });

      // Resetar e fechar
      form.reset();
      setGrupos([]);
      setEtapa(1);
      onOpenChange(false);

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campanhas-ativas"] });
    } catch (error: any) {
      console.error("Erro ao salvar campanha:", error);
      toast({
        title: "Erro ao criar campanha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Campanha - Etapa {etapa} de 3</DialogTitle>
          <DialogDescription>
            {etapa === 1 && "Preencha os dados básicos da campanha"}
            {etapa === 2 && "Configure os grupos de instalação com IA"}
            {etapa === 3 && "Revise e confirme os dados"}
          </DialogDescription>
        </DialogHeader>

        {/* ETAPA 1: Dados Básicos */}
        {etapa === 1 && (
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Campanha</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Verão Coca-Cola 2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Coca-Cola" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Form>
        )}

        {/* ETAPA 2: Grupos de Instalação */}
        {etapa === 2 && (
          <div className="space-y-4">
            <Card className="p-4 space-y-3">
              <h3 className="font-medium">Adicionar Grupo</h3>
              <div className="space-y-3">
                {/* Select UF */}
                <div>
                  <label className="text-sm font-medium">UF</label>
                  <Select
                    value={novoGrupo.uf}
                    onValueChange={(value) => {
                      setNovoGrupo({
                        ...novoGrupo,
                        uf: value,
                        cidade: "",
                        comunidade: null,
                      });
                      setMostrarNovaCidade(false);
                    }}
                  >
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
                {novoGrupo.uf && (
                  <div>
                    <label className="text-sm font-medium">Cidade</label>
                    <Select
                      value={novoGrupo.cidade}
                      onValueChange={(value) => {
                        if (value === "NOVA_CIDADE") {
                          setMostrarNovaCidade(true);
                          setNovoGrupo({
                            ...novoGrupo,
                            cidade: value,
                            comunidade: null,
                          });
                        } else {
                          setMostrarNovaCidade(false);
                          setNovoGrupo({
                            ...novoGrupo,
                            cidade: value,
                            comunidade: null,
                          });
                        }
                      }}
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
                            Adicionar nova cidade
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
                {novoGrupo.cidade && novoGrupo.cidade !== "NOVA_CIDADE" && (
                  <div>
                    <label className="text-sm font-medium">Comunidade</label>
                    <Select
                      value={novoGrupo.comunidade || ""}
                      onValueChange={(value) =>
                        setNovoGrupo({
                          ...novoGrupo,
                          comunidade: value === "CIDADE_INTEIRA" ? null : value,
                        })
                      }
                      disabled={loadingComunidades}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a comunidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CIDADE_INTEIRA">
                          <strong>Cidade inteira (todas as comunidades)</strong>
                        </SelectItem>
                        {comunidades && comunidades.length > 0 && (
                          <>
                            {comunidades.map((comunidade) => (
                              <SelectItem key={comunidade} value={comunidade}>
                                {comunidade}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Quantidade */}
                <div>
                  <label className="text-sm font-medium">Quantidade de pontos</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ex: 10"
                    value={novoGrupo.quantidade || ""}
                    onChange={(e) =>
                      setNovoGrupo({
                        ...novoGrupo,
                        quantidade: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleAdicionarGrupo} className="w-full">
                Adicionar Grupo
              </Button>
            </Card>

            <div className="space-y-3">
              {grupos.map((grupo) => (
                <Card key={grupo.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">
                        {grupo.comunidade
                          ? `${grupo.comunidade}, ${grupo.cidade}/${grupo.uf}`
                          : `${grupo.cidade}/${grupo.uf} (cidade inteira)`}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {grupo.quantidade} pontos
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoverGrupo(grupo.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {!grupo.sugestaoIA && !grupo.coordenador_id && (
                    <Button
                      onClick={() => handleSugerirComIA(grupo.id)}
                      disabled={true}
                      variant="outline"
                      className="w-full opacity-50 cursor-not-allowed"
                      title="IA temporariamente desabilitada - use seleção manual"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Sugerir com IA (em manutenção)
                    </Button>
                  )}

                  {grupo.sugestaoIA && (
                    <div className="bg-accent/50 p-3 rounded-lg space-y-2">
                      <p className="text-sm font-medium">Sugestão da IA:</p>
                      <p className="text-sm">
                        <strong>Coordenador:</strong> {grupo.sugestaoIA.coordenador_nome}
                      </p>
                      {grupo.sugestaoIA.endereco_ids.length > 0 ? (
                        <p className="text-sm">
                          <strong>Endereços:</strong> {grupo.sugestaoIA.endereco_ids.length}{" "}
                          selecionados
                        </p>
                      ) : (
                        <p className="text-sm">
                          <strong>Endereços:</strong> Nenhum cadastrado (mapear em campo)
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {grupo.sugestaoIA.justificativa}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAceitarSugestao(grupo.id)}
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aceitar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejeitarSugestao(grupo.id)}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  )}

                  {grupo.coordenador_id && (
                    <div className="space-y-2">
                      <Badge variant="secondary">
                        Coordenador: {grupo.coordenador_nome}
                      </Badge>
                      {grupo.endereco_ids.length > 0 ? (
                        <>
                          <Badge variant="outline">
                            {grupo.endereco_ids.length} endereços vinculados
                          </Badge>
                          {grupo.endereco_ids.length < grupo.quantidade && (
                            <Badge variant="destructive">
                              Faltam {grupo.quantidade - grupo.endereco_ids.length} pontos - mapear em campo
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline">Mapear {grupo.quantidade} pontos em campo</Badge>
                      )}
                    </div>
                  )}

                  {!grupo.coordenador_id && !grupo.sugestaoIA && (
                    <div>
                      <label className="text-sm font-medium">
                        Ou selecione manualmente:
                      </label>
                      <select
                        className="w-full mt-1 p-2 border rounded-md"
                        onChange={(e) =>
                          handleSelecionarCoordenador(grupo.id, e.target.value)
                        }
                      >
                        <option value="">Selecione um coordenador</option>
                        {coordenadores
                          ?.filter((c) => {
                            // Filtrar coordenadores que cobrem a região do grupo
                            const territorios = c.territorios;
                            
                            // Suportar formato novo (ufs)
                            if (territorios?.ufs) {
                              return territorios.ufs.includes(grupo.uf);
                            }
                            
                            // Formato antigo (cidades/comunidades) - não mostrar
                            console.warn(`⚠️ Coordenador ${c.nome} usa formato antigo`);
                            return false;
                          })
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nome}
                            </option>
                          ))}
                      </select>
                      {coordenadores?.filter((c) => {
                        const territorios = c.territorios;
                        return territorios?.ufs?.includes(grupo.uf);
                      }).length === 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          ⚠️ Nenhum coordenador cadastrado cobre esta região (UF: {grupo.uf})
                          <br />
                          <span className="text-xs">
                            Execute o script migrar-territorios-para-uf.sql
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ETAPA 3: Revisão */}
        {etapa === 3 && (
          <div className="space-y-4">
            <Card className="p-4 space-y-2">
              <h3 className="font-medium">Dados da Campanha</h3>
              <p className="text-sm">
                <strong>Nome:</strong> {form.getValues("nome")}
              </p>
              <p className="text-sm">
                <strong>Cliente:</strong> {form.getValues("cliente")}
              </p>
              <p className="text-sm">
                <strong>Período:</strong>{" "}
                {new Date(form.getValues("data_inicio")).toLocaleDateString("pt-BR")} a{" "}
                {new Date(form.getValues("data_fim")).toLocaleDateString("pt-BR")}
              </p>
            </Card>

            <Card className="p-4 space-y-3">
              <h3 className="font-medium">Grupos de Instalação</h3>
              {grupos.map((grupo) => (
                <div key={grupo.id} className="border-l-2 border-primary pl-3">
                  <p className="text-sm font-medium">
                    {grupo.comunidade
                      ? `${grupo.comunidade}, ${grupo.cidade}/${grupo.uf}`
                      : `${grupo.cidade}/${grupo.uf} (cidade inteira)`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {grupo.quantidade} pontos • Coordenador: {grupo.coordenador_nome}
                  </p>
                  {grupo.endereco_ids.length > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {grupo.endereco_ids.length} endereços vinculados
                      </p>
                      {grupo.endereco_ids.length < grupo.quantidade && (
                        <p className="text-xs text-destructive font-medium">
                          ⚠️ Faltam {grupo.quantidade - grupo.endereco_ids.length} pontos - mapear em campo
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {grupo.quantidade} endereços serão mapeados em campo
                    </p>
                  )}
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* Botões de Navegação */}
        <div className="flex gap-3 pt-4">
          {etapa > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEtapa(etapa - 1)}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}

          {etapa < 3 ? (
            <Button onClick={handleProximaEtapa} className="flex-1">
              Próxima
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex-1"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Criar Campanha
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
