import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, TrendingUp, TrendingDown, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  created_at: string;
  profile_name?: string;
  profile_email?: string;
}

const PLAN_PRICES: Record<string, number> = {
  basic: 19,
  advanced: 49,
  pro_ai: 97,
};

const PaymentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch subscriptions
      const { data: subs, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for user names
      const userIds = (subs || []).map(s => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Map profiles to subscriptions
      const subscriptionData: Subscription[] = (subs || []).map(sub => {
        const profile = profiles?.find(p => p.id === sub.user_id);
        return {
          ...sub,
          profile_name: profile?.full_name || null,
          profile_email: profile?.email || null,
        };
      });

      setSubscriptions(subscriptionData);

      // Calculate metrics
      const active = subscriptionData.filter(s => s.status === "active").length;
      const cancelled = subscriptionData.filter(s => s.status === "cancelled").length;
      
      // Calculate monthly revenue from active subscriptions
      const revenue = subscriptionData
        .filter(s => s.status === "active")
        .reduce((sum, sub) => sum + (PLAN_PRICES[sub.plan || "basic"] || 0), 0);

      setActiveCount(active);
      setCancelledCount(cancelled);
      setMonthlyRevenue(revenue);
    } catch (error) {
      console.error("Error fetching payments data:", error);
    } finally {
      setLoading(false);
    }
  };

  const churnRate = subscriptions.length > 0 
    ? ((cancelledCount / subscriptions.length) * 100).toFixed(1)
    : "0";

  const getPlanName = (plan: string) => {
    switch (plan) {
      case "basic": return "Plano Basic";
      case "advanced": return "Plano Advanced";
      case "pro_ai": return "Plano Pro AI";
      default: return plan;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "agora";
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays}d`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Gestão de Pagamentos</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
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
      <h1 className="text-3xl font-bold text-foreground">Gestão de Pagamentos</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Receita Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              €{monthlyRevenue.toLocaleString("pt-PT")}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeCount} assinatura(s) ativa(s)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Assinaturas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {subscriptions.length} total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Taxa de Churn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{churnRate}%</div>
            <p className="text-xs text-muted-foreground">
              {cancelledCount} cancelada(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground">Transações Recentes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.slice(0, 10).map((sub, index) => (
                <div 
                  key={sub.id}
                  className={`flex items-center justify-between pb-4 ${
                    index < subscriptions.slice(0, 10).length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {sub.profile_name || sub.profile_email || "Usuário"} - {getPlanName(sub.plan)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getTimeAgo(sub.created_at)} • {sub.status === "active" ? "Ativo" : sub.status === "cancelled" ? "Cancelado" : sub.status}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${sub.status === "active" ? "text-primary" : "text-muted-foreground"}`}>
                    {sub.status === "active" ? "+" : ""}€{PLAN_PRICES[sub.plan] || 0}.00
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsPage;
