import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, Sparkles, Radar, Brain } from "lucide-react";
import { ProfileScore } from "@/components/dashboard/ProfileScore";
import { FollowerGoalTracker } from "@/components/radar/FollowerGoalTracker";
import { BestPostingTimes } from "@/components/radar/BestPostingTimes";
import { WeeklyChecklist } from "@/components/radar/WeeklyChecklist";
import { CompetitorSpy } from "@/components/dashboard/CompetitorSpy";
import { OneClickPost } from "@/components/dashboard/OneClickPost";
import { PredictiveCalendar } from "@/components/dashboard/PredictiveCalendar";
import AIImageGenerator from "@/components/dashboard/AIImageGenerator";
import { AIContentCentral } from "@/components/dashboard/AIContentCentral";
import { EvolutionDashboard } from "@/components/dashboard/EvolutionDashboard";
import { useCredits } from "@/hooks/useCredits";
import { CreditExhaustedModal } from "@/components/credits/CreditExhaustedModal";
import { RadarPdfButton } from "@/components/radar/RadarPdfReport";

// New 360 Audit Components
import { ScannerOverlay } from "@/components/radar/ScannerOverlay";
import { GoldenDeliveryPopup } from "@/components/radar/GoldenDeliveryPopup";
import { RescuePlanPopup } from "@/components/radar/RescuePlanPopup";
import { BrandingDiagnosis } from "@/components/radar/BrandingDiagnosis";
import { UrgentImprovementsCard } from "@/components/radar/UrgentImprovementsCard";
import { ContentSuggestionsCard } from "@/components/radar/ContentSuggestionsCard";
import { HighlightSuggestions } from "@/components/radar/HighlightSuggestions";
import { CleanSearchState } from "@/components/radar/CleanSearchState";
import { GrowthProjectionChart } from "@/components/radar/GrowthProjectionChart";
import { NicheComparison } from "@/components/radar/NicheComparison";
import { EliteUpsellButton } from "@/components/upsell/EliteUpsellButton";
import { useSubscription } from "@/hooks/useSubscription";

// Import images
import radarProfileScore from "@/assets/radar-profile-score.png";
import radarCompetitorSpy from "@/assets/radar-competitor-spy.png";
import radarOneClick from "@/assets/radar-one-click.png";
import radarCalendar from "@/assets/radar-calendar.png";

interface HistoryAnalysis {
  id: string;
  target_url: string | null;
  platform: string | null;
  score: number | null;
  niche_detected: string | null;
  profile_score_breakdown: Record<string, number> | null;
  checklist_data: Record<string, unknown> | null;
  follower_goal: number | null;
  current_followers: number | null;
  best_posting_times: Array<{ hour: number; score: number }> | null;
  weaknesses: string | null;
  strengths: string | null;
  suggestions: string | null;
  photo_analysis?: any;
  bio_analysis?: any;
  content_suggestions?: any;
  urgent_improvements?: string[];
}

interface Weakness {
  id: string;
  text: string;
}

const carouselImages = [
  { src: radarProfileScore, alt: "Profile Score Analysis", title: "Análise de Perfil" },
  { src: radarCompetitorSpy, alt: "Competitor Spy", title: "Espião de Concorrentes" },
  { src: radarOneClick, alt: "One Click Post", title: "Post One-Click" },
  { src: radarCalendar, alt: "Predictive Calendar", title: "Calendário Preditivo" }
];

export default function RadarNichePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [historyData, setHistoryData] = useState<HistoryAnalysis | null>(null);
  const [detectedNiche, setDetectedNiche] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Popup states
  const [showGoldenPopup, setShowGoldenPopup] = useState(false);
  const [showRescuePopup, setShowRescuePopup] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const { checkCredits, consumeCredit, showUpgradeModal, setShowUpgradeModal } = useCredits();
  const { isPro, isLifetime } = useSubscription();
  const isElite = isLifetime; // Elite users have lifetime access

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
      await loadHistoryData(user.id);
    };
    checkAuth();
  }, [navigate]);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const loadHistoryData = async (uid: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("history_analysis")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const typedData: HistoryAnalysis = {
          id: data.id,
          target_url: data.target_url,
          platform: data.platform,
          score: data.score,
          niche_detected: data.niche_detected,
          profile_score_breakdown: data.profile_score_breakdown as Record<string, number> | null,
          checklist_data: data.checklist_data as Record<string, unknown> | null,
          follower_goal: data.follower_goal,
          current_followers: data.current_followers,
          best_posting_times: data.best_posting_times as Array<{ hour: number; score: number }> | null,
          weaknesses: (data as any).weaknesses || null,
          strengths: (data as any).strengths || null,
          suggestions: (data as any).suggestions || null,
          photo_analysis: (data as any).photo_analysis || null,
          bio_analysis: (data as any).bio_analysis || null,
          content_suggestions: (data as any).content_suggestions || null,
          urgent_improvements: (data as any).urgent_improvements || null,
        };
        setHistoryData(typedData);
        setDetectedNiche(data.niche_detected);
        if (data.target_url) setTargetUrl(data.target_url);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const detectPlatformFromUrl = (url: string): string => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes("instagram")) return "instagram";
    if (urlLower.includes("facebook")) return "facebook";
    if (urlLower.includes("youtube")) return "youtube";
    if (urlLower.includes("tiktok")) return "tiktok";
    if (urlLower.includes("linkedin")) return "linkedin";
    return "other";
  };

  const extractUsernameFromUrl = (url: string): string => {
    const instaMatch = url.match(/instagram\.com\/(?:@)?([^\/\?#]+)/i);
    if (instaMatch) return instaMatch[1].replace('@', '');
    const ytMatch = url.match(/youtube\.com\/(?:@|c\/|channel\/|user\/)?([^\/\?#]+)/i);
    if (ytMatch) return ytMatch[1].replace('@', '');
    const tiktokMatch = url.match(/tiktok\.com\/@?([^\/\?#]+)/i);
    if (tiktokMatch) return tiktokMatch[1].replace('@', '');
    const linkedinMatch = url.match(/linkedin\.com\/in\/([^\/\?#]+)/i);
    if (linkedinMatch) return linkedinMatch[1];
    const fbMatch = url.match(/facebook\.com\/(?:profile\.php\?id=)?([^\/\?#]+)/i);
    if (fbMatch) return fbMatch[1];
    return url.replace(/^@/, '');
  };

  const handleAnalyze = async () => {
    if (!targetUrl.trim()) {
      toast.error("Por favor, insira uma URL ou @username");
      return;
    }
    if (!userId) return;

    // Validate social media URL
    const supportedDomains = ['instagram.com', 'youtube.com', 'tiktok.com', 'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagr.am'];
    const urlLower = targetUrl.toLowerCase();
    const isValidSocialUrl = supportedDomains.some(domain => urlLower.includes(domain)) || targetUrl.trim().startsWith('@');
    
    if (!isValidSocialUrl) {
      toast.error("Por favor, insira um link de Instagram, YouTube, TikTok, LinkedIn ou Facebook. Exemplo: instagram.com/nomeusuario ou @nomeusuario");
      return;
    }

    const hasCredits = await checkCredits();
    if (!hasCredits) return;

    setIsAnalyzing(true);
    setAnalysisComplete(false);

    try {
      const platform = detectPlatformFromUrl(targetUrl);
      const username = extractUsernameFromUrl(targetUrl);

      // Use analyze-social-real for REAL data scraping
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke("analyze-social-real", {
        body: { url: targetUrl, force_refresh: false }
      });

      if (analysisError) {
        console.error("Analysis error:", analysisError);
        const { data: nicheData, error: nicheError } = await supabase.functions.invoke("detect-niche", {
          body: { profileUrl: targetUrl, platform, username }
        });
        if (nicheError) throw nicheError;
        const niche = nicheData?.niche || "Marketing Digital";
        setDetectedNiche(niche);
        await consumeCredit(1);
        toast.success(`Nicho detectado: ${niche}`);
      } else {
        const niche = analysisData?.niche_detected || "Marketing Digital";
        setDetectedNiche(niche);
        const score = analysisData?.score || 65;
        const breakdown = analysisData?.breakdown || { bio: 12, visual: 14, engagement: 18, consistency: 21 };
        const bestTimes = analysisData?.best_posting_times || [
          { hour: 9, score: 75 },
          { hour: 18, score: 90 },
          { hour: 20, score: 95 }
        ];

        const weaknessesStr = Array.isArray(analysisData?.weaknesses) 
          ? analysisData.weaknesses.join("|||") 
          : "";
        const strengthsStr = Array.isArray(analysisData?.strengths) 
          ? analysisData.strengths.join("|||") 
          : "";
        const suggestionsStr = Array.isArray(analysisData?.suggestions) 
          ? analysisData.suggestions.join("|||") 
          : "";

        // Use bio analysis from API or show "not available" state
        const bioAnalysis = analysisData?.bio_analysis || {
          has_cta: false,
          has_niche_keywords: false,
          suggested_bio: `${niche} | Ajudo você a alcançar resultados extraordinários | Clique no link para começar ↓`,
          current_issues: analysisData?.weaknesses?.slice(0, 2) || [],
          data_available: false
        };

        // Use photo analysis from API or show "not available" state - NO random values
        const photoAnalysis = analysisData?.photo_analysis || {
          framing: 0,
          background: 0,
          lighting: 0,
          expression: 0,
          overall_score: 0,
          suggestions: ["Faça upload da sua foto de perfil para análise detalhada"],
          data_available: false
        };
        
        // Only calculate if we have real data
        if (photoAnalysis.framing > 0 && !photoAnalysis.overall_score) {
          photoAnalysis.overall_score = Math.round(
            ((photoAnalysis.framing + photoAnalysis.background + photoAnalysis.lighting + photoAnalysis.expression) / 80) * 100
          );
        }

        // Use content suggestions from API or provide default templates
        const contentSuggestions = analysisData?.content_suggestions || [
          { type: "Reels de FAQ", description: "Responda as perguntas mais comuns do seu nicho", frequency: "2x por semana" },
          { type: "Carrossel Tutorial", description: "Ensine um conceito em 5-7 slides", frequency: "1x por semana" },
          { type: "Stories do Dia", description: "Mostre bastidores e momentos autênticos", frequency: "Diário" }
        ];

        // Calculate correct photo score from photo analysis
        const photoScore = photoAnalysis.overall_score || 
          Math.round(((photoAnalysis.framing || 0) + (photoAnalysis.background || 0) + 
          (photoAnalysis.lighting || 0) + (photoAnalysis.expression || 0)) / 4);

        // Save to database - including new strategist fields with REAL DATA
        const realFollowers = analysisData?.followers || analysisData?.profile_data?.followers_count || 0;
        const realFollowing = analysisData?.following_count || analysisData?.profile_data?.following_count || null;
        const realPosts = analysisData?.posts_count || analysisData?.profile_data?.posts_count || null;
        const realProfilePic = analysisData?.photo_analysis?.profile_image_url || 
                               analysisData?.profile_data?.profile_pic_url || null;

        console.log(`[RadarNichePage] Saving REAL data - followers: ${realFollowers}, following: ${realFollowing}, posts: ${realPosts}, profile_pic: ${realProfilePic?.substring(0, 50)}...`);

        const historyRecord: any = {
          user_id: userId,
          target_url: targetUrl,
          platform: analysisData?.platform || platform,
          score,
          niche_detected: niche,
          profile_score_breakdown: {
            bio: breakdown.bio,
            photo: photoScore,
            frequency: breakdown.consistency,
            engagement: breakdown.engagement,
            visual: breakdown.visual
          },
          best_posting_times: bestTimes,
          current_followers: realFollowers,
          following_count: realFollowing,
          posts_count: realPosts,
          weaknesses: weaknessesStr,
          strengths: strengthsStr,
          suggestions: suggestionsStr,
          bio_analysis: {
            ...bioAnalysis,
            actual_bio: analysisData?.bio_analysis?.actual_bio || analysisData?.profile_data?.bio || null
          },
          photo_analysis: {
            ...photoAnalysis,
            profile_image_url: realProfilePic
          },
          content_suggestions: contentSuggestions,
          urgent_improvements: analysisData?.weaknesses?.slice(0, 3) || [],
          profile_data: analysisData?.profile_data || null
        };

        if (historyData?.id) {
          await supabase.from("history_analysis").update(historyRecord).eq("id", historyData.id);
        } else {
          await supabase.from("history_analysis").insert(historyRecord);
        }

        await consumeCredit(1);
        await loadHistoryData(userId);

        // Show appropriate popup based on score
        setAnalysisComplete(true);
        setTimeout(() => {
          if (score >= 80) {
            setShowGoldenPopup(true);
          } else if (score < 50) {
            setShowRescuePopup(true);
          }
        }, 500);

        toast.success(`Análise concluída! Score: ${score}/100`);
      }
    } catch (error) {
      console.error("Error analyzing:", error);
      toast.error("Erro ao analisar perfil. Verifique a URL e tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePlan = async () => {
    setShowGoldenPopup(false);
    setShowRescuePopup(false);
    toast.success("Gerando plano de 30 dias...");
    // Navigate to predictive calendar or trigger generation
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full max-w-2xl mx-auto" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  // Show empty state if no analysis has been done
  const hasNoAnalysis = !historyData?.score && !detectedNiche;

  if (hasNoAnalysis && !isAnalyzing) {
    return (
      <div className="container mx-auto p-6">
        <CleanSearchState
          targetUrl={targetUrl}
          onUrlChange={setTargetUrl}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />
        <CreditExhaustedModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      </div>
    );
  }

  const profileBreakdown = historyData?.profile_score_breakdown as {
    bio?: number;
    photo?: number;
    frequency?: number;
    engagement?: number;
    visual?: number;
  } | null;

  const urgentImprovements = historyData?.urgent_improvements || 
    (historyData?.weaknesses ? historyData.weaknesses.split("|||").filter(w => w.trim().length > 5).slice(0, 3) : []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Premium Scanner Overlay */}
      <ScannerOverlay 
        isLoading={isAnalyzing} 
        onComplete={() => setAnalysisComplete(true)} 
      />

      {/* Golden Delivery Popup */}
      <GoldenDeliveryPopup
        isOpen={showGoldenPopup}
        onClose={() => setShowGoldenPopup(false)}
        score={historyData?.score || 0}
        niche={detectedNiche || "Marketing Digital"}
        onViewDetails={() => setShowGoldenPopup(false)}
        onGeneratePlan={handleGeneratePlan}
      />

      {/* Rescue Plan Popup */}
      <RescuePlanPopup
        isOpen={showRescuePopup}
        onClose={() => setShowRescuePopup(false)}
        score={historyData?.score || 0}
        urgentImprovements={urgentImprovements}
        onApplyRescuePlan={handleGeneratePlan}
        onViewDetails={() => setShowRescuePopup(false)}
      />

      {/* Hero Banner */}
      <div className="radar-hero-banner">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Radar className="h-8 w-8 text-cyan-400" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Radar de Nicho: A sua IA para o sucesso digital.
            </h1>
            <p className="text-cyan-300 text-lg">Analise, crie e cresça.</p>
          </div>
          <RadarPdfButton
            data={{
              username: historyData?.target_url ? extractUsernameFromUrl(historyData.target_url) : undefined,
              platform: historyData?.platform || undefined,
              score: historyData?.score || null,
              breakdown: profileBreakdown,
              niche: detectedNiche,
              bestTimes: historyData?.best_posting_times || null,
              followerGoal: historyData?.follower_goal || null,
              currentFollowers: historyData?.current_followers || null,
              photoAnalysis: historyData?.photo_analysis,
              bioAnalysis: historyData?.bio_analysis,
              contentSuggestions: historyData?.content_suggestions,
              urgentImprovements: historyData?.urgent_improvements,
            }}
            disabled={!historyData?.score && !detectedNiche}
          />
        </div>
      </div>

      {/* Search Header */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-3 text-cyan-400">
              <div className="w-10 h-10 rounded-lg bg-cyan-950/50 border border-cyan-700/50 flex items-center justify-center">
                <Brain className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">Analisar Perfil</h2>
            </div>
            <div className="flex-1 flex gap-2 w-full md:w-auto">
              <div className="relative flex-1">
                <Input
                  placeholder="Insira o @usuario ou link do perfil para ativar o Radar..."
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  className="bg-cyan-950/20 border-cyan-800/50 pr-10"
                />
                <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-600" />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 glow-button"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Analisar
                  </>
                )}
              </Button>
            </div>
          </div>
          {detectedNiche && (
            <p className="text-sm text-muted-foreground mt-3 text-center md:text-left">
              Nicho detectado: <span className="font-semibold text-cyan-400">{detectedNiche}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Status Cards */}
        <div className="lg:col-span-3 space-y-6">
          <ProfileScore
            score={historyData?.score || null}
            breakdown={profileBreakdown ? {
              bio: profileBreakdown.bio || 0,
              photo: profileBreakdown.photo || 0,
              frequency: profileBreakdown.frequency || 0,
              engagement: profileBreakdown.engagement || 0,
              visual: profileBreakdown.visual || 0
            } : null}
            isLoading={isAnalyzing}
            analysisId={historyData?.id}
          />

          <FollowerGoalTracker
            userId={userId}
            historyId={historyData?.id}
            initialGoal={historyData?.follower_goal}
            currentFollowers={historyData?.current_followers}
          />

          <BestPostingTimes data={historyData?.best_posting_times} isLoading={isAnalyzing} />

          {/* Urgent Improvements */}
          {urgentImprovements.length > 0 && (
            <UrgentImprovementsCard improvements={urgentImprovements} />
          )}

          {/* Niche Comparison - Show score vs average */}
          {historyData?.score && detectedNiche && (
            <NicheComparison
              userScore={historyData.score}
              niche={detectedNiche}
              onGeneratePlan={handleGeneratePlan}
            />
          )}
        </div>

        {/* Center Column - AI Tools */}
        <div className="lg:col-span-5 space-y-6">
          {/* Branding Diagnosis */}
          <BrandingDiagnosis
            photoAnalysis={historyData?.photo_analysis}
            bioAnalysis={historyData?.bio_analysis}
            niche={detectedNiche || undefined}
            isLoading={isAnalyzing}
          />

          {/* Growth Projection Chart */}
          {historyData?.current_followers && (
            <GrowthProjectionChart
              currentFollowers={historyData.current_followers}
              followerGoal={historyData.follower_goal || undefined}
              scoreImpact={historyData.score ? 1 + (historyData.score / 100) : 1.2}
            />
          )}

          <CompetitorSpy />

          <OneClickPost
            niche={detectedNiche}
            weaknesses={historyData?.weaknesses
              ? historyData.weaknesses.split("|||").filter(w => w.trim().length > 5).map((w, i) => ({ id: `w-${i}`, text: w.trim() }))
              : null
            }
          />

          <AIImageGenerator />
        </div>

        {/* Right Column - Action */}
        <div className="lg:col-span-4 space-y-6">
          {/* Content Suggestions */}
          <ContentSuggestionsCard
            suggestions={historyData?.content_suggestions || []}
            niche={detectedNiche || undefined}
            onGenerateCalendar={handleGeneratePlan}
          />

          {/* Highlight Suggestions */}
          <HighlightSuggestions niche={detectedNiche || undefined} />

          <PredictiveCalendar userId={userId} detectedNiche={detectedNiche} />

          <WeeklyChecklist
            userId={userId}
            historyId={historyData?.id}
            niche={detectedNiche}
            initialData={historyData?.checklist_data as Record<string, boolean> | null}
            onComplete={() => {
              if (historyData?.score) {
                toast.success("🎉 Parabéns! +5 pontos no Profile Score por completar o checklist!");
              }
            }}
          />
        </div>
      </div>

      {/* AI Content Central */}
      <AIContentCentral />

      {/* Evolution Dashboard */}
      <EvolutionDashboard />

      {/* Elite Upsell Button - only show if user has analysis and is not Elite */}
      {historyData?.score && !isElite && (
        <EliteUpsellButton feature="legendas para todos os posts sugeridos" />
      )}

      {/* Credit Exhausted Modal */}
      <CreditExhaustedModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  );
}