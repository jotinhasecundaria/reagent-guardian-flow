import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package,
  QrCode,
  Warehouse,
  Activity,
  BarChart3,
  Scan,
  FlaskConical,
  Calendar,
  Users,
  LogOut,
  User,
  ArrowRightLeft,
  Trash2,
  Trophy,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
    description: "Visão geral do sistema",
  },
  {
    title: "Cadastrar Reagente",
    url: "/register",
    icon: FlaskConical,
    description: "Cadastrar novos lotes",
  },
  {
    title: "Estoque Virtual",
    url: "/inventory",
    icon: Warehouse,
    description: "Controle de estoque",
  },
  {
    title: "Leitura QR Code",
    url: "/scan",
    icon: Scan,
    description: "Registrar consumo",
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: Calendar,
    description: "Agendar exames",
  },
  {
    title: "Logs de Consumo",
    url: "/logs",
    icon: Activity,
    description: "Histórico e auditoria",
  },
  {
    title: "Transferências",
    url: "/transfers",
    icon: ArrowRightLeft,
    description: "Movimentação interna",
  },
  {
    title: "Descarte Seguro",
    url: "/discard",
    icon: Trash2,
    description: "Descarte controlado",
  },
  {
    title: "Gamificação",
    url: "/gamification",
    icon: Trophy,
    description: "Sistema de pontos",
  },
];

const adminMenuItems = [
  {
    title: "Gerenciar Usuários",
    url: "/users",
    icon: Users,
    description: "Administrar usuários",
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-2">
              <FlaskConical className="h-6 w-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold text-foreground">LabControl</h1>
                <p className="text-xs text-muted-foreground">Gestão de Reagentes</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={isActive(item.url) ? "bg-accent text-accent-foreground" : ""}
                  >
                    <NavLink to={item.url} title={item.description}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {profile?.role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={isActive(item.url) ? "bg-accent text-accent-foreground" : ""}
                    >
                      <NavLink to={item.url} title={item.description}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {profile && (
          <div className="p-4 border-t">
            {!collapsed ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile.role}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-8 h-8 p-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}