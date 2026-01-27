import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  ArrowLeft, User, Target, TrendingUp, CheckCircle2, 
  Clock, Lightbulb, Instagram, Youtube, Linkedin, 
  Camera, Sparkles, Download, Share2, RefreshCw, Loader2
} from "lucide-react";
import { BeforeAfterComparison } from "@/components/radar/BeforeAfterComparison";
import { BioVersionsCard } from "@/components/radar/BioVersionsCard";
import { SalesFunnelVisualization } from "@/components/radar/SalesFunnelVisualization";
import { MonthlyContentPlan } from "@/components/radar/MonthlyContentPlan";
import { ProfitableHighlights } from "@/components/radar/ProfitableHighlights";
import { NameOptimization } from "@/components/radar/NameOptimization";
import { ContentPillarsGenerator } from "@/components/radar/ContentPillarsGenerator";
import { PhotoAnalysisCard } from "@/components/radar/PhotoAnalysisCard";
import { EvolutionHistory } from "@/components/radar/EvolutionHistory";
import ScoreCircle from "@/components/analysis/ScoreCircle";
import { SmartBrandingCard } from "@/components/radar/SmartBrandingCard";
import { AuthorityLevelBadge, getAuthorityLevel, AuthorityLevel } from "@/components/radar/AuthorityLevelBadge";
import { ConfettiCelebration } from "@/components/radar/ConfettiCelebration";
import { LevelUpModal } from "@/components/radar/LevelUpModal";
import { RealTimeProgressBar } from "@/components/radar/RealTimeProgressBar";
import { BeforeAfterChart } from "@/components/radar/BeforeAfterChart";

interface AnalysisData {
  id: string;
  user_id: string;
  target_url: string | null;
  platform: string | null;
  score: number | null;
  niche_detected: string | null;
  profile_score_breakdown: Record<string, number> | null;
  current_followers: number | null;
  following_count: number | null;
  posts_count: number | null;
  follower_goal: number | null;
  best_posting_times: any;
  weaknesses: string | null;
  strengths: string | null;
  suggestions: string | null;
  photo_analysis?: any;
  bio_analysis?: any;
  content_suggestions?: any;
  urgent_improvements?: string[];
  strategic_adjustments?: any;
  sales_funnel?: any;
  visual_identity?: any;
  monthly_content_plan?: any;
  highlight_suggestions?: any[];
  profile_data?: any;
  created_at: string;
}

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function ProfileResultPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [firstAnalysis, setFirstAnalysis] = useState<AnalysisData | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [previousLevel, setPreviousLevel] = useState<AuthorityLevel>("bronze");
  const [currentLevel, setCurrentLevel] = useState<AuthorityLevel>("bronze");
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    loadAnalysisData();
  }, [analysisId]);

  useEffect(() => {
    if (data?.score !== undefined) {
      const newScore = data.score || 0;
      setCurrentScore(newScore);
      setCurrentLevel(getAuthorityLevel(newScore));
    }
  }, [data?.score]);

  // Load first analysis for comparison
  useEffect(() => {
    if (data?.user_id && data?.target_url) {
      loadFirstAnalysis();
    }
  }, [data?.user_id, data?.target_url]);

  const loadFirstAnalysis = async () => {
    if (!data?.user_id || !data?.target_url) return;
    
    try {
      const { data: firstData } = await supabase
        .from("history_analysis")
        .select("*")
        .eq("user_id", data.user_id)
        .ilike("target_url", `%${extractUsernameRaw(data.target_url)}%`)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (firstData && firstData.id !== data.id) {
        setFirstAnalysis(firstData as unknown as AnalysisData);
        setPreviousLevel(getAuthorityLevel(firstData.score || 0));
      }
    } catch (error) {
      console.log("No previous analysis found for comparison");
    }
  };

  const extractUsernameRaw = (url: string | null): string => {
    if (!url) return "";
    const match = url.match(/(?:@)?([a-zA-Z0-9._-]+)(?:\/)?$/);
    return match ? match[1] : "";
  };

  const handleScoreUpdate = (newScore: number) => {
    const newLevel = getAuthorityLevel(newScore);
    const oldLevel = currentLevel;

    // Check if level improved
    const levelOrder: AuthorityLevel[] = ["bronze", "prata", "ouro", "diamante"];
    if (levelOrder.indexOf(newLevel) > levelOrder.indexOf(oldLevel)) {
      setPreviousLevel(oldLevel);
      setShowConfetti(true);
      setShowLevelUpModal(true);
    }

    setCurrentScore(newScore);
    setCurrentLevel(newLevel);
  };

  const loadAnalysisData = async () => {
    if (!analysisId) {
      toast.error("ID de análise não encontrado");
      navigate("/dashboard/radar");
      return;
    }

    try {
      const { data: analysis, error } = await supabase
        .from("history_analysis")
        .select("*")
        .eq("id", analysisId)
        .single();

      if (error) throw error;
      
      setData(analysis as unknown as AnalysisData);
    } catch (error) {
      console.error("Error loading analysis:", error);
      toast.error("Erro ao carregar análise");
      navigate("/dashboard/radar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!data?.target_url || !data?.platform) return;
    
    setReanalyzing(true);
    try {
      const platform = data.platform.toLowerCase();
      const username = extractUsername(data.target_url).replace("@", "");
      
      const { data: newAnalysis, error } = await supabase.functions.invoke(`analyze-${platform}`, {
        body: { 
          username, 
          profileUrl: data.target_url 
        }
      });

      if (error) throw error;

      if (newAnalysis?.analysisId) {
        toast.success("Nova análise concluída!");
        navigate(`/dashboard/profile-result/${newAnalysis.analysisId}`);
      } else {
        // Reload current analysis if no new ID returned
        loadAnalysisData();
        toast.success("Análise atualizada!");
      }
    } catch (error) {
      console.error("Reanalysis error:", error);
      toast.error("Erro ao reanalisar perfil");
    } finally {
      setReanalyzing(false);
    }
  };

  const getPlatformIcon = (platform: string | null) => {
    switch (platform?.toLowerCase()) {
      case "instagram": return <Instagram className="h-5 w-5 text-pink-400" />;
      case "youtube": return <Youtube className="h-5 w-5 text-red-400" />;
      case "linkedin": return <Linkedin className="h-5 w-5 text-blue-400" />;
      case "tiktok": return <TikTokIcon />;
      default: return <User className="h-5 w-5 text-cyan-400" />;
    }
  };

  const extractUsername = (url: string | null): string => {
    if (!url) return "Perfil";
    const match = url.match(/(?:@)?([a-zA-Z0-9._-]+)(?:\/)?$/);
    return match ? `@${match[1]}` : "Perfil";
  };

  const formatFollowers = (count: number | null): string => {
    if (!count) return "N/A";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const parseList = (str: string | null): string[] => {
    if (!str) return [];
    return str.split("|||").filter(s => s.trim().length > 3);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-muted-foreground">Análise não encontrada</p>
        <Button onClick={() => navigate("/dashboard/radar")} className="mt-4">
          Voltar ao Radar
        </Button>
      </div>
    );
  }


  const breakdown = data.profile_score_breakdown || {};
  const photoAnalysis = data.photo_analysis || {};
  const bioAnalysis = data.bio_analysis || {};
  const strategicAdjustments = (data as any).strategic_adjustments || {};
  const salesFunnel = (data as any).sales_funnel;
  const visualIdentity = (data as any).visual_identity;
  const monthlyContentPlan = (data as any).monthly_content_plan;
  const highlightSuggestions = (data as any).highlight_suggestions || [];
  const strengths = parseList(data.strengths);
  const weaknesses = parseList(data.weaknesses);
  const suggestions = parseList(data.suggestions);
  const projectedScore = Math.min(100, (currentScore || 50) + 25);

  // Extract bio versions from strategic adjustments
  const bioVersions = strategicAdjustments?.bio_versions || [];
  const nameSuggestion = strategicAdjustments?.name_suggestion;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Confetti and Level Up Modal */}
      <ConfettiCelebration 
        trigger={showConfetti} 
        type="levelUp" 
        onComplete={() => setShowConfetti(false)} 
      />
      <LevelUpModal
        isOpen={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        userName={data.profile_data?.full_name || extractUsername(data.target_url)}
        previousLevel={previousLevel}
        newLevel={currentLevel}
        previousScore={firstAnalysis?.score || 0}
        newScore={currentScore}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/radar")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {getPlatformIcon(data.platform)}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">
                  {extractUsername(data.target_url)}
                </h1>
                <AuthorityLevelBadge score={currentScore} size="md" />
              </div>
              <p className="text-sm text-muted-foreground">
                Análise completa • {new Date(data.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="border-cyan-500/50 text-cyan-300">
            {data.niche_detected || "Marketing Digital"}
          </Badge>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50">
            {formatFollowers(data.current_followers)} seguidores
          </Badge>
          <Button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            {reanalyzing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Reanalisar Perfil
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Score & Profile */}
        <div className="space-y-6">
          {/* Profile Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-card text-center">
              <CardContent className="pt-6">
                <div className="mb-4">
                  {photoAnalysis.profile_image_url ? (
                    <img
                      src={photoAnalysis.profile_image_url}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-cyan-500/50"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 mx-auto flex items-center justify-center border-2 border-cyan-500/30">
                      <User className="h-12 w-12 text-cyan-400" />
                    </div>
                  )}
                </div>
                
                <ScoreCircle 
                  score={currentScore || 0} 
                  size={160}
                  label="Profile Score"
                />

                <div className="mt-6 space-y-3">
                  {Object.entries(breakdown).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize text-muted-foreground">{key}</span>
                        <span className="text-cyan-300">{value}/20</span>
                      </div>
                      <Progress value={(value / 20) * 100} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats - All Real Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-cyan-400" />
                  Estatísticas Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-cyan-950/30">
                  <p className="text-xl font-bold text-cyan-300">
                    {formatFollowers(data.current_followers)}
                  </p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-950/30">
                  <p className="text-xl font-bold text-blue-300">
                    {data.following_count ? formatFollowers(data.following_count) : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">A Seguir</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-950/30">
                  <p className="text-xl font-bold text-purple-300">
                    {data.posts_count || "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">Publicações</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-950/30">
                  <p className="text-xl font-bold text-green-300">
                    {data.follower_goal ? formatFollowers(data.follower_goal) : "10K"}
                  </p>
                  <p className="text-xs text-muted-foreground">Meta</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Before/After & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Before/After Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <BeforeAfterComparison
              currentBio={bioAnalysis.actual_bio || "Bio não detectada"}
              suggestedBio={bioAnalysis.suggested_bio}
              currentPhotoScore={photoAnalysis.overall_score || 60}
              suggestedPhotoScore={85}
              currentScore={data?.score || currentScore}
              projectedScore={projectedScore}
              photoUrl={photoAnalysis.profile_image_url}
              photoAnalysis={photoAnalysis}
              photoIssues={photoAnalysis.suggestions || []}
              bioIssues={bioAnalysis.current_issues || []}
              analysisId={data.id}
              targetUrl={data.target_url || undefined}
              suggestedBios={bioVersions}
              onScoreUpdate={handleScoreUpdate}
            />
          </motion.div>

          {/* Bio Versions Card - NEW */}
          {bioVersions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <BioVersionsCard 
                bioVersions={bioVersions} 
                currentBio={bioAnalysis.actual_bio}
              />
            </motion.div>
          )}

          {/* Name Optimization (SEO) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.27 }}
          >
            <NameOptimization
              currentName={data.profile_data?.full_name || extractUsername(data.target_url)}
              suggestedName={nameSuggestion}
              niche={data.niche_detected || undefined}
            />
          </motion.div>

          {/* 3 Pillars Content Generator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.275 }}
          >
            <ContentPillarsGenerator
              bio={bioAnalysis.actual_bio}
              niche={data.niche_detected || undefined}
            />
          </motion.div>

          {/* Photo Analysis Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.278 }}
          >
            <PhotoAnalysisCard
              photoUrl={photoAnalysis.profile_image_url || data.profile_data?.profile_pic_url}
              framing={photoAnalysis.framing}
              lighting={photoAnalysis.lighting}
              background={photoAnalysis.background}
              expression={photoAnalysis.expression}
              overallScore={photoAnalysis.overall_score}
              suggestions={photoAnalysis.suggestions}
            />
          </motion.div>

          {/* Profitable Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <ProfitableHighlights
              highlights={highlightSuggestions}
              niche={data.niche_detected || undefined}
            />
          </motion.div>

          {/* Monthly Content Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.29 }}
          >
            <MonthlyContentPlan
              plan={monthlyContentPlan}
              niche={data.niche_detected || undefined}
            />
          </motion.div>

          {/* Sales Funnel Visualization */}
          {salesFunnel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SalesFunnelVisualization 
                funnel={salesFunnel} 
                niche={data.niche_detected || undefined}
              />
            </motion.div>
          )}

          {/* Smart Branding Card - AI Color Psychology */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            <SmartBrandingCard 
              niche={data.niche_detected || undefined}
              userName={data.profile_data?.full_name || extractUsername(data.target_url)}
            />
          </motion.div>

          {/* Real-Time Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
          >
            <RealTimeProgressBar
              currentScore={currentScore}
              previousScore={firstAnalysis?.score ?? undefined}
              currentFollowers={data.current_followers ?? undefined}
              previousFollowers={firstAnalysis?.current_followers ?? undefined}
              currentPosts={data.posts_count ?? undefined}
              previousPosts={firstAnalysis?.posts_count ?? undefined}
              lastAnalysisDate={firstAnalysis?.created_at}
            />
          </motion.div>

          {/* Before/After Chart */}
          {firstAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36 }}
            >
              <BeforeAfterChart
                metrics={[
                  {
                    label: "Score",
                    before: firstAnalysis.score || 0,
                    after: currentScore
                  },
                  {
                    label: "Seguidores",
                    before: firstAnalysis.current_followers || 0,
                    after: data.current_followers || 0
                  },
                  {
                    label: "Posts",
                    before: firstAnalysis.posts_count || 0,
                    after: data.posts_count || 0
                  }
                ]}
              />
            </motion.div>
          )}

          {/* Evolution History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            <EvolutionHistory
              userId={data.user_id}
              targetUrl={data.target_url || undefined}
            />
          </motion.div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-card h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Pontos Fortes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {strengths.length > 0 ? (
                    strengths.map((strength, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{strength}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Análise em processamento...</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-card h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
                    <Lightbulb className="h-4 w-4" />
                    Melhorias Sugeridas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {suggestions.length > 0 ? (
                    suggestions.map((suggestion, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{suggestion}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Análise em processamento...</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Best Posting Times */}
          {data.best_posting_times && data.best_posting_times.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-cyan-400" />
                    Melhores Horários para Postar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {data.best_posting_times.map((time, i) => (
                      <div
                        key={i}
                        className={`px-4 py-2 rounded-lg text-center ${
                          time.score >= 90 
                            ? 'bg-green-500/20 border border-green-500/50' 
                            : 'bg-cyan-500/10 border border-cyan-500/30'
                        }`}
                      >
                        <p className="text-lg font-bold text-white">
                          {time.label || `${time.hour}h`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {time.score}% engajamento
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap gap-4"
          >
            <Button
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 gap-2"
              onClick={() => navigate("/dashboard/radar")}
            >
              <TrendingUp className="h-4 w-4" />
              Voltar ao Radar
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-cyan-700/50 hover:bg-cyan-950/30"
              onClick={() => toast.info("Funcionalidade em desenvolvimento")}
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-cyan-700/50 hover:bg-cyan-950/30"
              onClick={() => toast.info("Funcionalidade em desenvolvimento")}
            >
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
