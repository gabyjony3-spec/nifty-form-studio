import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Euro, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfDay, endOfDay, subMonths, startOfYear } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

type TimeFilter = "7d" | "30d" | "6m" | "1y";

interface ChartDataPoint {
  date: string;
  revenue: number;
  subscriptions: number;
}

const planPrices: Record<string, number> = {
  basic: 19,
  advanced: 49,
  pro_ai: 97,
};

export function SalesPerformanceChart() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("30d");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ revenue: 0, subscriptions: 0 });

  useEffect(() => {
    fetchChartData();
  }, [timeFilter]);

  const getDateRange = () => {
    const now = new Date();
    switch (timeFilter) {
      case "7d":
        return { start: subDays(now, 7), end: now };
      case "30d":
        return { start: subDays(now, 30), end: now };
      case "6m":
        return { start: subMonths(now, 6), end: now };
      case "1y":
        return { start: startOfYear(now), end: now };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select("created_at, plan, status")
        .gte("created_at", startOfDay(start).toISOString())
        .lte("created_at", endOfDay(end).toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const groupedData: Record<string, { revenue: number; subscriptions: number }> = {};
      
      // Initialize all dates in range
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      for (let i = 0; i <= daysDiff; i++) {
        const date = format(subDays(end, daysDiff - i), "yyyy-MM-dd");
        groupedData[date] = { revenue: 0, subscriptions: 0 };
      }

      // Fill with actual data
      let totalRevenue = 0;
      let totalSubs = 0;
      
      subscriptions?.forEach((sub) => {
        const date = format(new Date(sub.created_at), "yyyy-MM-dd");
        const price = planPrices[sub.plan || "basic"] || 0;
        
        if (groupedData[date]) {
          groupedData[date].revenue += price;
          groupedData[date].subscriptions += 1;
        }
        
        totalRevenue += price;
        totalSubs += 1;
      });

      // Convert to array for chart
      const chartArray = Object.entries(groupedData).map(([date, data]) => ({
        date: format(new Date(date), timeFilter === "7d" ? "EEE" : "dd/MM", { locale: pt }),
        revenue: data.revenue,
        subscriptions: data.subscriptions,
      }));

      setChartData(chartArray);
      setTotals({ revenue: totalRevenue, subscriptions: totalSubs });
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterButtons: { value: TimeFilter; label: string }[] = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "6m", label: "6 meses" },
    { value: "1y", label: "Este ano" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-xs flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Receita:</span>
              <span className="font-medium text-foreground">€{payload[0]?.value || 0}</span>
            </p>
            <p className="text-xs flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Assinaturas:</span>
              <span className="font-medium text-foreground">{payload[1]?.value || 0}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            Performance de Vendas
          </CardTitle>
          
          {/* Filter buttons */}
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {filterButtons.map((btn) => (
              <Button
                key={btn.value}
                variant={timeFilter === btn.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeFilter(btn.value)}
                className={`text-xs h-7 px-3 ${
                  timeFilter === btn.value 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Totals */}
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Receita Total</p>
              <p className="text-lg font-bold text-foreground">€{totals.revenue}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Novas Assinaturas</p>
              <p className="text-lg font-bold text-foreground">{totals.subscriptions}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {loading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(195, 100%, 50%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(195, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="subsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(150, 100%, 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(150, 100%, 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" strokeOpacity={0.5} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: 10 }}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">
                    {value === "revenue" ? "Receita (€)" : "Assinaturas"}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(195, 100%, 50%)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                name="revenue"
              />
              <Area
                type="monotone"
                dataKey="subscriptions"
                stroke="hsl(150, 100%, 40%)"
                strokeWidth={2}
                fill="url(#subsGradient)"
                name="subscriptions"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
