import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Eye, Globe, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface AnalysisData {
  date: string;
  overall: number;
  seo: number;
  speed: number;
  conversion: number;
  structure: number;
}

interface ProblemDistribution {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  seo: "hsl(195, 100%, 47%)",
  speed: "hsl(45, 100%, 51%)",
  structure: "hsl(280, 70%, 60%)",
  conversion: "hsl(142, 71%, 45%)"
};

const AnalyticsPage = () => {
  const [historyData, setHistoryData] = useState<AnalysisData[]>([]);
  const [problemData, setProblemData] = useState<ProblemDistribution[]>([]);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    totalLeads: 0,
    conversionRate: 0,
    avgScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar histórico de análises
      const { data: analyses, error: analysesError } = await supabase
        .from("website_analysis")
        .select("*")
        .eq("user_id", user.id)
        .order("analyzed_at", { ascending: true });

      if (analysesError) throw analysesError;

      // Formatar dados para o gráfico de área
      const formattedHistory: AnalysisData[] = (analyses || []).map((a) => ({
        date: a.analyzed_at ? format(new Date(a.analyzed_at), "dd/MM", { locale: pt }) : "",
        overall: a.overall_score || 0,
        seo: a.seo_score || 0,
        speed: a.speed_score || 0,
        conversion: a.conversion_score || 0,
        structure: a.structure_score || 0
      }));
      setHistoryData(formattedHistory);

      // Calcular distribuição de problemas (pontos perdidos por categoria)
      if (analyses && analyses.length > 0) {
        const avgSeoLoss = 100 - (analyses.reduce((sum, a) => sum + (a.seo_score || 0), 0) / analyses.length);
        const avgSpeedLoss = 100 - (analyses.reduce((sum, a) => sum + (a.speed_score || 0), 0) / analyses.length);
        const avgStructureLoss = 100 - (analyses.reduce((sum, a) => sum + (a.structure_score || 0), 0) / analyses.length);
        const avgConversionLoss = 100 - (analyses.reduce((sum, a) => sum + (a.conversion_score || 0), 0) / analyses.length);

        setProblemData([
          { name: "SEO", value: Math.round(avgSeoLoss), color: COLORS.seo },
          { name: "Velocidade", value: Math.round(avgSpeedLoss), color: COLORS.speed },
          { name: "Estrutura", value: Math.round(avgStructureLoss), color: COLORS.structure },
          { name: "Conversão", value: Math.round(avgConversionLoss), color: COLORS.conversion }
        ]);

        const avgOverall = analyses.reduce((sum, a) => sum + (a.overall_score || 0), 0) / analyses.length;
        setStats(prev => ({ ...prev, avgScore: Math.round(avgOverall) }));
      }

      // Carregar total de leads
      const { count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const totalAnalyses = analyses?.length || 0;
      const totalLeads = leadsCount || 0;
      const conversionRate = totalAnalyses > 0 ? ((totalLeads / totalAnalyses) * 100).toFixed(1) : 0;

      setStats(prev => ({
        ...prev,
        totalAnalyses,
        totalLeads,
        conversionRate: Number(conversionRate)
      }));

    } catch (error) {
      console.error("Erro ao carregar analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 font-medium">{payload[0].name}</p>
          <p className="text-gray-700 text-sm">{payload[0].value}% pontos perdidos</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Analytics</h1>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-card border-border panel-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Análises
              </CardTitle>
              <Globe className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalAnalyses}</div>
              <p className="text-xs text-muted-foreground">Sites analisados</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card border-border panel-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Leads
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground">Contactos capturados</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card border-border panel-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Conversão
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">Análises → Leads</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card border-border panel-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Score Médio
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.avgScore}%</div>
              <p className="text-xs text-muted-foreground">Média geral dos sites</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Área - Histórico de Scores */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-card border-border panel-shadow">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolução dos Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : historyData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <Globe className="h-12 w-12 mb-3 opacity-50" />
                  <p>Nenhuma análise encontrada</p>
                  <p className="text-sm">Execute análises para ver a evolução</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.seo} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={COLORS.seo} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSeo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.seo} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.seo} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="overall"
                      name="Geral"
                      stroke={COLORS.seo}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOverall)"
                    />
                    <Area
                      type="monotone"
                      dataKey="seo"
                      name="SEO"
                      stroke={COLORS.speed}
                      strokeWidth={1.5}
                      fillOpacity={0}
                    />
                    <Area
                      type="monotone"
                      dataKey="speed"
                      name="Velocidade"
                      stroke={COLORS.structure}
                      strokeWidth={1.5}
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Gráfico Donut - Distribuição de Problemas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-card border-border panel-shadow">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Distribuição de Problemas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : problemData.length === 0 || problemData.every(p => p.value === 0) ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                  <p>Sem dados suficientes</p>
                  <p className="text-sm">Execute análises para ver a distribuição</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={problemData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={false}
                    >
                      {problemData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      layout="horizontal"
                      align="center"
                      verticalAlign="bottom"
                      wrapperStyle={{ paddingTop: "20px" }}
                      formatter={(value) => (
                        <span className="text-foreground text-sm">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Info sobre os gráficos */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="bg-card border-border panel-shadow">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-foreground mb-2">📈 Evolução dos Scores</h4>
                <p className="text-sm text-muted-foreground">
                  Este gráfico mostra como os scores dos seus sites evoluíram ao longo do tempo. 
                  Acompanhe melhorias e identifique tendências.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">🎯 Distribuição de Problemas</h4>
                <p className="text-sm text-muted-foreground">
                  Veja onde os seus sites mais perdem pontos. Categorias com maior percentagem 
                  representam as áreas que mais precisam de atenção.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;
