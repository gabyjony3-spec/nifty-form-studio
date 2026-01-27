import { Lightbulb, TrendingUp, Target, AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface FunnelData {
  visitors: number;
  leads: number;
  qualified: number;
  conversions: number;
}

interface AISuggestionsCardProps {
  data: FunnelData;
}

interface Suggestion {
  icon: React.ElementType;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action?: string;
}

export function AISuggestionsCard({ data }: AISuggestionsCardProps) {
  const suggestions = generateSuggestions(data);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="text-foreground">Sugestões da IA</span>
          <Badge variant="outline" className="ml-auto text-xs border-primary/30 text-primary">
            {suggestions.length} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              p-4 rounded-lg border transition-all duration-200 hover:scale-[1.01]
              ${suggestion.priority === "high" 
                ? "bg-red-500/10 border-red-500/30" 
                : suggestion.priority === "medium"
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-primary/10 border-primary/30"
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                p-2 rounded-lg shrink-0
                ${suggestion.priority === "high" 
                  ? "bg-red-500/20" 
                  : suggestion.priority === "medium"
                  ? "bg-amber-500/20"
                  : "bg-primary/20"
                }
              `}>
                <suggestion.icon className={`
                  h-4 w-4
                  ${suggestion.priority === "high" 
                    ? "text-red-400" 
                    : suggestion.priority === "medium"
                    ? "text-amber-400"
                    : "text-primary"
                  }
                `} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm text-foreground">{suggestion.title}</p>
                  <Badge 
                    variant="outline" 
                    className={`
                      text-[10px] px-1.5 py-0
                      ${suggestion.priority === "high" 
                        ? "border-red-500/50 text-red-400" 
                        : suggestion.priority === "medium"
                        ? "border-amber-500/50 text-amber-400"
                        : "border-primary/50 text-primary"
                      }
                    `}
                  >
                    {suggestion.priority === "high" ? "Urgente" : suggestion.priority === "medium" ? "Médio" : "Dica"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {suggestion.description}
                </p>
                {suggestion.action && (
                  <p className="text-xs text-primary mt-2 font-medium">
                    💡 {suggestion.action}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

function generateSuggestions(data: FunnelData): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  const { visitors, leads, qualified, conversions } = data;
  
  // Check if no data at all
  if (visitors === 0) {
    suggestions.push({
      icon: Target,
      title: "Sem visitantes registados",
      description: "O seu funil ainda não tem dados. Partilhe a página de análise gratuita para começar a captar leads.",
      priority: "high",
      action: "Promova a análise gratuita nas redes sociais"
    });
    return suggestions;
  }
  
  // Calculate conversion rates
  const leadRate = visitors > 0 ? (leads / visitors) * 100 : 0;
  const qualifiedRate = leads > 0 ? (qualified / leads) * 100 : 0;
  const conversionRate = qualified > 0 ? (conversions / qualified) * 100 : 0;
  const overallRate = visitors > 0 ? (conversions / visitors) * 100 : 0;
  
  // Visitor to Lead conversion analysis
  if (leadRate < 30 && visitors > 5) {
    suggestions.push({
      icon: AlertCircle,
      title: "Baixa captação de leads",
      description: `Apenas ${leadRate.toFixed(1)}% dos visitantes se tornam leads. O formulário pode estar a afugentar potenciais clientes.`,
      priority: "high",
      action: "Simplifique o formulário ou melhore o CTA da Landing Page"
    });
  } else if (leadRate >= 30 && leadRate < 50) {
    suggestions.push({
      icon: TrendingUp,
      title: "Captação de leads pode melhorar",
      description: `Taxa de ${leadRate.toFixed(1)}% é boa, mas há espaço para otimização.`,
      priority: "medium",
      action: "Teste diferentes headlines e cores no CTA"
    });
  }
  
  // Lead to Qualified analysis
  if (qualifiedRate < 20 && leads > 3) {
    suggestions.push({
      icon: Target,
      title: "Poucos leads qualificados",
      description: `Apenas ${qualifiedRate.toFixed(1)}% dos leads estão qualificados. Reveja os critérios de qualificação ou o perfil do público.`,
      priority: "high",
      action: "Adicione perguntas de qualificação ao formulário"
    });
  }
  
  // Qualified to Conversion analysis
  if (conversionRate < 10 && qualified > 2) {
    suggestions.push({
      icon: Lightbulb,
      title: "Taxa de conversão baixa",
      description: `Com ${conversionRate.toFixed(1)}% de conversão, o follow-up pode estar a falhar. Considere automações de nutrição.`,
      priority: "medium",
      action: "Implemente sequências de email e WhatsApp automatizadas"
    });
  }
  
  // Overall success
  if (overallRate >= 5 && conversions > 0) {
    suggestions.push({
      icon: Sparkles,
      title: "Funil a funcionar bem!",
      description: `Taxa de conversão geral de ${overallRate.toFixed(1)}% está acima da média. Continue a otimizar!`,
      priority: "low"
    });
  }
  
  // No conversions but has qualified leads
  if (conversions === 0 && qualified > 0) {
    suggestions.push({
      icon: AlertCircle,
      title: "Leads qualificados sem conversão",
      description: "Tem leads qualificados mas nenhuma conversão. O processo de venda precisa de atenção.",
      priority: "high",
      action: "Reveja a proposta de valor ou ofereça uma call de demonstração"
    });
  }
  
  return suggestions.slice(0, 4); // Limit to 4 suggestions
}
