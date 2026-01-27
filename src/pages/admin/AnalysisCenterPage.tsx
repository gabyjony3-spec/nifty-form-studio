import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Globe, 
  Instagram, 
  Youtube, 
  Loader2, 
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalysisResult {
  id: string;
  url: string;
  overall_score: number;
  seo_score: number;
  speed_score: number;
  structure_score: number;
  conversion_score: number;
  analyzed_at: string;
}

const AnalysisCenterPage = () => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<"website" | "social">("website");
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const [currentResult, setCurrentResult] = useState<any>(null);

  const handleWebsiteAnalysis = async () => {
    if (!websiteUrl) {
      toast.error("Insira uma URL válida");
      return;
    }

    setAnalyzing(true);
    setCurrentResult(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('analyze-website', {
        body: { url: websiteUrl, force_refresh: true },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      setCurrentResult(data);
      toast.success("Análise concluída!");
      
      // Add to recent
      setRecentAnalyses(prev => [{
        id: data.id,
        url: data.url,
        overall_score: data.overall_score,
        seo_score: data.seo_score,
        speed_score: data.speed_score,
        structure_score: data.structure_score,
        conversion_score: data.conversion_score,
        analyzed_at: data.analyzed_at,
      }, ...prev.slice(0, 9)]);
      
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Erro ao analisar website");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSocialAnalysis = async () => {
    if (!socialUrl) {
      toast.error("Insira uma URL de perfil válida");
      return;
    }

    setAnalyzing(true);
    setAnalysisType("social");
    setCurrentResult(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Use unified analyze-social function
      const { data, error } = await supabase.functions.invoke('analyze-social', {
        body: { url: socialUrl },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      // Transform result to match display format
      const transformedResult = {
        url: socialUrl,
        platform: data.platform,
        username: data.username,
        overall_score: data.score,
        seo_score: data.breakdown?.bio || 0,
        speed_score: data.breakdown?.visual || 0,
        structure_score: data.breakdown?.engagement || 0,
        conversion_score: data.breakdown?.consistency || 0,
        full_report: {
          vision_overview: `Perfil de ${data.platform}: @${data.username} no nicho de ${data.niche_detected}`,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
          suggestions: data.suggestions,
          niche_detected: data.niche_detected,
          followers: data.followers,
          engagement_rate: data.engagement_rate,
          best_posting_times: data.best_posting_times,
        },
        analyzed_at: new Date().toISOString(),
        fromCache: false,
      };

      setCurrentResult(transformedResult);
      toast.success(`Análise de ${data.platform} concluída! Score: ${data.score}%`);
      
    } catch (error: any) {
      console.error("Social analysis error:", error);
      toast.error(error.message || "Erro ao analisar perfil social");
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/20";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20";
    if (score >= 40) return "bg-orange-500/10 border-orange-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Search className="h-8 w-8 text-primary" />
          Centro de Análises Estratégicas
        </h1>
        <p className="text-muted-foreground">
          Realize análises internas de websites e redes sociais
        </p>
      </div>

      {/* Analysis Input Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Website Analysis */}
        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Análise de Website</CardTitle>
            </div>
            <CardDescription>
              Analise qualquer website e receba insights de SEO, velocidade e conversão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://exemplo.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleWebsiteAnalysis}
                disabled={analyzing}
                className="gap-2"
              >
                {analyzing && analysisType === "website" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                Analisar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Analysis */}
        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              <CardTitle className="text-foreground">Análise de Redes Sociais</CardTitle>
            </div>
            <CardDescription>
              Analise perfis de Instagram, YouTube, TikTok, LinkedIn ou Facebook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://instagram.com/perfil"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleSocialAnalysis}
                disabled={analyzing}
                variant="secondary"
                className="gap-2"
              >
                {analyzing && analysisType === "social" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                Analisar
              </Button>
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">Instagram</Badge>
              <Badge variant="outline" className="text-xs">YouTube</Badge>
              <Badge variant="outline" className="text-xs">TikTok</Badge>
              <Badge variant="outline" className="text-xs">LinkedIn</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Result */}
      {currentResult && (
        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <CardTitle className="text-foreground">Resultado da Análise</CardTitle>
              </div>
              <Badge variant={currentResult.fromCache ? "secondary" : "default"}>
                {currentResult.fromCache ? "Cache (24h)" : "Nova Análise"}
              </Badge>
            </div>
            <CardDescription>{currentResult.url}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className={`p-4 rounded-lg border ${getScoreBg(currentResult.overall_score)}`}>
                <p className="text-xs text-muted-foreground mb-1">Score Geral</p>
                <p className={`text-3xl font-bold ${getScoreColor(currentResult.overall_score)}`}>
                  {currentResult.overall_score}%
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${getScoreBg(currentResult.seo_score)}`}>
                <p className="text-xs text-muted-foreground mb-1">SEO</p>
                <p className={`text-2xl font-bold ${getScoreColor(currentResult.seo_score)}`}>
                  {currentResult.seo_score}%
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${getScoreBg(currentResult.speed_score)}`}>
                <p className="text-xs text-muted-foreground mb-1">Velocidade</p>
                <p className={`text-2xl font-bold ${getScoreColor(currentResult.speed_score)}`}>
                  {currentResult.speed_score}%
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${getScoreBg(currentResult.structure_score)}`}>
                <p className="text-xs text-muted-foreground mb-1">Estrutura</p>
                <p className={`text-2xl font-bold ${getScoreColor(currentResult.structure_score)}`}>
                  {currentResult.structure_score}%
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${getScoreBg(currentResult.conversion_score)}`}>
                <p className="text-xs text-muted-foreground mb-1">Conversão</p>
                <p className={`text-2xl font-bold ${getScoreColor(currentResult.conversion_score)}`}>
                  {currentResult.conversion_score}%
                </p>
              </div>
            </div>

            {/* Vision Overview */}
            {currentResult.full_report?.vision_overview && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">Visão Geral</p>
                <p className="text-sm text-muted-foreground">
                  {currentResult.full_report.vision_overview}
                </p>
              </div>
            )}

            {/* Critical Alerts */}
            {currentResult.full_report?.critical_alerts?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Alertas Críticos
                </p>
                <div className="space-y-2">
                  {currentResult.full_report.critical_alerts.map((alert: any, idx: number) => (
                    <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm font-medium text-red-400">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <Card className="bg-card border-border panel-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-foreground">Análises Recentes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAnalyses.map((analysis) => (
                <div 
                  key={analysis.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {analysis.url}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(analysis.analyzed_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded ${getScoreBg(analysis.overall_score)}`}>
                      <span className={`text-sm font-bold ${getScoreColor(analysis.overall_score)}`}>
                        {analysis.overall_score}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisCenterPage;
