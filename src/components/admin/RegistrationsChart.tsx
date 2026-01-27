import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { pt } from "date-fns/locale";

interface UserData {
  id: string;
  created_at: string;
  isPro: boolean;
}

interface RegistrationsChartProps {
  users: UserData[];
  days?: number;
}

const RegistrationsChart = ({ users, days = 14 }: RegistrationsChartProps) => {
  const chartData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    return dateRange.map((date) => {
      const freeCount = users.filter(
        (u) => !u.isPro && isSameDay(new Date(u.created_at), date)
      ).length;
      
      const proCount = users.filter(
        (u) => u.isPro && isSameDay(new Date(u.created_at), date)
      ).length;
      
      return {
        date: format(date, "dd/MM", { locale: pt }),
        free: freeCount,
        pro: proCount,
      };
    });
  }, [users, days]);

  const hasData = users.length > 0;

  return (
    <Card className="bg-card border-border panel-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Novos Registos ({days} dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend 
                wrapperStyle={{ fontSize: "12px" }}
                formatter={(value) => (
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>
                    {value === "free" ? "Grátis/Trial" : "Pro"}
                  </span>
                )}
              />
              <Bar 
                dataKey="free" 
                fill="hsl(var(--accent))" 
                radius={[4, 4, 0, 0]}
                name="free"
              />
              <Bar 
                dataKey="pro" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="pro"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
            Sem dados de registos
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegistrationsChart;
