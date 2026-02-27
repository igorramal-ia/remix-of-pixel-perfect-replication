import { useAuth } from "@/contexts/AuthContext";
import { useUserTerritorios } from "@/hooks/useTerritorios";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, MapPin, Shield } from "lucide-react";

const Profile = () => {
  const { user, userRole } = useAuth();
  const { data: territorios, isLoading } = useUserTerritorios(user?.id);

  const getRoleLabel = (role: string) => {
    const labels = {
      administrador: "Administrador",
      operacoes: "Operações",
      coordenador: "Coordenador",
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Meu Perfil
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize suas informações e permissões
        </p>
      </div>

      <div className="grid gap-6">
        {/* Informações Básicas */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground">
                Informações Pessoais
              </h2>
              <p className="text-sm text-muted-foreground">Seus dados cadastrais</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nome
              </label>
              <p className="text-foreground mt-1">
                {user?.user_metadata?.nome || "Não informado"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                E-mail
              </label>
              <p className="text-foreground mt-1">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Perfil
              </label>
              <div className="mt-1">
                <Badge variant="default">{getRoleLabel(userRole || "")}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Territórios (apenas para coordenadores) */}
        {userRole === "coordenador" && (
          <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">
                  Meu Território
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cidades e comunidades que você cobre
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ) : territorios ? (
              <div className="space-y-4">
                {territorios.cidades && territorios.cidades.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Cidades (todas as comunidades)
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {territorios.cidades.map((cidade) => (
                        <Badge
                          key={cidade}
                          variant="default"
                          className="bg-blue-500"
                        >
                          {cidade}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {territorios.comunidades && territorios.comunidades.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Comunidades Específicas
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {territorios.comunidades.map((comunidade) => (
                        <Badge
                          key={comunidade}
                          variant="default"
                          className="bg-green-500"
                        >
                          {comunidade}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(!territorios.cidades || territorios.cidades.length === 0) &&
                  (!territorios.comunidades ||
                    territorios.comunidades.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum território definido. Entre em contato com o
                      administrador.
                    </p>
                  )}
              </div>
            ) : null}
          </div>
        )}

        {/* Permissões */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground">
                Permissões
              </h2>
              <p className="text-sm text-muted-foreground">
                O que você pode fazer no sistema
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {userRole === "administrador" && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Acesso total ao sistema</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Gerenciar usuários</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Criar e editar campanhas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Gerenciar inventário</span>
                </div>
              </>
            )}

            {userRole === "operacoes" && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Visualizar dashboard</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Criar e editar campanhas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Gerenciar inventário</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Extrair relatórios</span>
                </div>
              </>
            )}

            {userRole === "coordenador" && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Visualizar campanhas vinculadas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Executar instalações</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Upload de fotos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Atualizar status</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
