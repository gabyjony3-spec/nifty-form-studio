import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { ReactNode } from "react";

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

interface SocialMediaCardProps {
  platform: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  description: string;
  isConnected: boolean;
  isLoading: boolean;
  analysis: SocialAnalysis | null;
  onConnect: () => void;
  onAnalyze: () => void;
  onShowActionPlan?: () => void;
  delay?: number;
}

const SocialMediaCard = ({
  platform,
  icon: Icon,
  iconColor = "text-primary",
  description,
  isConnected,
  isLoading,
  analysis,
  onConnect,
  onAnalyze,
  onShowActionPlan,
  delay = 0
}: SocialMediaCardProps) => {
  const getConnectButtonStyle = () => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600";
      case 'facebook':
        return "bg-[#1877F2] text-white hover:bg-[#1877F2]/90";
      case 'tiktok':
        return "bg-black text-white hover:bg-black/90 border border-white/20";
      case 'youtube':
        return "bg-[#FF0000] text-white hover:bg-[#FF0000]/90";
      case 'linkedin':
        return "bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90";
      default:
        return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="glass-card-hover border-border/50 h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${iconColor}`} />
              <CardTitle className="text-foreground">Análise do {platform}</CardTitle>
            </div>
            {isConnected ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive/50" />
            )}
          </div>
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 text-center">
                <Icon className={`h-10 w-10 mx-auto mb-3 ${iconColor} opacity-50`} />
                <p className="text-sm text-muted-foreground mb-4">
                  Conecte sua conta do {platform} para receber análises e sugestões personalizadas
                </p>
              </div>
              <Button 
                className={`w-full ${getConnectButtonStyle()}`}
                onClick={onConnect}
              >
                <Icon className="mr-2 h-4 w-4" />
                Conectar {platform}
              </Button>
            </div>
          ) : (
            <>
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-neon"
                onClick={onAnalyze}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analisar {platform}
                  </>
                )}
              </Button>
            </>
          )}

          {analysis && analysis.followers !== undefined && (
            <motion.div 
              className="space-y-4 pt-4 border-t border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <span className="text-muted-foreground text-xs">Seguidores</span>
                  <p className="font-semibold text-foreground text-lg">
                    {typeof analysis.followers === 'number' ? analysis.followers.toLocaleString() : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <span className="text-muted-foreground text-xs">Engajamento</span>
                  <p className="font-semibold text-foreground text-lg">
                    {typeof analysis.engagement_rate === 'number' ? `${analysis.engagement_rate}%` : '—'}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground text-sm">Score Geral</span>
                  <span className="text-2xl font-bold text-primary">
                    {typeof analysis.score === 'number' ? analysis.score : 0}
                  </span>
                </div>
                <Progress value={typeof analysis.score === 'number' ? analysis.score : 0} className="h-2" />
              </div>

              <div className="space-y-3">
                {analysis.strengths && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h4 className="font-semibold text-green-400 text-sm mb-1">Pontos Fortes</h4>
                    <p className="text-xs text-muted-foreground">{analysis.strengths}</p>
                  </div>
                )}

                {analysis.weaknesses && (
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <h4 className="font-semibold text-orange-400 text-sm mb-1">Pontos a Melhorar</h4>
                    <p className="text-xs text-muted-foreground">{analysis.weaknesses}</p>
                  </div>
                )}
              </div>

              {onShowActionPlan && (
                <Button 
                  variant="outline" 
                  className="w-full border-primary/30 hover:bg-primary/10"
                  onClick={onShowActionPlan}
                >
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  Ver Plano de Ação IA
                </Button>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SocialMediaCard;
