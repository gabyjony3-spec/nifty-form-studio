import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, TrendingUp, Eye, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [chartData, setChartData] = useState<{ name: string; leads: number; users: number }[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch total leads from analysis
      const { count: leadsCount } = await supabase
        .from("leads_analysis")
        .select("*", { count: "exact", head: true });

      // Fetch active subscriptions
      const { count: subsCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Calculate conversion rate
      const rate = leadsCount && leadsCount > 0 
        ? ((subsCount || 0) / leadsCount * 100).toFixed(1)
        : "0";

      setTotalUsers(usersCount || 0);
      setTotalLeads(leadsCount || 0);
      setActiveSubscriptions(subsCount || 0);
      setConversionRate(parseFloat(rate));

      // Fetch leads by month for chart
      const { data: leadsData } = await supabase
        .from("leads_analysis")
        .select("created_at")
        .order("created_at", { ascending: true });

      const { data: usersData } = await supabase
        .from("profiles")
        .select("created_at")
        .order("created_at", { ascending: true });

      // Group by month
      const monthlyData: Record<string, { leads: number; users: number }> = {};
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      leadsData?.forEach(lead => {
        const date = new Date(lead.created_at);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { leads: 0, users: 0 };
        }
        monthlyData[monthKey].leads++;
      });

      usersData?.forEach(user => {
        if (user.created_at) {
          const date = new Date(user.created_at);
          const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { leads: 0, users: 0 };
          }
          monthlyData[monthKey].users++;
        }
      });

      const chartArray = Object.entries(monthlyData).map(([name, data]) => ({
        name,
        leads: data.leads,
        users: data.users,
      }));

      setChartData(chartArray.slice(-6)); // Last 6 months
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Analytics Global</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-card border-border">
              <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-20" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Analytics Global</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Usuários registados</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Leads
            </CardTitle>
            <Filter className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">Análises solicitadas</p>
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
            <div className="text-2xl font-bold text-foreground">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Leads → Assinantes</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinaturas Ativas
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Clientes pagantes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <CardTitle className="text-foreground">Crescimento ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.3)"
                  name="Leads"
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="2"
                  stroke="hsl(142 76% 36%)" 
                  fill="hsl(142 76% 36% / 0.3)"
                  name="Usuários"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado disponível para exibir gráficos.</p>
                <p className="text-sm">Os dados aparecerão quando houver leads e usuários.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsPage;
