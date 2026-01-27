import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, CheckCircle2, Rocket, AlertTriangle, TrendingUp } from "lucide-react";

interface StrategicItem {
  title: string;
  description: string;
  impact?: string;
  urgency?: string;
}

interface StrategicSectionProps {
  type: "strengths" | "opportunities" | "alerts" | "traffic";
  items?: StrategicItem[];
  trafficData?: {
    domain_authority: string;
    monthly_potential: string;
    insight: string;
  };
  delay?: number;
}

const sectionConfig: Record<string, { 
  title: string; 
  icon: LucideIcon; 
  bgColor: string;
  borderColor: string;
  iconColor: string;
  emoji: string;
}> = {
  strengths: {
    title: "Pontos Fortes",
    icon: CheckCircle2,
    bgColor: "bg-green-500/5",
    borderColor: "border-green-500/20",
    iconColor: "text-green-500",
    emoji: "✅"
  },
  opportunities: {
    title: "Oportunidades de Crescimento",
    icon: Rocket,
    bgColor: "bg-blue-500/5",
    borderColor: "border-blue-500/20",
    iconColor: "text-blue-500",
    emoji: "🚀"
  },
  alerts: {
    title: "Alertas Críticos",
    icon: AlertTriangle,
    bgColor: "bg-red-500/5",
    borderColor: "border-red-500/20",
    iconColor: "text-red-500",
    emoji: "⚠️"
  },
  traffic: {
    title: "Estimativa de Tráfego",
    icon: TrendingUp,
    bgColor: "bg-purple-500/5",
    borderColor: "border-purple-500/20",
    iconColor: "text-purple-500",
    emoji: "📊"
  }
};

const StrategicSection = ({ type, items, trafficData, delay = 0 }: StrategicSectionProps) => {
  const config = sectionConfig[type];
  const Icon = config.icon;

  const getImpactBadge = (impact?: string) => {
    if (!impact) return null;
    switch (impact.toLowerCase()) {
      case "alto":
        return <Badge className="bg-green-500/20 text-green-600 text-xs">Alto Impacto</Badge>;
      case "médio":
        return <Badge className="bg-yellow-500/20 text-yellow-600 text-xs">Médio Impacto</Badge>;
      case "baixo":
        return <Badge className="bg-muted text-muted-foreground text-xs">Baixo Impacto</Badge>;
      default:
        return null;
    }
  };

  const getUrgencyBadge = (urgency?: string) => {
    if (!urgency) return null;
    switch (urgency.toLowerCase()) {
      case "urgente":
      case "alta":
        return <Badge className="bg-red-500/20 text-red-600 text-xs">Urgente</Badge>;
      case "importante":
      case "média":
        return <Badge className="bg-orange-500/20 text-orange-600 text-xs">Importante</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{urgency}</Badge>;
    }
  };

  const getAuthorityBadge = (authority?: string) => {
    if (!authority) return null;
    switch (authority.toLowerCase()) {
      case "alta":
        return <Badge className="bg-green-500/20 text-green-600">Alta</Badge>;
      case "média":
        return <Badge className="bg-yellow-500/20 text-yellow-600">Média</Badge>;
      case "baixa":
        return <Badge className="bg-red-500/20 text-red-600">Baixa</Badge>;
      default:
        return <Badge variant="outline">{authority}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className={`${config.bgColor} ${config.borderColor} border`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
            <span>{config.emoji} {config.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {type === "traffic" && trafficData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Autoridade do Domínio</p>
                  <div className="flex items-center gap-2">
                    {getAuthorityBadge(trafficData.domain_authority)}
                  </div>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Potencial Mensal</p>
                  <p className="text-lg font-semibold text-foreground">{trafficData.monthly_potential}</p>
                </div>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Insight</p>
                <p className="text-foreground">{trafficData.insight}</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {items?.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.1 * index }}
                  className="p-3 bg-background/50 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <div className="flex gap-1">
                      {getImpactBadge(item.impact)}
                      {getUrgencyBadge(item.urgency)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StrategicSection;
