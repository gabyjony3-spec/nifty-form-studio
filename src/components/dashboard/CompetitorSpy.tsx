import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Search, Loader2, TrendingUp, AlertCircle, Lightbulb, Trophy, Target, Lock } from "lucide-react";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { CreditExhaustedModal } from "@/components/credits/CreditExhaustedModal";

interface CompetitorInsight {
  area: string;
  competitorDoes: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

interface UserAdvantage {
  area: string;
  yourStrength: string;
  howToLeverage: string;
}

interface UserProfile {
  score: number | null;
  engagement_rate: number | null;
  post_frequency: string | null;
  strengths: string | null;
  weaknesses: string | null;
  followers: number | null;
  platform: string;
}

export function CompetitorSpy() {
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<CompetitorInsight[]>([]);
  const [userAdvantages, setUserAdvantages] = useState<UserAdvantage[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  const { credits, consumeCredit, checkCredits, showUpgradeModal, setShowUpgradeModal } = useCredits();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoadingProfile(false);
          return;
        }

        const { data: analysis, error } = await supabase
          .from("social_media_analysis")
          .select("*")
          .eq("user_id", user.id)
          .order("analyzed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user profile:", error);
        } else if (analysis) {
          setUserProfile({
            score: analysis.score,
            engagement_rate: analysis.engagement_rate,
            post_frequency: analysis.post_frequency,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            followers: analysis.followers,
            platform: analysis.platform,
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  const analyzeCompetitor = async () => {
    if (!competitorUrl.trim()) {
      toast.error("Insira o URL ou username do concorrente");
      return;
    }

    // Check credits before analyzing
    if (!checkCredits(1)) {
      return;
    }

    setIsAnalyzing(true);

    try {
      const userProfileContext = userProfile
        ? `
        Perfil do utilizador para comparação:
        - Pontuação atual: ${userProfile.score || "Não disponível"}/100
        - Taxa de engajamento: ${userProfile.engagement_rate ? `${userProfile.engagement_rate}%` : "Não disponível"}
        - Frequência de posts: ${userProfile.post_frequency || "Não disponível"}
        - Seguidores: ${userProfile.followers || "Não disponível"}
        - Pontos fortes: ${userProfile.strengths || "Não analisado ainda"}
        - Pontos fracos: ${userProfile.weaknesses || "Não analisado ainda"}
        - Plataforma principal: ${userProfile.platform || "Não especificada"}
        `
        : "Perfil do utilizador: Ainda não analisado. Faça comparação com um perfil típico do nicho.";

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: `Analise o perfil de um concorrente (${competitorUrl}) e compare com o perfil do utilizador.
          
          ${userProfileContext}
          
          Identifique:
          1. 3 áreas onde o CONCORRENTE se destaca e como o utilizador pode superar
          2. 3 áreas onde o UTILIZADOR já tem vantagem e como aproveitar isso
          
          Responda APENAS em formato JSON válido:
          {
            "insights": [
              {
                "area": "Nome da área (ex: Engajamento, Conteúdo, Bio)",
                "competitorDoes": "O que o concorrente faz bem",
                "suggestion": "Como superar o concorrente",
                "priority": "high" ou "medium" ou "low"
              }
            ],
            "userAdvantages": [
              {
                "area": "Nome da área onde o utilizador é melhor",
                "yourStrength": "O que o utilizador faz bem nesta área",
                "howToLeverage": "Como aproveitar esta vantagem competitiva"
              }
            ]
          }`,
        },
      });

      if (error) throw error;

      // Consume credit on success
      await consumeCredit(1);

      const response = data.response || data.generatedText || "";
      const jsonMatch = response.match(/\{[\s\S]*"insights"[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setInsights(parsed.insights || []);
        setUserAdvantages(parsed.userAdvantages || []);
        toast.success("Análise do concorrente concluída!");
      } else {
        throw new Error("Formato inválido");
      }
    } catch (error) {
      console.error("Error analyzing competitor:", error);
      
      // Show error instead of mock data
      toast.error("Não foi possível analisar o concorrente. Verifique a URL e tente novamente.");
      
      // Clear any previous results
      setInsights([]);
      setUserAdvantages([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-500 border-red-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      default: return "bg-green-500/20 text-green-500 border-green-500/30";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "Alta Prioridade";
      case "medium": return "Média Prioridade";
      default: return "Baixa Prioridade";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Espião de Concorrentes
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {credits === 9999 ? "∞" : credits} créditos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isLoadingProfile && (
            <div className={`p-3 rounded-lg text-sm ${userProfile ? 'bg-primary/10 border border-primary/20' : 'bg-muted'}`}>
              {userProfile ? (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span>
                    Comparando com seu perfil: <strong>{userProfile.platform}</strong> 
                    {userProfile.score && ` (Score: ${userProfile.score}/100)`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Analise suas redes sociais primeiro para comparações mais precisas</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="@username ou URL do concorrente"
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={analyzeCompetitor} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Cada análise consome 1 crédito
          </p>

          {insights.length === 0 && userAdvantages.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Eye className="h-10 w-10 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Analise seus concorrentes</p>
                <p className="text-sm text-muted-foreground">
                  Descubra o que eles fazem de melhor e onde você já tem vantagem
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {userAdvantages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Suas Vantagens Competitivas</h3>
                  </div>
                  
                  {userAdvantages.map((advantage, index) => (
                    <div key={index} className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        {advantage.area}
                      </h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <p className="text-sm">
                            <span className="font-medium">Seu ponto forte:</span> {advantage.yourStrength}
                          </p>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                          <p className="text-sm">
                            <span className="font-medium">Como aproveitar:</span> {advantage.howToLeverage}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {insights.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold">Áreas para Melhorar</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {insights.length} áreas onde o concorrente se destaca:
                  </p>
                  
                  {insights.map((insight, index) => (
                    <div key={index} className="p-4 rounded-lg border space-y-3 bg-card">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          {insight.area}
                        </h4>
                        <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                          {getPriorityLabel(insight.priority)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                          <p className="text-sm">
                            <span className="font-medium">O concorrente:</span> {insight.competitorDoes}
                          </p>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <p className="text-sm">
                            <span className="font-medium">Como superar:</span> {insight.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <CreditExhaustedModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
      />
    </>
  );
}
