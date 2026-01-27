import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Instagram, Facebook, Loader2, ArrowLeft, Sparkles, Plug, TrendingUp, FileText, Check, Zap, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import WebsiteAuditDashboard from "@/components/analysis/WebsiteAuditDashboard";
import LeadCaptureModal from "@/components/analysis/LeadCaptureModal";
import AnalysisLoadingSteps from "@/components/analysis/AnalysisLoadingSteps";
import WhatsAppFloatingButton from "@/components/analysis/WhatsAppFloatingButton";
import SocialMediaCard from "@/components/analysis/SocialMediaCard";
import AIActionPlan from "@/components/analysis/AIActionPlan";
import SocialConnectModal from "@/components/social/SocialConnectModal";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/trial/UpgradeModal";

// Icons for new platforms
const TikTokIcon = ({
  className
}: {
  className?: string;
}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>;
const YouTubeIcon = ({
  className
}: {
  className?: string;
}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>;
const LinkedInIcon = ({
  className
}: {
  className?: string;
}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>;
interface WebsiteAnalysis {
  id: string;
  url: string;
  seo_score: number;
  speed_score: number;
  structure_score: number;
  conversion_score: number;
  copywriting_score: number;
  overall_score: number;
  recommendations: string;
  analyzed_at: string;
  full_report?: {
    vision_overview?: string;
    strengths?: Array<{
      title: string;
      description: string;
    }>;
    opportunities?: Array<{
      title: string;
      description: string;
      impact: string;
    }>;
    critical_alerts?: Array<{
      title: string;
      description: string;
      urgency: string;
    }>;
    traffic_estimate?: {
      domain_authority: string;
      monthly_potential: string;
      insight: string;
    };
    action_items?: Array<{
      action: string;
      category: string;
      impact: "alto" | "médio" | "baixo";
      difficulty: "fácil" | "médio" | "difícil";
    }>;
  };
}
interface SocialAnalysis {
  id: string;
  platform: string;
  followers: number;
  engagement_rate: number;
  post_frequency: string;
  score: number;
  strengths: string;
  weaknesses: string;
  suggestions: string;
  analyzed_at: string;
}
const AnalysisPage = () => {
  const [searchParams] = useSearchParams();
  const analysisId = searchParams.get("id");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loadingWebsite, setLoadingWebsite] = useState(false);
  const [loadingInstagram, setLoadingInstagram] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);
  const [loadingTiktok, setLoadingTiktok] = useState(false);
  const [loadingYoutube, setLoadingYoutube] = useState(false);
  const [loadingLinkedin, setLoadingLinkedin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showLoadingSteps, setShowLoadingSteps] = useState(false);
  const [showActionPlan, setShowActionPlan] = useState<string | null>(null);
  const [connectModal, setConnectModal] = useState<{
    isOpen: boolean;
    platform: string;
  } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const { canAnalyze, analysisCount, analysisLimit, isPro, isTrial, refresh: refreshSubscription } = useSubscription();
  
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [instagramAnalysis, setInstagramAnalysis] = useState<SocialAnalysis | null>(null);
  const [facebookAnalysis, setFacebookAnalysis] = useState<SocialAnalysis | null>(null);
  const [tiktokAnalysis, setTiktokAnalysis] = useState<SocialAnalysis | null>(null);
  const [youtubeAnalysis, setYoutubeAnalysis] = useState<SocialAnalysis | null>(null);
  const [linkedinAnalysis, setLinkedinAnalysis] = useState<SocialAnalysis | null>(null);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  useEffect(() => {
    if (analysisId) {
      loadSpecificAnalysis(analysisId);
    } else {
      loadAnalyses();
    }
    checkSocialConnections();
  }, [analysisId]);
  const loadSpecificAnalysis = async (id: string) => {
    const {
      data,
      error
    } = await supabase.from("website_analysis").select("*").eq("id", id).single();
    if (!error && data) {
      setWebsiteAnalysis(data as WebsiteAnalysis);
      setWebsiteUrl(data.url);
      setShowDashboard(true);
    }
  };
  const loadAnalyses = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data: websiteData
      } = await supabase.from("website_analysis").select("*").eq("user_id", user.id).order("analyzed_at", {
        ascending: false
      }).limit(1).single();
      if (websiteData) {
        setWebsiteAnalysis(websiteData as WebsiteAnalysis);
        setWebsiteUrl(websiteData.url);
      }
      const {
        data: instagramData
      } = await supabase.from("social_media_analysis").select("*").eq("user_id", user.id).eq("platform", "instagram").order("analyzed_at", {
        ascending: false
      }).limit(1).single();
      if (instagramData) setInstagramAnalysis(instagramData);
      const {
        data: facebookData
      } = await supabase.from("social_media_analysis").select("*").eq("user_id", user.id).eq("platform", "facebook").order("analyzed_at", {
        ascending: false
      }).limit(1).single();
      if (facebookData) setFacebookAnalysis(facebookData);
    } catch (error: any) {
      console.error("Error loading analyses:", error);
    }
  };
  const checkSocialConnections = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data: accounts
      } = await supabase.from("social_accounts").select("platform, is_connected").eq("user_id", user.id).eq("is_connected", true);
      if (accounts) {
        setInstagramConnected(accounts.some(a => a.platform === "instagram"));
        setFacebookConnected(accounts.some(a => a.platform === "facebook"));
        setTiktokConnected(accounts.some(a => a.platform === "tiktok"));
        setYoutubeConnected(accounts.some(a => a.platform === "youtube"));
        setLinkedinConnected(accounts.some(a => a.platform === "linkedin"));
      }
    } catch (error) {
      console.error("Error checking social connections:", error);
    }
  };
  const handleConnectSocial = (platform: string) => {
    setConnectModal({
      isOpen: true,
      platform
    });
  };
  const handleConnectionSuccess = () => {
    checkSocialConnections();
    setConnectModal(null);
  };
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return <Instagram className="h-5 w-5 text-pink-500" />;
      case "facebook":
        return <Facebook className="h-5 w-5 text-blue-600" />;
      case "tiktok":
        return <TikTokIcon className="h-5 w-5" />;
      case "youtube":
        return <YouTubeIcon className="h-5 w-5 text-red-500" />;
      case "linkedin":
        return <LinkedInIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };
  const handleAnalyzeClick = () => {
    if (!websiteUrl || !websiteUrl.startsWith("http")) {
      toast({
        title: "URL Inválida",
        description: "Por favor, insira uma URL válida começando com http:// ou https://",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user can analyze (Pro, Trial, or under limit)
    if (!canAnalyze) {
      setShowUpgradeModal(true);
      return;
    }
    
    setShowLeadModal(true);
  };
  const handleLeadSubmit = async (leadData: {
    fullName: string;
    whatsapp: string;
  }) => {
    setShowLeadModal(false);
    setShowLoadingSteps(true);
    setLoadingWebsite(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      const {
        data: leadRecord,
        error: leadError
      } = await supabase.from('leads_analysis').insert({
        user_id: user?.id || null,
        full_name: leadData.fullName,
        whatsapp: leadData.whatsapp,
        website_url: websiteUrl,
        status: 'new'
      }).select().single();
      if (leadError) {
        console.error("Error saving lead:", leadError);
      }
      const {
        data,
        error
      } = await supabase.functions.invoke("analyze-website", {
        body: {
          url: websiteUrl
        }
      });
      if (error) throw error;
      if (leadRecord) {
        await supabase.from('leads_analysis').update({
          overall_score: data.overall_score,
          seo_score: data.seo_score,
          speed_score: data.speed_score,
          conversion_score: data.conversion_score,
          structure_score: data.structure_score,
          copywriting_score: data.copywriting_score
        }).eq('id', leadRecord.id);
      }
      setWebsiteAnalysis(data);
      setShowLoadingSteps(false);
      setShowDashboard(true);
      toast({
        title: "Análise Concluída",
        description: "Website analisado com sucesso!"
      });
    } catch (error: any) {
      console.error("Error analyzing website:", error);
      setShowLoadingSteps(false);
      toast({
        title: "Erro",
        description: error.message || "Erro ao analisar website",
        variant: "destructive"
      });
    } finally {
      setLoadingWebsite(false);
    }
  };
  // Helper function to extract username from stored URL
  const extractUsernameFromUrl = (url: string, platform: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.replace(/\/$/, "");
      
      switch (platform.toLowerCase()) {
        case "instagram":
        case "facebook":
          return pathname.split("/").filter(Boolean).pop() || "";
        case "tiktok":
          return pathname.replace("/@", "").split("/").filter(Boolean).pop() || "";
        case "youtube":
          const ytPath = pathname.replace(/^\/(@|channel\/|c\/|user\/)/, "");
          return ytPath.split("/").filter(Boolean).pop() || "";
        case "linkedin":
          return pathname.replace(/^\/(in|company)\//, "").split("/").filter(Boolean).pop() || "";
        default:
          return pathname.split("/").filter(Boolean).pop() || "";
      }
    } catch {
      return url;
    }
  };

  const handleAnalyzeSocial = async (platform: string) => {
    const setLoading = {
      instagram: setLoadingInstagram,
      facebook: setLoadingFacebook,
      tiktok: setLoadingTiktok,
      youtube: setLoadingYoutube,
      linkedin: setLoadingLinkedin
    }[platform];
    const setAnalysis = {
      instagram: setInstagramAnalysis,
      facebook: setFacebookAnalysis,
      tiktok: setTiktokAnalysis,
      youtube: setYoutubeAnalysis,
      linkedin: setLinkedinAnalysis
    }[platform];
    const functionName = `analyze-${platform}`;
    setLoading?.(true);
    
    try {
      // Get user and fetch connected account details
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Utilizador não autenticado",
          variant: "destructive"
        });
        return;
      }

      // Fetch the connected account to get the stored URL
      const { data: account } = await supabase
        .from("social_accounts")
        .select("account_name, account_id")
        .eq("user_id", user.id)
        .eq("platform", platform)
        .eq("is_connected", true)
        .single();

      if (!account) {
        toast({
          title: "Conta não conectada",
          description: `Por favor, conecte a sua conta do ${platform} primeiro`,
          variant: "destructive"
        });
        return;
      }

      // Extract username from the stored URL (account_id contains the URL)
      const username = extractUsernameFromUrl(account.account_id || "", platform) || account.account_name;
      
      // Call edge function with the username
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          username,
          profileUrl: account.account_id // Also send the full URL for LinkedIn/YouTube
        }
      });
      
      if (error) throw error;
      setAnalysis?.(data);
      
      // Refresh subscription to update analysis count
      refreshSubscription();
      
      toast({
        title: "Análise Concluída",
        description: `${platform} analisado com sucesso!`
      });
    } catch (error: any) {
      console.error(`Error analyzing ${platform}:`, error);
      toast({
        title: "Erro",
        description: error.message || `Erro ao analisar ${platform}`,
        variant: "destructive"
      });
    } finally {
      setLoading?.(false);
    }
  };
  // Steps for how it works section
  const steps = [{
    icon: Plug,
    title: "Conecte",
    description: "Conecte suas redes sociais em segundos"
  }, {
    icon: Sparkles,
    title: "Analise",
    description: "Nossa IA analisa todo o seu perfil"
  }, {
    icon: TrendingUp,
    title: "Cresça",
    description: "Implemente as sugestões e escale"
  }];

  // Demo chart data for leads & sales
  const demoChartData = [
    { name: 'Jan', leads: 45, vendas: 28 },
    { name: 'Fev', leads: 62, vendas: 38 },
    { name: 'Mar', leads: 78, vendas: 52 },
    { name: 'Abr', leads: 95, vendas: 65 },
    { name: 'Mai', leads: 112, vendas: 78 },
    { name: 'Jun', leads: 138, vendas: 95 },
  ];

  // Show Action Plan modal
  if (showActionPlan) {
    const analysisMap: Record<string, SocialAnalysis | null> = {
      instagram: instagramAnalysis,
      facebook: facebookAnalysis,
      tiktok: tiktokAnalysis,
      youtube: youtubeAnalysis,
      linkedin: linkedinAnalysis
    };
    return <div className="space-y-6">
        <motion.div initial={{
        opacity: 0,
        x: -20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.3
      }}>
          <Button variant="ghost" onClick={() => setShowActionPlan(null)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar às Análises
          </Button>
        </motion.div>
        
        <AIActionPlan platform={showActionPlan} score={analysisMap[showActionPlan.toLowerCase()]?.score} />
      </div>;
  }

  // Show dashboard if we have a full analysis
  if (showDashboard && websiteAnalysis) {
    return <div className="space-y-6">
        <motion.div initial={{
        opacity: 0,
        x: -20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.3
      }}>
          <Button variant="ghost" onClick={() => setShowDashboard(false)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar às Análises
          </Button>
        </motion.div>
        
        <WebsiteAuditDashboard analysis={websiteAnalysis} />
        <WhatsAppFloatingButton score={websiteAnalysis.overall_score} />
      </div>;
  }
  return <div className="space-y-8">
      {/* Clean Hero Section - No 3D Brain */}
      <section className="relative py-8">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none rounded-3xl" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.2 }} 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Powered by AI</span>
          </motion.div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            A Sua{" "}
            <span className="text-gradient">Agência de Marketing</span>{" "}
            Pessoal com IA
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Analise, automatize e venda mais rápido. Insights profissionais para escalar o seu negócio.
          </p>

          {/* Website Input - Clean Card */}
          <div className="glass-card rounded-2xl p-6 max-w-xl mx-auto">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website-url" className="flex items-center gap-2 justify-center">
                  <Globe className="h-4 w-4 text-primary" />
                  URL do Website
                </Label>
                <Input 
                  id="website-url" 
                  placeholder="https://seusite.com" 
                  className="bg-background/50 border-border/50 text-center" 
                  value={websiteUrl} 
                  onChange={e => setWebsiteUrl(e.target.value)} 
                  disabled={loadingWebsite} 
                />
              </div>
              {/* Analysis Counter for Free users */}
              {!isPro && !isTrial && (
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <span>Análises: </span>
                  <span className={`ml-1 font-medium ${analysisCount >= analysisLimit ? "text-destructive" : "text-primary"}`}>
                    {analysisCount}/{analysisLimit}
                  </span>
                </div>
              )}
              
              <Button 
                className={`w-full ${canAnalyze ? 'bg-primary text-primary-foreground hover:bg-primary/90 glow-neon' : 'bg-muted text-muted-foreground'}`} 
                onClick={handleAnalyzeClick} 
                disabled={loadingWebsite}
              >
                {loadingWebsite ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </> : !canAnalyze ? <>
                    <Lock className="mr-2 h-4 w-4" />
                    Limite Atingido - Fazer Upgrade
                  </> : <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analisar Website
                  </>}
              </Button>
            </div>
          </div>

          {/* Social Media Icons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className="text-sm text-muted-foreground">Analisamos também:</span>
            <div className="flex items-center gap-3">
              <Instagram className="h-5 w-5 text-pink-500" />
              <Facebook className="h-5 w-5 text-blue-600" />
              <TikTokIcon className="h-5 w-5" />
              <YouTubeIcon className="h-5 w-5 text-red-500" />
              <LinkedInIcon className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section className="py-8">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">
            Como <span className="text-gradient">Funciona</span>
          </h2>
          <p className="text-muted-foreground">
            Três passos para transformar sua presença digital
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => <motion.div key={step.title} initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: index * 0.15
        }} className="glass-card-hover rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-primary font-bold text-sm mb-1">Passo {index + 1}</div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </motion.div>)}
        </div>
      </section>

      {/* Performance Chart Section */}
      <section className="py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">
            Crescimento <span className="text-gradient">Projetado</span>
          </h2>
          <p className="text-muted-foreground">
            Visualize o potencial de crescimento do seu negócio
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-border p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demoChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    name="Leads"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="#22c55e" 
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                    name="Vendas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Vendas</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Professional Reports CTA - Clean */}
      {websiteAnalysis && (
        <section className="py-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="glass-card rounded-xl p-6 flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Relatório Profissional
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Exporte sua análise completa em PDF
              </p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <FileText className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>
          </motion.div>
        </section>
      )}

      {/* Social Media Analysis Grid */}
      <section>
        <motion.h2 className="text-xl font-semibold mb-6 text-foreground" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.2
      }}>
          Análise de Redes Sociais
        </motion.h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SocialMediaCard platform="Instagram" icon={Instagram} iconColor="text-pink-500" description="Métricas e insights da sua conta do Instagram" isConnected={instagramConnected} isLoading={loadingInstagram} analysis={instagramAnalysis} onConnect={() => handleConnectSocial("Instagram")} onAnalyze={() => handleAnalyzeSocial("instagram")} onShowActionPlan={() => setShowActionPlan("Instagram")} delay={0.2} />

          <SocialMediaCard platform="Facebook" icon={Facebook} iconColor="text-blue-600" description="Métricas e insights da sua página do Facebook" isConnected={facebookConnected} isLoading={loadingFacebook} analysis={facebookAnalysis} onConnect={() => handleConnectSocial("Facebook")} onAnalyze={() => handleAnalyzeSocial("facebook")} onShowActionPlan={() => setShowActionPlan("Facebook")} delay={0.3} />

          <SocialMediaCard platform="TikTok" icon={({
          className
        }) => <TikTokIcon className={className} />} iconColor="text-foreground" description="Análise de performance e tendências do TikTok" isConnected={tiktokConnected} isLoading={loadingTiktok} analysis={tiktokAnalysis} onConnect={() => handleConnectSocial("TikTok")} onAnalyze={() => handleAnalyzeSocial("tiktok")} onShowActionPlan={() => setShowActionPlan("TikTok")} delay={0.4} />

          <SocialMediaCard platform="YouTube" icon={({
          className
        }) => <YouTubeIcon className={className} />} iconColor="text-red-500" description="Métricas de canal e análise de vídeos" isConnected={youtubeConnected} isLoading={loadingYoutube} analysis={youtubeAnalysis} onConnect={() => handleConnectSocial("YouTube")} onAnalyze={() => handleAnalyzeSocial("youtube")} onShowActionPlan={() => setShowActionPlan("YouTube")} delay={0.5} />

          <SocialMediaCard platform="LinkedIn" icon={({
          className
        }) => <LinkedInIcon className={className} />} iconColor="text-blue-500" description="Análise de perfil profissional e empresa" isConnected={linkedinConnected} isLoading={loadingLinkedin} analysis={linkedinAnalysis} onConnect={() => handleConnectSocial("LinkedIn")} onAnalyze={() => handleAnalyzeSocial("linkedin")} onShowActionPlan={() => setShowActionPlan("LinkedIn")} delay={0.6} />
        </div>
      </section>

      {/* Lead Capture Modal */}
      <LeadCaptureModal isOpen={showLeadModal} onClose={() => setShowLeadModal(false)} onSubmit={handleLeadSubmit} websiteUrl={websiteUrl} />

      {/* Loading Steps Overlay */}
      <AnalysisLoadingSteps isLoading={showLoadingSteps} />

      {/* Social Connect Modal */}
      {connectModal && <SocialConnectModal isOpen={connectModal.isOpen} onClose={() => setConnectModal(null)} platform={connectModal.platform} platformIcon={getPlatformIcon(connectModal.platform)} onSuccess={handleConnectionSuccess} />}
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
        featureName={`Análises ilimitadas (${analysisCount}/${analysisLimit} utilizadas)`} 
      />
    </div>;
};
export default AnalysisPage;