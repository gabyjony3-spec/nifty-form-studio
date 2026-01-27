import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Zap, Euro, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrialCountdown } from "@/components/trial/TrialCountdown";
import { WhatsAppCreditsCard } from "@/components/automation/WhatsAppCreditsCard";
import { useUserCompany } from "@/hooks/useUserCompany";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

interface DashboardStats {
  totalRevenue: number;
  leadsCount: number;
  conversionRate: number;
  activeAutomations: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

const UserDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    leadsCount: 0,
    conversionRate: 0,
    activeAutomations: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeCompany, loading: companyLoading, userId } = useUserCompany();
  
  // Enable real-time notifications for leads and automations
  useRealtimeNotifications(userId);

  const fetchDashboardData = useCallback(async () => {
    if (!activeCompany?.id || !userId) {
      setLoading(false);
      return;
    }

    try {
      // Buscar leads da empresa
      const { data: leads, count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact" })
        .eq("company_id", activeCompany.id);

      // Buscar automações ativas (por user_id, mas relacionadas à empresa)
      const { count: activeAutomations } = await supabase
        .from("automations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_active", true);

      // Buscar triggers de automação da empresa
      const { count: activeTriggers } = await supabase
        .from("automation_triggers")
        .select("*", { count: "exact", head: true })
        .eq("company_id", activeCompany.id)
        .eq("is_active", true);

      // Buscar subscrições para calcular receita
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", userId)
        .eq("status", "active");

      // Calcular receita baseado nos planos
      const planPrices: Record<string, number> = {
        basic: 19,
        advanced: 49,
        pro_ai: 97,
      };
      const totalRevenue = subscriptions?.reduce(
        (sum, sub) => sum + (planPrices[sub.plan] || 0),
        0
      ) || 0;

      // Calcular taxa de conversão (leads convertidos / total de leads)
      const convertedLeads = leads?.filter(l => l.status === "converted").length || 0;
      const conversionRate = leadsCount && leadsCount > 0 
        ? (convertedLeads / leadsCount) * 100 
        : 0;

      setStats({
        totalRevenue,
        leadsCount: leadsCount || 0,
        conversionRate: Math.round(conversionRate * 10) / 10,
        activeAutomations: (activeAutomations || 0) + (activeTriggers || 0),
      });

      // Buscar atividades recentes
      const recentActivities: Activity[] = [];
      
      if (leads && leads.length > 0) {
        const recentLeads = leads.slice(0, 3);
        recentLeads.forEach(lead => {
          recentActivities.push({
            id: lead.id,
            type: "lead",
            description: `Novo lead: ${lead.full_name}`,
            timestamp: lead.created_at || "",
          });
        });
      }

      // Also fetch recent automation logs
      const { data: recentLogs } = await supabase
        .from("automation_logs")
        .select("id, type, content, created_at")
        .eq("company_id", activeCompany.id)
        .eq("type", "whatsapp")
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentLogs) {
        recentLogs.forEach(log => {
          recentActivities.push({
            id: log.id,
            type: "whatsapp",
            description: `WhatsApp enviado: ${(log.content || '').substring(0, 30)}...`,
            timestamp: log.created_at || "",
          });
        });
      }

      // Sort by timestamp
      recentActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(recentActivities.slice(0, 5));
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [activeCompany?.id, userId]);

  useEffect(() => {
    if (!companyLoading && activeCompany?.id) {
      fetchDashboardData();
    } else if (!companyLoading && !activeCompany) {
      setLoading(false);
    }
  }, [activeCompany?.id, companyLoading, fetchDashboardData]);

  // Realtime subscription for dashboard updates by company
  useEffect(() => {
    if (!activeCompany?.id) return;

    console.log('[UserDashboard] Setting up Realtime subscriptions for company:', activeCompany.id);

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `company_id=eq.${activeCompany.id}`
        },
        (payload) => {
          console.log('[UserDashboard] Leads change received:', payload);
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_triggers',
          filter: `company_id=eq.${activeCompany.id}`
        },
        (payload) => {
          console.log('[UserDashboard] Triggers change received:', payload);
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_logs',
          filter: `company_id=eq.${activeCompany.id}`
        },
        (payload) => {
          console.log('[UserDashboard] Automation logs change received:', payload);
          // Add new activities from automation logs
          const newLog = payload.new as { id: string; type: string; content?: string; created_at?: string };
          if (payload.eventType === 'INSERT' && newLog.type === 'whatsapp') {
            setActivities(prev => [{
              id: newLog.id,
              type: 'whatsapp',
              description: `WhatsApp enviado: ${(newLog.content || '').substring(0, 30)}...`,
              timestamp: newLog.created_at || new Date().toISOString()
            }, ...prev.slice(0, 4)]);
          }
        }
      )
      .subscribe((status) => {
        console.log('[UserDashboard] Realtime subscription status:', status);
      });

    return () => {
      console.log('[UserDashboard] Removing Realtime channel');
      supabase.removeChannel(channel);
    };
  }, [activeCompany?.id, fetchDashboardData]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `há ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    return `há ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
  };

  if (loading || companyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="space-y-6">
        <TrialCountdown />
        <h1 className="text-3xl font-bold text-foreground">Dashboard de Vendas</h1>
        <Card className="bg-card border-border panel-shadow">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Empresa não configurada. Entre em contacto com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TrialCountdown />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Empresa: {activeCompany.name}
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas Totais
            </CardTitle>
            <Euro className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€{stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">Receita mensal ativa</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Leads
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.leadsCount}</div>
            <p className="text-xs text-muted-foreground">Leads capturados</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Leads convertidos</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Automações Ativas
            </CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activeAutomations}</div>
            <p className="text-xs text-muted-foreground">Em funcionamento</p>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Credits */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <WhatsAppCreditsCard />
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <CardTitle className="text-foreground">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma atividade recente
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary glow-neon"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
