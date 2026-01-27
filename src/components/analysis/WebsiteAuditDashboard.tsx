import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Search, Zap, Layout, Target, Rocket, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ScoreCircle from "./ScoreCircle";
import MetricCard from "./MetricCard";
import ActionTable, { ActionItem } from "./ActionTable";
import StrategicSection from "./StrategicSection";
import ExportPdfButton from "./ExportPdfButton";
import CampaignLoadingSteps from "./CampaignLoadingSteps";

interface StrategicItem {
  title: string;
  description: string;
  impact?: string;
  urgency?: string;
}

interface TrafficEstimate {
  domain_authority: string;
  monthly_potential: string;
  insight: string;
}

interface FullReport {
  vision_overview?: string;
  strengths?: StrategicItem[];
  opportunities?: StrategicItem[];
  critical_alerts?: StrategicItem[];
  traffic_estimate?: TrafficEstimate;
  action_items?: ActionItem[];
}

interface WebsiteAnalysis {
  id: string;
  url: string;
  overall_score: number;
  seo_score: number;
  speed_score: number;
  structure_score: number;
  conversion_score: number;
  copywriting_score?: number;
  recommendations?: string;
  full_report?: FullReport;
  analyzed_at: string;
}

interface WebsiteAuditDashboardProps {
  analysis: WebsiteAnalysis;
}

const WebsiteAuditDashboard = ({ analysis }: WebsiteAuditDashboardProps) => {
  const navigate = useNavigate();
  const [generatingCampaign, setGeneratingCampaign] = useState(false);

  const fullReport = analysis.full_report || {};
  
  // Parse recommendations into action items if full_report doesn't have them
  const actionItems: ActionItem[] = fullReport.action_items || parseRecommendations(analysis.recommendations);

  // Generate default items if not present
  const strengths = fullReport.strengths || generateDefaultStrengths(analysis);
  const opportunities = fullReport.opportunities || generateDefaultOpportunities(analysis);
  const criticalAlerts = fullReport.critical_alerts || generateDefaultAlerts(analysis);
  const trafficEstimate = fullReport.traffic_estimate || generateDefaultTraffic(analysis);
  const visionOverview = fullReport.vision_overview || generateDefaultVision(analysis);

  const handleGenerateCampaign = async () => {
    setGeneratingCampaign(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Precisa estar autenticado para gerar uma campanha.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-ad-campaign", {
        body: {
          websiteUrl: analysis.url,
          analysisData: {
            id: analysis.id,
            overall_score: analysis.overall_score,
            seo_score: analysis.seo_score,
            speed_score: analysis.speed_score,
            conversion_score: analysis.conversion_score,
            recommendations: analysis.recommendations,
          },
          userId: user.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Campanha gerada!",
        description: "A sua campanha de Meta Ads foi criada com sucesso.",
      });

      // Navigate to automations page with campaign data
      navigate("/dashboard/automation", { 
        state: { 
          newCampaign: data.campaign,
          openModal: true 
        } 
      });

    } catch (error: any) {
      console.error("Error generating campaign:", error);
      toast({
        title: "Erro ao gerar campanha",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setGeneratingCampaign(false);
    }
  };

  return (
    <>
      <CampaignLoadingSteps isLoading={generatingCampaign} />
      
      <div className="space-y-6" id="audit-dashboard">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Auditoria Estratégica</h2>
              <p className="text-muted-foreground text-sm truncate max-w-md">{analysis.url}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ExportPdfButton 
              elementId="audit-dashboard"
              websiteUrl={analysis.url}
              overallScore={analysis.overall_score}
            />
            
            {/* Generate Campaign Button */}
            <Button
              onClick={handleGenerateCampaign}
              disabled={generatingCampaign}
              className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-primary-foreground glow-neon"
            >
              <Rocket className="h-4 w-4 mr-2" />
              <Sparkles className="h-3 w-3 mr-1" />
              Transformar em Campanha IA
            </Button>
          </div>
        </motion.div>

      {/* Main Score + Metrics Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Score Circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card border-border h-full flex items-center justify-center py-8">
            <ScoreCircle score={analysis.overall_score} />
          </Card>
        </motion.div>

        {/* Metrics Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          <MetricCard
            title="SEO"
            score={analysis.seo_score}
            icon={Search}
            color="#3B82F6"
            delay={0.2}
          />
          <MetricCard
            title="Velocidade"
            score={analysis.speed_score}
            icon={Zap}
            color="#F59E0B"
            delay={0.3}
          />
          <MetricCard
            title="Estrutura"
            score={analysis.structure_score}
            icon={Layout}
            color="#8B5CF6"
            delay={0.4}
          />
          <MetricCard
            title="Conversão"
            score={analysis.conversion_score}
            icon={Target}
            color="#10B981"
            delay={0.5}
          />
        </div>
      </div>

      {/* Vision Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              📋 Visão Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{visionOverview}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Strategic Sections Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <StrategicSection
          type="strengths"
          items={strengths}
          delay={0.7}
        />
        <StrategicSection
          type="opportunities"
          items={opportunities}
          delay={0.8}
        />
      </div>

      {/* Alerts and Traffic */}
      <div className="grid md:grid-cols-2 gap-6">
        <StrategicSection
          type="alerts"
          items={criticalAlerts}
          delay={0.9}
        />
        <StrategicSection
          type="traffic"
          trafficData={trafficEstimate}
          delay={1.0}
        />
      </div>

      {/* Action Table */}
      <ActionTable actions={actionItems} delay={1.1} />
    </div>
    </>
  );
};

// Helper functions to parse/generate content
function parseRecommendations(recommendations?: string): ActionItem[] {
  if (!recommendations) return [];
  
  const lines = recommendations.split(/[•\n]+/).filter(line => line.trim());
  const categories = ["SEO", "Conversão", "Velocidade", "Copywriting", "Estrutura"];
  const impacts: ("alto" | "médio" | "baixo")[] = ["alto", "médio", "baixo"];
  const difficulties: ("fácil" | "médio" | "difícil")[] = ["fácil", "médio", "difícil"];
  
  return lines.slice(0, 6).map((line, index) => ({
    action: line.trim(),
    category: categories[index % categories.length],
    impact: impacts[index % 3],
    difficulty: difficulties[Math.min(index, 2)],
  }));
}

function generateDefaultStrengths(analysis: WebsiteAnalysis): StrategicItem[] {
  const items: StrategicItem[] = [];
  
  if (analysis.seo_score >= 70) {
    items.push({ title: "SEO Bem Estruturado", description: "O site possui boas práticas de SEO implementadas" });
  }
  if (analysis.speed_score >= 70) {
    items.push({ title: "Boa Performance", description: "O tempo de carregamento está dentro do esperado" });
  }
  if (analysis.structure_score >= 70) {
    items.push({ title: "Estrutura Organizada", description: "O código HTML está bem organizado e semântico" });
  }
  if (analysis.conversion_score >= 70) {
    items.push({ title: "Elementos de Conversão", description: "O site possui CTAs e formulários bem posicionados" });
  }
  
  if (items.length === 0) {
    items.push({ title: "Site Funcional", description: "O site está acessível e navegável" });
  }
  
  return items;
}

function generateDefaultOpportunities(analysis: WebsiteAnalysis): StrategicItem[] {
  const items: StrategicItem[] = [];
  
  if (analysis.seo_score < 80) {
    items.push({ title: "Otimização de SEO", description: "Melhorar meta tags e estrutura de headings", impact: "alto" });
  }
  if (analysis.speed_score < 80) {
    items.push({ title: "Melhorar Velocidade", description: "Otimizar imagens e recursos para carregamento mais rápido", impact: "médio" });
  }
  if (analysis.conversion_score < 80) {
    items.push({ title: "Aumentar Conversões", description: "Adicionar mais CTAs e melhorar formulários de captura", impact: "alto" });
  }
  
  return items;
}

function generateDefaultAlerts(analysis: WebsiteAnalysis): StrategicItem[] {
  const items: StrategicItem[] = [];
  
  if (analysis.seo_score < 50) {
    items.push({ title: "SEO Crítico", description: "O site precisa de melhorias urgentes em SEO", urgency: "urgente" });
  }
  if (analysis.speed_score < 50) {
    items.push({ title: "Performance Lenta", description: "O site está muito lento e pode perder visitantes", urgency: "urgente" });
  }
  if (analysis.conversion_score < 50) {
    items.push({ title: "Baixa Conversão", description: "Elementos de conversão ausentes ou mal posicionados", urgency: "importante" });
  }
  
  if (items.length === 0 && analysis.overall_score < 70) {
    items.push({ title: "Revisão Geral Necessária", description: "O site precisa de melhorias em várias áreas", urgency: "importante" });
  }
  
  return items;
}

function generateDefaultTraffic(analysis: WebsiteAnalysis): TrafficEstimate {
  const authority = analysis.overall_score >= 80 ? "alta" : analysis.overall_score >= 50 ? "média" : "baixa";
  const potential = analysis.overall_score >= 80 ? "10.000+ visitantes" : analysis.overall_score >= 50 ? "1.000-5.000 visitantes" : "< 1.000 visitantes";
  
  return {
    domain_authority: authority,
    monthly_potential: potential,
    insight: `Com as otimizações sugeridas, o site tem potencial para aumentar o tráfego em até ${Math.round((100 - analysis.overall_score) * 0.5)}%.`
  };
}

function generateDefaultVision(analysis: WebsiteAnalysis): string {
  if (analysis.overall_score >= 80) {
    return "Este site apresenta uma proposta de valor clara e bem executada. A estrutura geral é sólida e as práticas de conversão estão bem implementadas. Com pequenos ajustes, pode alcançar resultados ainda melhores.";
  } else if (analysis.overall_score >= 60) {
    return "O site possui uma base sólida mas há oportunidades significativas de melhoria. Com foco nas áreas críticas identificadas, pode aumentar consideravelmente seu desempenho e conversões.";
  } else {
    return "O site necessita de atenção em diversas áreas para alcançar seu potencial máximo. Recomenda-se priorizar as correções críticas listadas abaixo para melhorar a experiência do usuário e as taxas de conversão.";
  }
}

export default WebsiteAuditDashboard;
