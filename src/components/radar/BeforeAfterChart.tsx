import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

interface BeforeAfterChartProps {
  metrics: {
    label: string;
    before: number;
    after: number;
  }[];
  title?: string;
}

export function BeforeAfterChart({ metrics, title = "Comparação Antes vs Depois" }: BeforeAfterChartProps) {
  // Transform data for the chart
  const chartData = metrics.map(metric => ({
    name: metric.label,
    Antes: metric.before,
    Depois: metric.after,
    growth: metric.after - metric.before,
    growthPercent: metric.before > 0 ? Math.round(((metric.after - metric.before) / metric.before) * 100) : 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-red-400">Antes: {data?.Antes}</p>
            <p className="text-green-400">Depois: {data?.Depois}</p>
            {data?.growth !== 0 && (
              <p className={data?.growth > 0 ? "text-emerald-400 font-semibold" : "text-orange-400"}>
                {data?.growth > 0 ? "+" : ""}{data?.growth} ({data?.growthPercent > 0 ? "+" : ""}{data?.growthPercent}%)
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const totalGrowth = chartData.reduce((acc, item) => acc + item.growth, 0);

  return (
    <Card className="glass-card border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-fuchsia-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20">
              <BarChart3 className="h-5 w-5 text-purple-400" />
            </div>
            <span>{title}</span>
          </div>
          {totalGrowth > 0 && (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
              <TrendingUp className="h-3 w-3 mr-1" />
              Evolução Positiva
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 to-red-600" />
            <span className="text-sm text-muted-foreground">Antes (1º Scan)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-500 to-green-500" />
            <span className="text-sm text-muted-foreground">Depois (Atual)</span>
          </div>
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barGap={8}
            >
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
              />
              <YAxis 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Before Bar - Red */}
              <Bar 
                dataKey="Antes" 
                fill="url(#redGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              >
                <LabelList 
                  dataKey="Antes" 
                  position="top" 
                  fill="#EF4444" 
                  fontSize={11}
                />
              </Bar>
              
              {/* After Bar - Green/Gold */}
              <Bar 
                dataKey="Depois" 
                fill="url(#greenGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              >
                <LabelList 
                  dataKey="Depois" 
                  position="top" 
                  fill="#10B981" 
                  fontSize={11}
                  fontWeight="bold"
                />
              </Bar>

              {/* Gradient Definitions */}
              <defs>
                <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#B91C1C" />
                </linearGradient>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Growth Summary */}
        <div className="grid grid-cols-3 gap-3">
          {chartData.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg text-center ${
                item.growth > 0 
                  ? "bg-green-500/10 border border-green-500/30"
                  : item.growth < 0
                    ? "bg-red-500/10 border border-red-500/30"
                    : "bg-muted/10 border border-muted/30"
              }`}
            >
              <p className="text-xs text-muted-foreground mb-1">{item.name}</p>
              <p className={`text-lg font-bold ${
                item.growth > 0 ? "text-green-400" : item.growth < 0 ? "text-red-400" : "text-muted-foreground"
              }`}>
                {item.growth > 0 ? "+" : ""}{item.growth}
              </p>
              {item.growthPercent !== 0 && (
                <p className={`text-xs ${item.growthPercent > 0 ? "text-green-400" : "text-red-400"}`}>
                  ({item.growthPercent > 0 ? "+" : ""}{item.growthPercent}%)
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
