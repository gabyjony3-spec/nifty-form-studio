import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Calendar, BookOpen, Star, Heart, MessageCircle, ShoppingCart, Target } from "lucide-react";

interface ContentPlan {
  weekly_frequency: number;
  content_distribution: {
    educativo: number;
    autoridade: number;
    emocional: number;
    engajamento: number;
    venda: number;
  };
  weekly_themes: Array<{
    week: number;
    theme: string;
    focus: string;
  }>;
}

interface MonthlyContentPlanProps {
  plan?: ContentPlan;
  niche?: string;
}

const CONTENT_TYPES = [
  { key: "educativo", label: "Educativo", icon: BookOpen, color: "bg-blue-500" },
  { key: "autoridade", label: "Autoridade", icon: Star, color: "bg-amber-500" },
  { key: "emocional", label: "Emocional", icon: Heart, color: "bg-pink-500" },
  { key: "engajamento", label: "Engajamento", icon: MessageCircle, color: "bg-green-500" },
  { key: "venda", label: "Venda", icon: ShoppingCart, color: "bg-purple-500" },
];

const DEFAULT_PLAN: ContentPlan = {
  weekly_frequency: 5,
  content_distribution: {
    educativo: 40,
    autoridade: 20,
    emocional: 15,
    engajamento: 15,
    venda: 10,
  },
  weekly_themes: [
    { week: 1, theme: "Fundamentos", focus: "Consciência" },
    { week: 2, theme: "Autoridade", focus: "Educação" },
    { week: 3, theme: "Resultados", focus: "Prova Social" },
    { week: 4, theme: "Conversão", focus: "Ofertas" },
  ],
};

export function MonthlyContentPlan({ plan, niche }: MonthlyContentPlanProps) {
  const contentPlan = plan || DEFAULT_PLAN;
  const distribution = contentPlan.content_distribution;

  return (
    <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/10 to-transparent shadow-[0_0_15px_rgba(245,158,11,0.1)]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <Calendar className="h-5 w-5" />
            Plano de Conteúdo Mensal
          </div>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50">
            {contentPlan.weekly_frequency} posts/semana
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Distribution */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" />
            Distribuição de Conteúdo
          </h4>
          
          <div className="space-y-2">
            {CONTENT_TYPES.map((type, index) => {
              const value = distribution[type.key as keyof typeof distribution] || 0;
              const Icon = type.icon;
              
              return (
                <motion.div
                  key={type.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{type.label}</span>
                    </div>
                    <span className="text-amber-300 font-medium">{value}%</span>
                  </div>
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                      className={`h-full ${type.color} rounded-full`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Weekly Themes */}
        <div className="space-y-3 pt-4 border-t border-amber-500/20">
          <h4 className="text-sm font-medium text-muted-foreground">
            Temas Semanais
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contentPlan.weekly_themes.map((week, index) => (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                    Semana {week.week}
                  </Badge>
                </div>
                <p className="font-medium text-sm text-white">{week.theme}</p>
                <p className="text-xs text-muted-foreground">Foco: {week.focus}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Tip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
        >
          <div className="flex items-start gap-2">
            <span className="text-amber-400">💡</span>
            <p className="text-xs text-muted-foreground">
              <strong className="text-amber-400">Dica da IA:</strong> Comece cada semana com conteúdo educativo para atrair, 
              depois avance para autoridade e termine com CTAs de conversão.
            </p>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
