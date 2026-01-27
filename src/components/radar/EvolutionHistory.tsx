import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoryEntry {
  id: string;
  created_at: string;
  score: number | null;
  current_followers: number | null;
  posts_count: number | null;
}

interface EvolutionHistoryProps {
  userId: string;
  targetUrl?: string;
}

export function EvolutionHistory({ userId, targetUrl }: EvolutionHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [userId, targetUrl]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("history_analysis")
        .select("id, created_at, score, current_followers, posts_count")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (targetUrl) {
        query = query.eq("target_url", targetUrl);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFollowers = (count: number | null): string => {
    if (!count) return "N/A";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const calculateChange = (current: number | null, previous: number | null): { value: number; percentage: number } | null => {
    if (!current || !previous) return null;
    const value = current - previous;
    const percentage = ((current - previous) / previous) * 100;
    return { value, percentage };
  };

  const chartData = history.map((entry, index) => ({
    date: format(new Date(entry.created_at), "dd/MM", { locale: ptBR }),
    score: entry.score || 0,
    followers: entry.current_followers || 0,
    posts: entry.posts_count || 0,
    fullDate: format(new Date(entry.created_at), "dd/MM/yyyy", { locale: ptBR }),
  }));

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando histórico...
        </CardContent>
      </Card>
    );
  }

  if (history.length < 2) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            Evolução do Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">
            Faça pelo menos 2 análises para ver a evolução do perfil ao longo do tempo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const latestEntry = history[history.length - 1];
  const previousEntry = history[history.length - 2];
  const scoreChange = calculateChange(latestEntry.score, previousEntry.score);
  const followersChange = calculateChange(latestEntry.current_followers, previousEntry.current_followers);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          Evolução do Perfil
          <Badge variant="outline" className="ml-auto border-cyan-500/50 text-cyan-300 text-xs">
            {history.length} análises
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="#888" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#888" 
                fontSize={12}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(34,211,238,0.3)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value: number, name: string) => {
                  if (name === "score") return [`${value}/100`, "Score"];
                  return [value, name];
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ fill: "#22d3ee", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#22d3ee" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Changes */}
        <div className="grid grid-cols-2 gap-4">
          {/* Score Change */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20"
          >
            <p className="text-xs text-muted-foreground mb-1">Última Mudança de Score</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-cyan-300">
                {latestEntry.score || 0}
              </span>
              {scoreChange && (
                <Badge className={`text-xs ${scoreChange.value >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {scoreChange.value >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {scoreChange.value >= 0 ? '+' : ''}{scoreChange.value} ({scoreChange.percentage.toFixed(0)}%)
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Followers Change */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/20"
          >
            <p className="text-xs text-muted-foreground mb-1">Evolução Seguidores</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-purple-300">
                {formatFollowers(latestEntry.current_followers)}
              </span>
              {followersChange && (
                <Badge className={`text-xs ${followersChange.value >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {followersChange.value >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {followersChange.value >= 0 ? '+' : ''}{formatFollowers(followersChange.value)}
                </Badge>
              )}
            </div>
          </motion.div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 text-muted-foreground font-medium">Data</th>
                <th className="text-center py-2 text-muted-foreground font-medium">Score</th>
                <th className="text-center py-2 text-muted-foreground font-medium">Seguidores</th>
                <th className="text-center py-2 text-muted-foreground font-medium">Posts</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Mudança</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(-5).reverse().map((entry, index, arr) => {
                const prev = arr[index + 1];
                const change = prev ? calculateChange(entry.score, prev.score) : null;
                
                return (
                  <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2">{format(new Date(entry.created_at), "dd/MM/yyyy", { locale: ptBR })}</td>
                    <td className="text-center py-2">
                      <Badge variant="outline" className="text-cyan-300">{entry.score || 0}</Badge>
                    </td>
                    <td className="text-center py-2">{formatFollowers(entry.current_followers)}</td>
                    <td className="text-center py-2">{entry.posts_count || "N/A"}</td>
                    <td className="text-right py-2">
                      {change ? (
                        <span className={`flex items-center justify-end gap-1 ${change.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {change.value >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {change.value >= 0 ? '+' : ''}{change.value}
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center justify-end gap-1">
                          <Minus className="h-3 w-3" /> ---
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
