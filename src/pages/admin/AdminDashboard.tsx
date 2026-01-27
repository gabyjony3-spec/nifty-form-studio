import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, CreditCard, Euro, Loader2, Star, Radar, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// VIP emails that have lifetime access
const VIP_EMAILS = ["adp.comunicacao2019@gmail.com", "cadp.comunicacao2019@gmail.com", "sweetwish493@gmail.com"];

interface AdminStats {
  totalRevenue: number;
  totalUsers: number;
  totalSales: number;
  activeSubscriptions: number;
  lifetimeUsers: number;
  analysesToday: number;
  totalAnalyses: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  email?: string;
  isVIP?: boolean;
  score?: number;
}

interface RecentAnalysis {
  id: string;
  target_url: string | null;
  platform: string | null;
  score: number | null;
  created_at: string;
  user_email?: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: 0,
    totalUsers: 0,
    totalSales: 0,
    activeSubscriptions: 0,
    lifetimeUsers: 0,
    analysesToday: 0,
    totalAnalyses: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();

    // Configurar realtime para atividades
    const channel = supabase
      .channel("admin-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => fetchAdminData()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        () => fetchAdminData()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "history_analysis" },
        () => fetchAdminData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAdminData = async () => {
    try {
      // Buscar total de usuários
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact" });

      // Buscar usuários vitalícios
      const { count: lifetimeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("has_lifetime_access", true);

      // Buscar subscrições ativas e calcular receita
      const { data: subscriptions, count: activeSubscriptions } = await supabase
        .from("subscriptions")
        .select("plan", { count: "exact" })
        .eq("status", "active");

      const planPrices: Record<string, number> = {
        basic: 19,
        advanced: 49,
        pro_ai: 97,
      };
      const totalRevenue = subscriptions?.reduce(
        (sum, sub) => sum + (planPrices[sub.plan || "basic"] || 0),
        0
      ) || 0;

      // Buscar total de vendas (subscriptions criadas)
      const { count: totalSales } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact" });

      // Buscar análises de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: analysesToday } = await supabase
        .from("history_analysis")
        .select("*", { count: "exact" })
        .gte("created_at", today.toISOString());

      // Buscar total de análises
      const { count: totalAnalyses } = await supabase
        .from("history_analysis")
        .select("*", { count: "exact" });

      setStats({
        totalRevenue,
        totalUsers: totalUsers || 0,
        totalSales: totalSales || 0,
        activeSubscriptions: activeSubscriptions || 0,
        lifetimeUsers: lifetimeUsers || 0,
        analysesToday: analysesToday || 0,
        totalAnalyses: totalAnalyses || 0,
      });

      // Buscar atividades recentes (users + leads + analyses)
      const recentActivities: Activity[] = [];

      // Novos usuários
      const { data: recentUsers } = await supabase
        .from("profiles")
        .select("id, full_name, created_at, email, has_lifetime_access")
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentUsers) {
        recentUsers.forEach(user => {
          const isVIP = VIP_EMAILS.includes(user.email || "") || user.has_lifetime_access;
          recentActivities.push({
            id: user.id,
            type: "user",
            description: `Novo usuário: ${user.full_name || "Sem nome"}`,
            timestamp: user.created_at || "",
            email: user.email || undefined,
            isVIP,
          });
        });
      }

      // Novos leads
      const { data: recentLeads } = await supabase
        .from("leads")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentLeads) {
        recentLeads.forEach(lead => {
          recentActivities.push({
            id: lead.id,
            type: "lead",
            description: `Novo lead: ${lead.full_name}`,
            timestamp: lead.created_at || "",
          });
        });
      }

      // Análises recentes
      const { data: recentAnalysesData } = await supabase
        .from("history_analysis")
        .select("id, target_url, platform, score, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentAnalysesData) {
        recentAnalysesData.forEach(analysis => {
          recentActivities.push({
            id: analysis.id,
            type: "analysis",
            description: `Análise: ${extractUsername(analysis.target_url)} (${analysis.platform || "Social"})`,
            timestamp: analysis.created_at || "",
            score: analysis.score || undefined,
          });
        });
        
        setRecentAnalyses(recentAnalysesData);
      }

      // Ordenar por timestamp
      recentActivities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(recentActivities.slice(0, 8));
    } catch (error) {
      console.error("Erro ao buscar dados admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractUsername = (url: string | null): string => {
    if (!url) return "Perfil";
    const match = url.match(/(?:@)?([a-zA-Z0-9._-]+)(?:\/)?$/);
    return match ? `@${match[1]}` : "Perfil";
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Admin - Visão Geral</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <Euro className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€{stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">Receita mensal recorrente</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                <Star className="h-3 w-3 mr-1" />
                {stats.lifetimeUsers} vitalícios
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Análises Hoje
            </CardTitle>
            <Radar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.analysesToday}</div>
            <p className="text-xs text-muted-foreground">{stats.totalAnalyses} total</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinaturas Ativas
            </CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">{stats.totalSales} vendas totais</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.type === 'analysis' ? 'bg-cyan-500' :
                      activity.type === 'user' ? 'bg-green-500' : 'bg-primary'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.description}
                        </p>
                        {activity.isVIP && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                        {activity.score && (
                          <Badge variant="outline" className="text-xs">
                            {activity.score}/100
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                        {activity.email && ` • ${activity.email}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Analyses */}
        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Radar className="h-5 w-5 text-cyan-400" />
              Últimas Análises de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnalyses.length === 0 ? (
              <div className="text-center py-8">
                <Radar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma análise realizada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        (analysis.score || 0) >= 70 ? 'bg-green-500/20 text-green-400' :
                        (analysis.score || 0) >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        <span className="text-sm font-bold">{analysis.score || 0}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {extractUsername(analysis.target_url)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {analysis.platform || "Social"} • {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {analysis.platform || "social"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
