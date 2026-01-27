import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, TrendingUp, Euro } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [quickStats, setQuickStats] = useState({
    users: 0,
    leads: 0,
    revenue: 0,
  });
  const [adminProfile, setAdminProfile] = useState<any>(null);

  const fetchAdminProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      setAdminProfile(data);
    } catch (error) {
      console.error("Erro ao buscar perfil do admin:", error);
    }
  }, []);

  const fetchQuickStats = useCallback(async () => {
    try {
      // Total de usuários
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Total de leads (from both tables)
      const { count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      const { count: leadsAnalysisCount } = await supabase
        .from("leads_analysis")
        .select("*", { count: "exact", head: true });

      // Receita total
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("status", "active");

      const planPrices: Record<string, number> = {
        basic: 19,
        advanced: 49,
        pro_ai: 97,
      };
      const revenue = subscriptions?.reduce(
        (sum, sub) => sum + (planPrices[sub.plan] || 0),
        0
      ) || 0;

      setQuickStats({
        users: usersCount || 0,
        leads: (leadsCount || 0) + (leadsAnalysisCount || 0),
        revenue,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas rápidas:", error);
    }
  }, []);

  useEffect(() => {
    fetchQuickStats();
    fetchAdminProfile();
  }, [fetchQuickStats, fetchAdminProfile]);

  // Set up realtime subscriptions for quick stats
  useEffect(() => {
    console.log("[AdminLayout] Setting up realtime subscriptions for quick stats");

    const channel = supabase
      .channel('admin-quick-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          console.log("[AdminLayout] Profiles changed, refreshing stats");
          fetchQuickStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          console.log("[AdminLayout] Leads changed, refreshing stats");
          fetchQuickStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads_analysis' },
        () => {
          console.log("[AdminLayout] Leads analysis changed, refreshing stats");
          fetchQuickStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        () => {
          console.log("[AdminLayout] Subscriptions changed, refreshing stats");
          fetchQuickStats();
        }
      )
      .subscribe();

    return () => {
      console.log("[AdminLayout] Cleaning up realtime subscriptions");
      supabase.removeChannel(channel);
    };
  }, [fetchQuickStats]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-950 via-red-950/20 to-gray-950">
        <AdminSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-20 border-b border-red-900/30 bg-gradient-to-r from-gray-900 via-red-900/20 to-gray-900 backdrop-blur-md flex items-center px-6 sticky top-0 z-10 shadow-lg shadow-red-500/10">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="text-red-400 hover:text-red-300" />
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-red-500" />
                <div>
                  <h1 className="text-2xl font-bold text-red-400">Admin Panel</h1>
                  <p className="text-xs text-red-300/70">Sistema de Controle Total</p>
                </div>
              </div>
            </div>

            {/* Quick Stats & Avatar */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-950/30 rounded-lg border border-red-800/30">
                <Users className="h-4 w-4 text-red-400" />
                <div>
                  <p className="text-xs text-red-300/70">Usuários</p>
                  <p className="text-sm font-bold text-red-300">{quickStats.users}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-red-950/30 rounded-lg border border-red-800/30">
                <TrendingUp className="h-4 w-4 text-red-400" />
                <div>
                  <p className="text-xs text-red-300/70">Leads</p>
                  <p className="text-sm font-bold text-red-300">{quickStats.leads}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-red-950/30 rounded-lg border border-red-800/30">
                <Euro className="h-4 w-4 text-red-400" />
                <div>
                  <p className="text-xs text-red-300/70">Receita</p>
                  <p className="text-sm font-bold text-red-300">€{quickStats.revenue}</p>
                </div>
              </div>

              {/* Notification Bell */}
              <AdminNotificationBell />

              {/* Admin Avatar */}
              <Avatar className="h-10 w-10 border-2 border-red-500/50 shadow-lg shadow-red-500/30">
                <AvatarImage src={adminProfile?.avatar_url} alt={adminProfile?.full_name} />
                <AvatarFallback className="bg-red-900 text-red-100 font-semibold">
                  {adminProfile?.full_name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <div className="flex-1 p-6 overflow-auto bg-gradient-to-b from-transparent to-red-950/5">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
