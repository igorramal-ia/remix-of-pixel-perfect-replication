import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Edit, UserPlus } from "lucide-react";
import { TerritoriosEditorUF } from "@/components/TerritoriosEditorUF";
import { useUpdateTerritorios, type Territorios } from "@/hooks/useTerritorios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserRole } from "@/contexts/AuthContext";

interface User {
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  role: UserRole;
  criado_em: string;
  territorios: Territorios | null;
}

const Users = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const updateTerritorios = useUpdateTerritorios();

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    password: "",
    role: "coordenador" as UserRole,
    territorios: { ufs: [] } as Territorios,
  });

  const [editTerritorios, setEditTerritorios] = useState<Territorios>({
    ufs: [],
  });

  useEffect(() => {
    if (hasRole("administrador")) {
      fetchUsers();
    }
  }, [hasRole]);

  const fetchUsers = async () => {
    try {
      console.log("📥 [BUSCANDO USUÁRIOS]");
      
      // Buscar todos os profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, nome, telefone, criado_em, territorios")
        .order("criado_em", { ascending: false });

      if (profilesError) throw profilesError;

      console.log("📊 [PROFILES DO BANCO]:", profilesData);

      // Buscar todos os roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Fazer merge dos dados
      const formattedUsers =
        profilesData?.map((user: any) => {
          const userRole = rolesData?.find((r: any) => r.user_id === user.id);
          
          // Debug: verificar territórios
          console.log(`\n🔍 [DEBUG] Usuário: ${user.nome}`);
          console.log(`  ID: ${user.id}`);
          console.log(`  Email: ${user.email}`);
          console.log(`  Role: ${userRole?.role}`);
          console.log(`  Territorios (raw):`, user.territorios);
          console.log(`  Tipo de territorios:`, typeof user.territorios);
          console.log(`  É null?`, user.territorios === null);
          console.log(`  É objeto?`, typeof user.territorios === 'object');
          
          if (user.territorios) {
            console.log(`  ✅ Territórios de ${user.nome}:`, user.territorios);
            console.log(`    - cidades:`, user.territorios.cidades);
            console.log(`    - comunidades:`, user.territorios.comunidades);
          } else {
            console.log(`  ⚠️ ${user.nome} não tem territórios`);
          }
          
          // Normalizar territorios para novo formato
          let territoriosNormalizados = { ufs: [] };
          if (user.territorios) {
            // Se já está no formato novo (com ufs)
            if (user.territorios.ufs) {
              territoriosNormalizados = user.territorios;
            }
            // Se está no formato antigo (com cidades/comunidades)
            else if (user.territorios.cidades || user.territorios.comunidades) {
              console.warn(`⚠️ [FORMATO ANTIGO] ${user.nome} ainda usa cidades/comunidades`);
              territoriosNormalizados = { ufs: [] }; // Vazio até migrar
            }
          }
          
          return {
            id: user.id,
            email: user.email,
            nome: user.nome,
            telefone: user.telefone,
            role: userRole?.role || "coordenador",
            criado_em: user.criado_em,
            territorios: territoriosNormalizados,
          };
        }) || [];

      console.log("📋 [USUÁRIOS FORMATADOS]:", formattedUsers);
      console.log("\n📊 [RESUMO DOS TERRITÓRIOS]:");
      formattedUsers.forEach((u: any) => {
        if (u.role === 'coordenador') {
          const temFormatoAntigo = profilesData?.find((p: any) => p.id === u.id)?.territorios?.cidades || 
                                   profilesData?.find((p: any) => p.id === u.id)?.territorios?.comunidades;
          console.log(`  ${u.nome}:`, {
            ufs: u.territorios?.ufs || [],
            temUfs: (u.territorios?.ufs?.length || 0) > 0,
            formatoAntigo: !!temFormatoAntigo,
          });
        }
      });
      
      setUsers(formattedUsers);
    } catch (error: any) {
      console.error("❌ [ERRO AO BUSCAR USUÁRIOS]:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      console.log("🔵 [CRIAR USUÁRIO] Iniciando...");
      console.log("  formData:", formData);
      console.log("  territorios:", formData.territorios);
      
      // Validar dados obrigatórios
      if (!formData.nome || !formData.email || !formData.password) {
        throw new Error("Nome, email e senha são obrigatórios");
      }
      
      // Usar signUp em vez de admin.createUser para evitar erro 403
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nome: formData.nome, // Nome vai para user_metadata
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) throw authError;

      console.log("✅ [AUTH] Usuário criado:", authData.user?.id);

      if (authData.user) {
        // Adicionar role
        console.log("📝 [ROLE] Inserindo role:", formData.role);
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: formData.role,
        });

        if (roleError) throw roleError;
        console.log("✅ [ROLE] Role inserida com sucesso");

        // Atualizar profile com telefone e territórios
        const updateData: any = {
          nome: formData.nome, // Garantir que nome seja salvo
          telefone: formData.telefone || null,
        };

        // Se for coordenador, adicionar territórios
        if (formData.role === "coordenador") {
          updateData.territorios = formData.territorios as any;
          console.log("🗺️ [TERRITORIOS] Salvando territórios:");
          console.log("  formData.territorios:", formData.territorios);
          console.log("  updateData.territorios:", updateData.territorios);
          console.log("  JSON stringified:", JSON.stringify(updateData.territorios));
          console.log("  Tipo:", typeof updateData.territorios);
        }

        console.log("📝 [PROFILE] Atualizando profile com:", updateData);
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", authData.user.id)
          .select();

        if (profileError) throw profileError;
        console.log("✅ [PROFILE] Profile atualizado:", profileData);
      }

      toast({
        title: "Usuário criado com sucesso",
        description: `${formData.nome} foi adicionado ao sistema. ${authData.user?.email_confirmed_at ? '' : 'Um email de confirmação foi enviado.'}`,
      });

      setDialogOpen(false);
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        password: "",
        role: "coordenador",
        territorios: { ufs: [] },
      });
      
      // Aguardar um pouco antes de recarregar
      setTimeout(() => {
        fetchUsers();
      }, 500);
    } catch (error: any) {
      console.error("❌ [ERRO] Ao criar usuário:", error);
      
      // Tratamento específico para rate limit
      if (error.message?.includes("email rate limit exceeded") || error.message?.includes("rate limit")) {
        toast({
          title: "Limite de emails atingido",
          description: "Você criou muitos usuários em pouco tempo. Aguarde alguns minutos e tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar usuário",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleEditTerritorios = (user: User) => {
    setEditingUser(user);
    setEditTerritorios(user.territorios || { ufs: [] });
    setEditDialogOpen(true);
  };

  const handleSaveTerritorios = async () => {
    if (!editingUser) return;

    console.log("💾 [CLIQUE EM SALVAR]");
    console.log("  editingUser:", editingUser);
    console.log("  editTerritorios (estado local):", editTerritorios);
    console.log("  editTerritorios stringified:", JSON.stringify(editTerritorios));

    try {
      await updateTerritorios.mutateAsync({
        userId: editingUser.id,
        territorios: editTerritorios,
      });

      toast({
        title: "Territórios atualizados",
        description: "Os territórios do coordenador foram atualizados com sucesso.",
      });

      setEditDialogOpen(false);
      setEditingUser(null);
      
      // Aguardar um pouco antes de recarregar para garantir que o banco foi atualizado
      setTimeout(() => {
        fetchUsers();
      }, 500);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar territórios",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      toast({
        title: "Usuário excluído",
        description: "O usuário foi removido do sistema.",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const variants = {
      administrador: "default",
      operacoes: "secondary",
      coordenador: "outline",
    };

    const labels = {
      administrador: "Administrador",
      operacoes: "Operações",
      coordenador: "Coordenador",
    };

    return <Badge variant={variants[role] as any}>{labels[role]}</Badge>;
  };

  if (!hasRole("administrador")) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Gerenciar Usuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre e gerencie usuários do sistema
          </p>
        </div>

        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Território</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nome}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.role === "coordenador" ? (
                      <div className="flex flex-wrap gap-1">
                        {user.territorios?.ufs?.map((uf) => (
                          <Badge
                            key={uf}
                            variant="default"
                            className="bg-blue-500 text-xs"
                          >
                            {uf}
                          </Badge>
                        ))}
                        
                        {(!user.territorios?.ufs?.length) && (
                          <span className="text-xs text-muted-foreground">
                            Sem território
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.criado_em).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.role === "coordenador" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTerritorios(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal Criar Usuário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo usuário. Ele receberá um e-mail com as
              credenciais de acesso.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(11) 98765-4321"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha Temporária</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="operacoes">Operações</SelectItem>
                  <SelectItem value="coordenador">Coordenador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === "coordenador" && (
              <TerritoriosEditorUF
                value={formData.territorios}
                onChange={(territorios) =>
                  setFormData({ ...formData, territorios })
                }
              />
            )}

            <Button type="submit" className="w-full" disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Usuário
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Territórios */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Territórios</DialogTitle>
            <DialogDescription>
              Defina os estados (UF) que {editingUser?.nome} pode acessar.
            </DialogDescription>
          </DialogHeader>
          <TerritoriosEditorUF
            value={editTerritorios}
            onChange={setEditTerritorios}
          />
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTerritorios}
              disabled={updateTerritorios.isPending}
              className="flex-1"
            >
              {updateTerritorios.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
