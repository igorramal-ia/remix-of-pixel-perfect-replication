import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  MapPin,
  Megaphone,
  Map,
  FileText,
  Brain,
  Users,
  Settings,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: any;
  label: string;
  path: string;
  allowedRoles: UserRole[];
}

const navItems: NavItem[] = [
  { 
    icon: LayoutDashboard, 
    label: "Dashboard", 
    path: "/", 
    allowedRoles: ['administrador', 'operacoes', 'coordenador'] 
  },
  { 
    icon: MapPin, 
    label: "Inventário", 
    path: "/inventario", 
    allowedRoles: ['administrador', 'operacoes'] 
  },
  { 
    icon: Megaphone, 
    label: "Campanhas", 
    path: "/campanhas", 
    allowedRoles: ['administrador', 'operacoes', 'coordenador'] 
  },
  { 
    icon: Map, 
    label: "Mapa", 
    path: "/mapa", 
    allowedRoles: ['administrador', 'operacoes'] // Removido 'coordenador'
  },
  { 
    icon: FileText, 
    label: "Relatórios", 
    path: "/relatorios", 
    allowedRoles: ['administrador', 'operacoes'] 
  },
  { 
    icon: Brain, 
    label: "IA Estratégia", 
    path: "/ia", 
    allowedRoles: ['administrador', 'operacoes'] 
  },
  { 
    icon: Users, 
    label: "Usuários", 
    path: "/usuarios", 
    allowedRoles: ['administrador'] 
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, hasRole } = useAuth();

  const filteredNavItems = navItems.filter(item => hasRole(item.allowedRoles));

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-display font-bold text-sm tracking-tight text-sidebar-foreground">
              Digital Favela
            </h1>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">
              OOH System
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/perfil"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            location.pathname === "/perfil"
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          <Users className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Meu Perfil</span>}
        </NavLink>
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-all"
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </button>
        <button
          onClick={async () => { await signOut(); navigate("/login"); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent w-full transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-card flex items-center justify-center hover:bg-muted transition-colors"
      >
        <ChevronLeft
          className={cn(
            "w-3 h-3 text-muted-foreground transition-transform",
            collapsed && "rotate-180"
          )}
        />
      </button>
    </aside>
  );
}
