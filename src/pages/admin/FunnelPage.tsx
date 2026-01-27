import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Filter, TrendingUp, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { FunnelVisualization, defaultFunnelStages } from "@/components/funnel/FunnelVisualization";
import { AISuggestionsCard } from "@/components/funnel/AISuggestionsCard";
import { SalesPerformanceChart } from "@/components/admin/SalesPerformanceChart";

const FunnelPage = () => {
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState({
    visitors: 0,
    leads: 0,
    qualified: 0,
    conversions: 0,
  });

  useEffect(() => {
    fetchFunnelData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel("funnel-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads_analysis" },
        () => fetchFunnelData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => fetchFunnelData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions" },
        () => fetchFunnelData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFunnelData = async () => {
    try {
      // Count leads from analysis form (visitors who filled form)
      const { count: analysisCount } = await supabase
        .from("leads_analysis")
        .select("*", { count: "exact", head: true });

      // Count total leads
      const { count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      // Count qualified leads (leads with status 'qualified' or 'contacted')
      const { count: qualifiedCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .in("status", ["qualified", "contacted"]);

      // Count conversions (active subscriptions)
      const { count: conversionCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      setFunnelData({
        visitors: analysisCount || 0,
        leads: leadsCount || 0,
        qualified: qualifiedCount || 0,
        conversions: conversionCount || 0,
      });
    } catch (error) {
      console.error("Error fetching funnel data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Funil de Conversão</h1>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  const stages = defaultFunnelStages(funnelData);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Funil de Conversão</h1>
        <p className="text-muted-foreground mt-1">
          Visualize a jornada dos seus leads desde a análise até a conversão
        </p>
      </div>

      {/* Visual Funnel */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            Visualização do Funil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelVisualization stages={stages} />
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <AISuggestionsCard data={funnelData} />

      {/* Sales Performance Chart */}
      <SalesPerformanceChart />

      {/* Empty state message */}
      {funnelData.visitors === 0 && (
        <Card className="bg-card border-border panel-shadow">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado de funil disponível.</p>
            <p className="text-sm">
              Os dados aparecerão quando houver leads e conversões.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FunnelPage;
