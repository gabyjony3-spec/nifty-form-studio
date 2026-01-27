import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  TrendingUp,
  Users,
  Zap,
  FileSearch,
  BarChart3,
  Settings,
  User,
  LogOut,
  Sparkles,
  Clock,
  BookOpen,
  UsersRound,
  CreditCard,
  FileBarChart,
  Crown,
  Link,
  MessageSquare,
  History,
} from "lucide-react";
import radarIcon from "@/assets/radar-profile-score.png";
import { Radar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { title: "Vendas", url: "/dashboard", icon: TrendingUp },
  { title: "Radar de Nicho", url: "/dashboard/radar", icon: Radar },
  { title: "Leads", url: "/dashboard/leads", icon: Users },
  { title: "Automação", url: "/dashboard/automation", icon: Zap },
  { title: "WhatsApp", url: "/dashboard/whatsapp", icon: MessageSquare },
  { title: "Histórico WhatsApp", url: "/dashboard/whatsapp-history", icon: Clock },
  { title: "Análise", url: "/dashboard/analysis", icon: FileSearch },
  { title: "Analítico", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Relatórios", url: "/dashboard/reports", icon: FileBarChart },
  { title: "Histórico", url: "/dashboard/history", icon: Clock },
  { title: "Histórico Global", url: "/dashboard/history-global", icon: History },
  { title: "Biblioteca", url: "/dashboard/library", icon: BookOpen },
  { title: "Equipa", url: "/dashboard/team", icon: UsersRound },
  { title: "Integrações", url: "/dashboard/integrations", icon: Link },
  { title: "Preços", url: "/dashboard/pricing", icon: CreditCard },
  { title: "Configuração", url: "/dashboard/settings", icon: Settings },
  { title: "Perfil", url: "/dashboard/profile", icon: User },
];

export function UserSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPro, isLifetime, isTrial, trialDaysRemaining, plan, isLoading } = useSubscription();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/");
  };

  const getPlanBadge = () => {
    if (isLoading) return null;
    
    if (isLifetime) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 gap-1">
          <Crown className="h-3 w-3" />
          {!collapsed && "Vitalício"}
        </Badge>
      );
    }
    
    if (isPro) {
      return (
        <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 gap-1">
          <Sparkles className="h-3 w-3" />
          {!collapsed && "Pro"}
        </Badge>
      );
    }
    
    if (isTrial && trialDaysRemaining > 0) {
      return (
        <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 gap-1">
          <Clock className="h-3 w-3" />
          {!collapsed && `Trial: ${trialDaysRemaining}d`}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">
        {!collapsed && "Free"}
      </Badge>
    );
  };

  return (
    <Sidebar 
      className={collapsed ? "w-16" : "w-64"} 
      collapsible="icon"
      style={{
        background: "linear-gradient(180deg, rgba(8,145,178,0.15) 0%, rgba(15,23,42,0.95) 100%)",
        borderRight: "1px solid rgba(6,182,212,0.2)"
      }}
    >
      <SidebarContent>
        {/* Logo/Branding */}
        {!collapsed && (
          <div className="p-6 border-b border-cyan-900/20">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50 animate-pulse">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-cyan-300">AI IN</h2>
                <p className="text-xs text-cyan-400/70">Seu Assistente IA</p>
              </div>
            </div>
          </div>
        )}

        {/* Plan Badge */}
        <div className={`px-4 py-3 border-b border-cyan-900/20 ${collapsed ? "flex justify-center" : ""}`}>
          {getPlanBadge()}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-cyan-400/90 font-medium uppercase text-xs tracking-wider px-4 py-3">
            {!collapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-cyan-900/30 hover:text-cyan-300 text-cyan-100/80 transition-all duration-200 rounded-lg mx-2"
                      activeClassName="bg-gradient-to-r from-cyan-900/40 to-blue-900/20 text-cyan-300 font-semibold border-l-4 border-cyan-400 shadow-lg shadow-cyan-500/20"
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-cyan-900/20">
        <SidebarMenuItem>
          <SidebarMenuButton 
            onClick={handleLogout}
            className="hover:bg-cyan-900/30 text-cyan-300 hover:text-cyan-200 transition-all duration-200 rounded-lg"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Sair</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  );
}
