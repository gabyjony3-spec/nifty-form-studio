import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Palette, 
  FileText, 
  TrendingUp, 
  Lightbulb,
  Target,
  CheckCircle2
} from "lucide-react";

interface AIActionPlanProps {
  platform: string;
  score?: number;
  suggestions?: {
    bioOptimization?: string;
    colorPalette?: string[];
    contentIdeas?: string[];
    hashtags?: string[];
    postingSchedule?: string;
    engagementTips?: string[];
  };
}

const AIActionPlan = ({ platform, score = 0, suggestions }: AIActionPlanProps) => {
  // Generate default suggestions based on platform and score
  const defaultSuggestions = {
    bioOptimization: score < 70 
      ? `Otimize sua bio do ${platform} incluindo palavras-chave relevantes, um CTA claro e emojis estratégicos para aumentar a taxa de conversão.`
      : `Sua bio está boa! Considere adicionar um link personalizado com Linktree ou similar para múltiplos destinos.`,
    colorPalette: ["#00d2ff", "#0066cc", "#1a1a2e", "#ffffff", "#ff6b6b"],
    contentIdeas: [
      "Carrossel educativo sobre seu nicho",
      "Bastidores do seu negócio (behind the scenes)",
      "Depoimentos de clientes em vídeo curto",
      "Tutorial rápido resolvendo uma dor do cliente",
      "Post de antes e depois mostrando resultados"
    ],
    hashtags: ["#marketing", "#empreendedorismo", "#negocios", "#dicas", "#crescimento"],
    postingSchedule: "Poste de 3-5 vezes por semana, priorizando terças, quartas e quintas entre 18h-21h",
    engagementTips: [
      "Responda comentários nos primeiros 30 minutos",
      "Use CTAs claros em cada post",
      "Faça perguntas para gerar interação",
      "Use Stories diariamente para manter relevância"
    ]
  };

  const data = suggestions || defaultSuggestions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="glass-card border-primary/20 overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-primary/5">
          <CardTitle className="flex items-center gap-3 text-foreground">
            <div className="p-2 rounded-lg bg-primary/10 glow-soft">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-xl">Plano de Ação IA</span>
              <p className="text-sm font-normal text-muted-foreground mt-1">
                Sugestões personalizadas para {platform}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Bio Optimization */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-foreground">Otimização de Bio (SEO Social)</h4>
            </div>
            <p className="text-muted-foreground text-sm pl-7">
              {data.bioOptimization}
            </p>
          </div>

          {/* Color Palette */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-foreground">Paleta de Cores Sugerida</h4>
            </div>
            <div className="flex gap-2 pl-7">
              {data.colorPalette?.map((color, index) => (
                <div key={index} className="group relative">
                  <div 
                    className="w-10 h-10 rounded-lg border border-border/50 cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Content Ideas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-foreground">Ideias de Conteúdo</h4>
            </div>
            <ul className="space-y-2 pl-7">
              {data.contentIdeas?.map((idea, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hashtags */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-foreground">Hashtags Recomendadas</h4>
            </div>
            <div className="flex flex-wrap gap-2 pl-7">
              {data.hashtags?.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Posting Schedule */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-foreground">Calendário de Posts</h4>
            </div>
            <p className="text-muted-foreground text-sm pl-7">
              {data.postingSchedule}
            </p>
          </div>

          {/* Engagement Tips */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Dicas Rápidas de Engajamento
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              {data.engagementTips?.map((tip, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-sm text-muted-foreground"
                >
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AIActionPlan;
