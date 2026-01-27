import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, ArrowRight, Sparkles, Award, Zap } from "lucide-react";
import { motion } from "framer-motion";
interface PerformanceComparisonProps {
  userId?: string;
}
interface AnalysisData {
  score: number;
  followers: number;
  engagement_rate: number;
  analyzed_at: string;
  platform: string;
}
export function PerformanceComparison({
  userId
}: PerformanceComparisonProps) {
  const [firstAnalysis, setFirstAnalysis] = useState<AnalysisData | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisData | null>(null);
  const [historyData, setHistoryData] = useState<{
    date: string;
    score: number;
    followers: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchAnalysisHistory = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        // Fetch all analyses ordered by date
        const {
          data: analyses
        } = await supabase.from("social_media_analysis").select("score, followers, engagement_rate, analyzed_at, platform").eq("user_id", userId).order("analyzed_at", {
          ascending: true
        });
        if (analyses && analyses.length > 0) {
          setFirstAnalysis(analyses[0] as AnalysisData);
          setLatestAnalysis(analyses[analyses.length - 1] as AnalysisData);

          // Transform data for chart
          const chartData = analyses.map(a => ({
            date: new Date(a.analyzed_at).toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "short"
            }),
            score: a.score || 0,
            followers: a.followers || 0
          }));
          setHistoryData(chartData);
        }
      } catch (error) {
        console.error("Error fetching analysis history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysisHistory();
  }, [userId]);
  const calculateChange = (first: number | undefined, latest: number | undefined) => {
    if (!first || !latest) return {
      value: 0,
      positive: true
    };
    const change = latest - first;
    return {
      value: change,
      positive: change >= 0
    };
  };
  const scoreChange = calculateChange(firstAnalysis?.score, latestAnalysis?.score);
  const followersChange = calculateChange(firstAnalysis?.followers, latestAnalysis?.followers);
  const engagementChange = calculateChange(firstAnalysis?.engagement_rate, latestAnalysis?.engagement_rate);
  if (loading) {
    return <Card className="glass-card">
        <CardContent className="py-8 text-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-32 w-full bg-muted rounded" />
          </div>
        </CardContent>
      </Card>;
  }
  if (!firstAnalysis || !latestAnalysis) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-cyan-400" />
            Comparativo de Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/50 animate-pulse" />
            </div>
            <p className="text-muted-foreground">
              Faça a sua primeira análise para ver a evolução do seu perfil!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return <div className="space-y-6">
      {/* Before/After Comparison Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Score Comparison */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }}>
          <Card className="glass-card border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Score da IA
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center justify-between gap-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{firstAnalysis.score || 0}</p>
                  <p className="text-xs text-muted-foreground">Antes</p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{latestAnalysis.score || 0}</p>
                  <p className="text-xs text-muted-foreground">Agora</p>
                </div>
              </div>
              <div className="mt-3 flex justify-center">
                <Badge variant={scoreChange.positive ? "default" : "destructive"} className={scoreChange.positive ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}>
                  {scoreChange.positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {scoreChange.positive ? "+" : ""}{scoreChange.value} pontos
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Followers Comparison */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }}>
          <Card className="glass-card border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Seguidores
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center justify-between gap-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">
                    {(firstAnalysis.followers || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Antes</p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {(latestAnalysis.followers || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Agora</p>
                </div>
              </div>
              <div className="mt-3 flex justify-center">
                <Badge variant={followersChange.positive ? "default" : "destructive"} className={followersChange.positive ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}>
                  {followersChange.positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {followersChange.positive ? "+" : ""}{followersChange.value.toLocaleString()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Engagement Comparison */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }}>
          <Card className="glass-card border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center justify-between gap-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">
                    {(firstAnalysis.engagement_rate || 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Antes</p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {(latestAnalysis.engagement_rate || 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Agora</p>
                </div>
              </div>
              <div className="mt-3 flex justify-center">
                <Badge variant={engagementChange.positive ? "default" : "destructive"} className={engagementChange.positive ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}>
                  {engagementChange.positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {engagementChange.positive ? "+" : ""}{engagementChange.value.toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Timeline Chart */}
      {historyData.length > 1 && <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.4
    }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Evolução ao Longo do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis dataKey="date" tick={{
                  fontSize: 12,
                  fill: 'hsl(var(--muted-foreground))'
                }} />
                    <YAxis tick={{
                  fontSize: 12,
                  fill: 'hsl(var(--muted-foreground))'
                }} domain={[0, 100]} />
                    <Tooltip contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} labelStyle={{
                  color: 'hsl(var(--foreground))'
                }} />
                    <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorScore)" name="Score" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                A sua evolução desde a primeira análise até hoje
              </p>
            </CardContent>
          </Card>
        </motion.div>}
    </div>;
}