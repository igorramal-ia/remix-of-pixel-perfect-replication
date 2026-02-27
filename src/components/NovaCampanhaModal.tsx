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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useCreateCampanha, useCoordenadores } from "@/hooks/useCampaignsData";
import { Loader2, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  nome: z.string().min(3, "Digite o nome da campanha"),
  cliente: z.string().min(2, "Digite o nome do cliente"),
  data_inicio: z.string().min(1, "Selecione a data de início"),
  data_fim: z.string().min(1, "Selecione a data de fim"),
  cidade: z.string().min(2, "Digite a cidade alvo"),
  coordenadores_ids: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NovaCampanhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaCampanhaModal({ open, onOpenChange }: NovaCampanhaModalProps) {
  const { toast } = useToast();
  const createCampanha = useCreateCampanha();
  const { data: coordenadores, isLoading: loadingCoordenadores } = useCoordenadores();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cliente: "",
      data_inicio: "",
      data_fim: "",
      cidade: "",
      coordenadores_ids: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createCampanha.mutateAsync({
        nome: data.nome,
        cliente: data.cliente,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        cidade: data.cidade,
        coordenadores_ids: data.coordenadores_ids || [],
      });

      toast({
        title: "Campanha criada",
        description: "A nova campanha foi adicionada com sucesso.",
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao criar campanha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Campanha</DialogTitle>
          <DialogDescription>
            Crie uma nova campanha e vincule coordenadores responsáveis.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade(s) Alvo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rio de Janeiro, São Paulo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coordenadores_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Coordenadores Vinculados</FormLabel>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {loadingCoordenadores ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      ))
                    ) : coordenadores && coordenadores.length > 0 ? (
                      coordenadores.map((coordenador) => (
                        <FormField
                          key={coordenador.id}
                          control={form.control}
                          name="coordenadores_ids"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(coordenador.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, coordenador.id]);
                                    } else {
                                      field.onChange(
                                        current.filter((id) => id !== coordenador.id)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {coordenador.nome}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum coordenador disponível
                      </p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createCampanha.isPending}
                className="flex-1"
              >
                {createCampanha.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Criar Campanha
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
