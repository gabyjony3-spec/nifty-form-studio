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
  Filter,
  Users,
  CreditCard,
  Webhook,
  BarChart3,
  Brain,
  UsersRound,
  Settings,
  LogOut,
  Shield,
  KeyRound,
  UserCircle,
  Crown,
  Plug,
  MessageSquare,
  Building2,
  FileText,
  Zap,
  Briefcase,
  Search,
  Megaphone,
  Radar,
  PhoneCall,
  Wifi,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { title: "Vendas", url: "/admin", icon: TrendingUp },
  { title: "Centro de Análises", url: "/admin/analysis-center", icon: Search },
  { title: "Campanhas Ads", url: "/admin/campaigns", icon: Megaphone },
  { title: "Funil de Conversão", url: "/admin/funnel", icon: Filter },
  { title: "Empresas SaaS", url: "/admin/companies", icon: Building2 },
  { title: "Leads", url: "/admin/leads", icon: Users },
  { title: "Leads de Análise", url: "/admin/analysis-leads", icon: BarChart3 },
  { title: "Leads de Serviços", url: "/admin/service-leads", icon: Briefcase },
  { title: "Pagamentos", url: "/admin/payments", icon: CreditCard },
  { title: "Assinaturas", url: "/admin/subscriptions", icon: Crown },
  { title: "Acesso Vitalício", url: "/admin/lifetime-access", icon: Crown },
  { title: "Webhooks Ticto", url: "/admin/webhooks", icon: Webhook },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Integrações", url: "/admin/integrations", icon: Plug },
  { title: "WhatsApp Central", url: "/admin/whatsapp-central", icon: MessageSquare },
  { title: "Twilio Central", url: "/admin/twilio-dispatch", icon: PhoneCall },
  { title: "Histórico WhatsApp", url: "/admin/whatsapp-history", icon: MessageSquare },
  { title: "Templates WhatsApp", url: "/admin/templates", icon: FileText },
  { title: "Automações", url: "/admin/automations", icon: Zap },
  { title: "Análises de IA", url: "/admin/ai-analysis", icon: Brain },
  { title: "Análises Utilizadores", url: "/admin/user-analysis", icon: Radar },
  { title: "Utilizadores Online", url: "/admin/presence", icon: Wifi },
  { title: "Usuários", url: "/admin/users", icon: UsersRound },
  { title: "Códigos de Acesso", url: "/admin/access-codes", icon: KeyRound },
  { title: "Perfil", url: "/admin/perfil", icon: UserCircle },
  { title: "Configurações", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo, Admin!",
    });
    navigate("/");
  };

  return (
    <Sidebar 
      className={collapsed ? "w-16" : "w-72"} 
      collapsible="icon"
      style={{
        background: "linear-gradient(180deg, rgba(127,29,29,0.2) 0%, rgba(17,24,39,0.95) 100%)",
        borderRight: "1px solid rgba(220,38,38,0.2)"
      }}
    >
      <SidebarContent>
        {/* Logo/Branding */}
        {!collapsed && (
          <div className="p-6 border-b border-red-900/30">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/50">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-400">AI IN</h2>
                <p className="text-xs text-red-300/70">Admin Control</p>
              </div>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-red-400/90 font-semibold uppercase text-xs tracking-wider px-4 py-3">
            {!collapsed && "Painel de Controle"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-red-900/30 hover:text-red-300 text-red-200/80 transition-all duration-200 rounded-lg mx-2"
                      activeClassName="bg-gradient-to-r from-red-900/50 to-red-800/30 text-red-300 font-semibold border-l-4 border-red-500 shadow-lg shadow-red-500/20"
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

      <SidebarFooter className="p-4 border-t border-red-900/30">
        <SidebarMenuItem>
          <SidebarMenuButton 
            onClick={handleLogout}
            className="hover:bg-red-900/40 text-red-300 hover:text-red-200 transition-all duration-200 rounded-lg"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Sair</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  );
}
