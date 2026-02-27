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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCreateEndereco, geocodeAddress } from "@/hooks/useInventoryData";
import { Loader2, MapPin, CheckCircle } from "lucide-react";

const formSchema = z.object({
  uf: z.string().min(2, "Selecione o estado"),
  cidade: z.string().min(2, "Digite a cidade"),
  comunidade: z.string().min(2, "Digite a comunidade"),
  endereco: z.string().min(5, "Digite o endereço completo"),
});

type FormData = z.infer<typeof formSchema>;

interface NovoEnderecoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function NovoEnderecoModal({ open, onOpenChange }: NovoEnderecoModalProps) {
  const { toast } = useToast();
  const createEndereco = useCreateEndereco();
  const [geocoding, setGeocoding] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      uf: "",
      cidade: "",
      comunidade: "",
      endereco: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      let lat: number | undefined;
      let lng: number | undefined;

      // Buscar coordenadas via Google Maps Geocoding API
      if (apiKey) {
        setGeocoding(true);
        const coords = await geocodeAddress(
          data.endereco,
          data.cidade,
          data.uf,
          apiKey
        );
        
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
          toast({
            title: "Coordenadas encontradas",
            description: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
          });
        } else {
          toast({
            title: "Coordenadas não encontradas",
            description: "O endereço será salvo sem localização no mapa.",
            variant: "destructive",
          });
        }
        setGeocoding(false);
      }

      // Salvar no banco
      await createEndereco.mutateAsync({
        uf: data.uf,
        cidade: data.cidade,
        comunidade: data.comunidade,
        endereco: data.endereco,
        lat,
        long: lng,
      });

      toast({
        title: "Endereço cadastrado",
        description: "O novo endereço foi adicionado ao inventário.",
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar endereço",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Endereço</DialogTitle>
          <DialogDescription>
            Cadastre um novo endereço no inventário. As coordenadas serão buscadas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="uf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado (UF)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ESTADOS_BRASIL.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rio de Janeiro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comunidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comunidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rocinha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rua da Paz, 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!apiKey && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-medium">⚠️ Google Maps API não configurada</p>
                <p className="text-xs mt-1">
                  O endereço será salvo sem coordenadas. Configure VITE_GOOGLE_MAPS_KEY para habilitar geocoding.
                </p>
              </div>
            )}

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
                disabled={createEndereco.isPending || geocoding}
                className="flex-1"
              >
                {geocoding ? (
                  <>
                    <MapPin className="w-4 h-4 mr-2 animate-pulse" />
                    Buscando coordenadas...
                  </>
                ) : createEndereco.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Cadastrar
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
