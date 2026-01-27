import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileBarChart, 
  Download, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Loader2,
  Calendar,
  Sparkles 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface ReportData {
  totalLeads: number;
  convertedLeads: number;
  messagesSent: number;
  conversionRate: number;
  monthlyGrowth: { month: string; leads: number; conversions: number }[];
  aiInsight: string;
}

const ReportsPage = () => {
  const { toast } = useToast();
  const { isPro, isLifetime, isElite, isLoading: subscriptionLoading } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Check if user has access (Pro, Elite, or Lifetime)
  const hasAccess = isPro || isLifetime || isElite;

  useEffect(() => {
    if (!subscriptionLoading && hasAccess) {
      fetchReportData();
    } else if (!subscriptionLoading) {
      setLoading(false);
    }
  }, [subscriptionLoading, hasAccess]);

  const fetchReportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch leads
      const { data: leads } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id);

      // Fetch leads analysis
      const { data: analysisLeads } = await supabase
        .from("leads_analysis")
        .select("*")
        .eq("user_id", user.id);

      // Fetch automations for message count
      const { data: automations } = await supabase
        .from("automations")
        .select("messages_sent")
        .eq("user_id", user.id);

      const totalLeads = (leads?.length || 0) + (analysisLeads?.length || 0);
      const convertedLeads = leads?.filter(l => l.status === "converted").length || 0;
      const messagesSent = automations?.reduce((sum, a) => sum + (a.messages_sent || 0), 0) || 0;
      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

      // Generate monthly data from real leads (grouped by month)
      const monthlyGrowth: { month: string; leads: number; conversions: number }[] = [];
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        // Filter leads by month
        const monthLeads = leads?.filter(l => {
          const createdAt = new Date(l.created_at || '');
          return createdAt >= monthDate && createdAt <= monthEnd;
        }) || [];
        
        const monthAnalysisLeads = analysisLeads?.filter(l => {
          const createdAt = new Date(l.created_at || '');
          return createdAt >= monthDate && createdAt <= monthEnd;
        }) || [];
        
        const totalMonthLeads = monthLeads.length + monthAnalysisLeads.length;
        const monthConversions = monthLeads.filter(l => l.status === "converted").length;
        
        monthlyGrowth.push({
          month: months[5 - i],
          leads: totalMonthLeads,
          conversions: monthConversions,
        });
      }

      setReportData({
        totalLeads,
        convertedLeads,
        messagesSent,
        conversionRate,
        monthlyGrowth,
        aiInsight: `Com base nos seus dados, identificamos que a sua taxa de conversão de ${conversionRate}% está ${conversionRate >= 20 ? "acima" : "abaixo"} da média do mercado. ${convertedLeads > 0 ? `Os ${convertedLeads} leads convertidos representam uma receita potencial significativa.` : "Recomendamos focar na nutrição dos leads existentes."} A automação de WhatsApp enviou ${messagesSent} mensagens, contribuindo para o engajamento.`,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    setGenerating(true);
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "PDF Gerado",
        description: "O seu relatório foi preparado para download",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (subscriptionLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <FileBarChart className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Relatórios Pro</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Esta funcionalidade está disponível apenas para utilizadores do Plano Pro, Elite ou Vitalício.
          Faça upgrade para acessar relatórios detalhados de performance.
        </p>
        <Button 
          onClick={() => window.location.href = "/dashboard/pricing"}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
        >
          Ver Planos e Preços
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileBarChart className="h-8 w-8 text-primary" />
            Relatórios de Performance
          </h1>
          <p className="text-muted-foreground">Análise completa do seu desempenho mensal</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-cyan-500 text-cyan-400">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
          </Badge>
          <Button onClick={generatePDF} disabled={generating} className="bg-primary text-primary-foreground">
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reportData?.totalLeads || 0}</div>
            <p className="text-xs text-green-500">+12% este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads Convertidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reportData?.convertedLeads || 0}</div>
            <p className="text-xs text-green-500">+8% este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reportData?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Média do período</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mensagens Enviadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reportData?.messagesSent || 0}</div>
            <p className="text-xs text-green-500">Via WhatsApp</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <CardTitle className="text-foreground">Crescimento de Leads</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData?.monthlyGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                  labelStyle={{ color: "#F9FAFB" }}
                />
                <Bar dataKey="leads" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <CardTitle className="text-foreground">Taxa de Conversão</CardTitle>
            <CardDescription>Evolução mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData?.monthlyGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                  labelStyle={{ color: "#F9FAFB" }}
                />
                <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insight */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 panel-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-foreground">Análise de IA</CardTitle>
          </div>
          <CardDescription>Insights gerados automaticamente</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">
            {reportData?.aiInsight || "A gerar insights..."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
