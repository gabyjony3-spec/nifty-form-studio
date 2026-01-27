import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AIStats {
  leadsAnalyzed: number;
  websiteAnalysesCount: number;
  activeAutomations: number;
}

const AIAnalysisPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AIStats>({
    leadsAnalyzed: 0,
    websiteAnalysesCount: 0,
    activeAutomations: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Count lead_scores (leads analyzed by AI)
      const { count: leadsCount } = await supabase
        .from("lead_scores")
        .select("*", { count: "exact", head: true });

      // Count website_analysis
      const { count: websiteCount } = await supabase
        .from("website_analysis")
        .select("*", { count: "exact", head: true });

      // Count active automations
      const { count: automationsCount } = await supabase
        .from("automations")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      setStats({
        leadsAnalyzed: leadsCount || 0,
        websiteAnalysesCount: websiteCount || 0,
        activeAutomations: automationsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching AI stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Análises de IA</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Lead Scoring</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Análise inteligente de leads com pontuação automática
            </p>
            <div className="text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.leadsAnalyzed}
            </div>
            <p className="text-xs text-muted-foreground">Leads analisados</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Análise de Sites</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Análises de websites com IA
            </p>
            <div className="text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.websiteAnalysesCount}
            </div>
            <p className="text-xs text-muted-foreground">Análises realizadas</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Automações IA</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Processos automatizados com inteligência artificial
            </p>
            <div className="text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeAutomations}
            </div>
            <p className="text-xs text-muted-foreground">Automações ativas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <CardTitle className="text-foreground">Resumo de IA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : stats.leadsAnalyzed > 0 || stats.websiteAnalysesCount > 0 || stats.activeAutomations > 0 ? (
              <>
                {stats.leadsAnalyzed > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-foreground">
                      {stats.leadsAnalyzed} lead(s) analisado(s) pelo sistema de scoring
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Lead Scoring ativo</p>
                  </div>
                )}
                {stats.websiteAnalysesCount > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-foreground">
                      {stats.websiteAnalysesCount} website(s) analisado(s)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Análise de conteúdo</p>
                  </div>
                )}
                {stats.activeAutomations > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-foreground">
                      {stats.activeAutomations} automação(ões) ativa(s) no sistema
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Automações IA</p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma análise de IA registrada ainda
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Os dados aparecerão aqui quando houver atividade
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAnalysisPage;
