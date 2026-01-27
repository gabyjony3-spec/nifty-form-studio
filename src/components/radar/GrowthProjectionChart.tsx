import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { TrendingUp, Target, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface GrowthProjectionChartProps {
  currentFollowers: number;
  followerGoal?: number;
  scoreImpact?: number; // How much the profile score affects growth
}

export function GrowthProjectionChart({
  currentFollowers,
  followerGoal,
  scoreImpact = 1.2,
}: GrowthProjectionChartProps) {
  // Calculate baseline and optimized growth projections for 30 days
  const generateProjectionData = () => {
    const data = [];
    const baseGrowthRate = 0.005; // 0.5% daily baseline growth
    const optimizedGrowthRate = baseGrowthRate * scoreImpact; // Growth if following AI suggestions
    
    let baselineFollowers = currentFollowers;
    let optimizedFollowers = currentFollowers;
    
    for (let day = 0; day <= 30; day += 5) {
      data.push({
        day: `Dia ${day}`,
        baseline: Math.round(baselineFollowers),
        optimized: Math.round(optimizedFollowers),
        goal: followerGoal,
      });
      
      // Apply growth for next 5 days
      for (let i = 0; i < 5; i++) {
        baselineFollowers *= (1 + baseGrowthRate);
        optimizedFollowers *= (1 + optimizedGrowthRate);
      }
    }
    
    return data;
  };

  const data = generateProjectionData();
  const projectedGain = data[data.length - 1].optimized - currentFollowers;
  const percentageGain = ((projectedGain / currentFollowers) * 100).toFixed(1);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <TrendingUp className="h-5 w-5" />
            Projeção de Crescimento
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-0">
            +{percentageGain}% em 30 dias
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                stroke="#6b7280" 
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280" 
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === 'optimized' ? 'Com IA' : 'Crescimento Base'
                ]}
              />
              <Area
                type="monotone"
                dataKey="baseline"
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorBaseline)"
              />
              <Area
                type="monotone"
                dataKey="optimized"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#colorOptimized)"
              />
              {followerGoal && (
                <Line
                  type="monotone"
                  dataKey="goal"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="10 5"
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-gray-500 rounded" style={{ border: '1px dashed' }} />
            <span className="text-muted-foreground">Crescimento Base</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-cyan-500 rounded" />
            <span className="text-cyan-400">Seguindo Dicas da IA</span>
          </div>
          {followerGoal && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500 rounded" style={{ border: '1px dashed' }} />
              <span className="text-green-400">Meta</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3 pt-2"
        >
          <div className="p-3 rounded-lg bg-muted/10 text-center">
            <p className="text-2xl font-bold text-cyan-400">
              +{projectedGain.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Seguidores projetados</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/10 text-center">
            <p className="text-2xl font-bold text-green-400">
              {data[data.length - 1].optimized.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total em 30 dias</p>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}