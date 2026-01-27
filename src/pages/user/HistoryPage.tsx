import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Globe, Eye, TrendingUp, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface AnalysisHistory {
  id: string;
  url: string;
  overall_score: number | null;
  seo_score: number | null;
  speed_score: number | null;
  conversion_score: number | null;
  structure_score: number | null;
  analyzed_at: string | null;
}

const HistoryPage = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("website_analysis")
        .select("id, url, overall_score, seo_score, speed_score, conversion_score, structure_score, analyzed_at")
        .eq("user_id", user.id)
        .order("analyzed_at", { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "bg-muted text-muted-foreground";
    if (score >= 80) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Histórico de Análises</h1>
          <p className="text-muted-foreground">Acompanhe a evolução dos seus sites ao longo do tempo</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma análise encontrada</h3>
            <p className="text-muted-foreground mb-4">Comece por analisar o seu primeiro website</p>
            <Button variant="default" onClick={() => window.location.href = "/dashboard/analysis"}>
              Analisar Website
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis, index) => (
            <motion.div
              key={analysis.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 panel-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium text-foreground truncate">
                        {analysis.url}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analysis.analyzed_at && format(new Date(analysis.analyzed_at), "d MMM yyyy 'às' HH:mm", { locale: pt })}
                      </p>
                    </div>
                    <Badge className={`${getScoreColor(analysis.overall_score)} border`}>
                      {analysis.overall_score || 0}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="text-muted-foreground">SEO</span>
                      <span className="font-medium text-foreground">{analysis.seo_score || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="text-muted-foreground">Velocidade</span>
                      <span className="font-medium text-foreground">{analysis.speed_score || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="text-muted-foreground">Conversão</span>
                      <span className="font-medium text-foreground">{analysis.conversion_score || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="text-muted-foreground">Estrutura</span>
                      <span className="font-medium text-foreground">{analysis.structure_score || 0}%</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => navigate(`/dashboard/analysis?id=${analysis.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
